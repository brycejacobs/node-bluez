/**
 * node-bluez/lib/bluez.js
 */
'use strict';

var DBus = require('dbus');
var dbus = new DBus();
var debug = require('debug')('bluez');

var DBUS_SYSTEM_BUS_ADDRESS = process.env.BLUEZ_SYSTEM_BUS_ADDRESS || Date.now();

var app = {
    bus: dbus.getBus('system'),
    GATT: null
};

exports = module.exports = app;

app.init = function InitializeTheBluez(){
    var gatt = require('./gatt/gatt');
    app.GATT = new gatt(app.bus);

    debug('init');
    return;
};
