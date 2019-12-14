'use strict';

var integration = require('@segment/analytics.js-integration');
var tick = require('next-tick');
var objCase = require('obj-case');
var each = require('@ndhoule/each');
var objectKeys = require('@ndhoule/keys');

/**
 * Expose `Elevio` integration.
 */

var Elevio = module.exports = integration('Elevio')
  .option('accountId', '')
  .global('_elev')
  .tag('<script src="//static.elev.io/js/v3.js">');

/**
 * Initialize elevio.
 */

Elevio.prototype.initialize = function() {
  var self = this;
  window._elev = window._elev || {};
  window._elev.account_id = this.options.accountId;
  window._elev.segment = true;
  this.load(function() {
    tick(self.ready);
  });
};

/**
 * Has the elevio library been loaded yet?
 *
 * @return {Boolean}
 */

Elevio.prototype.loaded = function() {
  return !!window._elev;
};

/**
 * Identify a user.
 *
 * @param {Facade} identify
 */

Elevio.prototype.identify = function(identify) {
  var integrationSettings = identify.options(this.name);
  var name = identify.name();
  var email = identify.email();
  var plan = identify.proxy('traits.plan');
  var traits = identify.traits();
  var user_hash;
  var firstName;
  var lastName;

  // Check for firstName property
  // else check for name
  if (traits.firstName) {
    firstName = traits.firstName;
    lastName = traits.lastName;
  } else if (traits.name) {
    var nameArray = traits.name.split(' ') || [];
    firstName = nameArray.shift();
    lastName = nameArray.pop();
  }

  if (integrationSettings.userHash) user_hash = integrationSettings.userHash;
  if (integrationSettings.user_hash) user_hash = integrationSettings.user_hash;

  var removeTraits = ['id', 'name', 'firstName', 'lastName', 'email'];

  each(function(traitItem) {
    if (traits.hasOwnProperty(traitItem)) {
      objCase.del(traits, traitItem);
    }
  }, removeTraits);

  var user = {};
  user.via = 'segment';
  if (email) user.email = email;
  if (name) user.name = name;
  if (firstName) user.first_name = firstName;
  if (lastName) user.last_name = lastName;
  if (plan) user.plan = [plan];
  if (user_hash) user.user_hash = user_hash;
  if (plan) user.groups = [plan];
  if (objectKeys(traits).length > 0) user.traits = traits;

  if (typeof window._elev.on === 'function') {
    // Customer loading v4
    window._elev.setUser(user);
  } else {
    // Customer loading v3 (deprecated)
    window._elev.user = user;
  }
};
