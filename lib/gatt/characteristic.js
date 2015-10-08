/**
 * node-bluez/lib/gatt/characteristic.js
 */
'use strict';

var debug = require('debug')('characteristic');
var DBus = require('dbus');

var GATT_CHRC_IFACE = 'org.bluez.GattCharacteristic1';
var DBUS_PROP_IFACE = 'org.freedesktop.DBus.Properties';

var Characteristic = module.exports = function (options){
    debug('options: ' + JSON.stringify(options));

    this.uuid = options.uuid;
    this.service = options.service;
    this.flags = options.flags;
    this.descriptors = options.descriptors || [];
    this.path = options.service.path + '/char' + options.index;
};

Characteristic.prototype.initBus = function InitializeCharacteristicDBus(service){
    var serviceObject = service.createObject(this.path);
    var self = this;

    var gattChrcInterf = serviceObject.createInterface(GATT_CHRC_IFACE);
    gattChrcInterf.addProperty('UUID', {
        type: DBus.Define(String),
        getter: function OnGetCharacteristicUUID(callback){
            debug(GATT_CHRC_IFACE + '-GetProperty\n\tCharacteristic: ' + self.path +
                '\n\tProperty: UUID\n\tUUID: ' + self.uuid);
            callback(self.uuid);
        }
    });

    gattChrcInterf.addProperty('Flags', {
        type: DBus.Define(Array),
        getter: function OnGetCharacteristicFlags(callback){
            debug(GATT_CHRC_IFACE + '-GetProperty\n\tCharacteristic: ' + self.path +
                '\n\tProperty: Flags\n\tFlags: ' + self.flags);
            callback(self.flags);
        }
    });

    gattChrcInterf.addProperty('Characteristics', {
        type: DBus.Define(Array),
        getter: function OnGetCharacteristicDescriptors(callback){
            debug(GATT_CHRC_IFACE + '-GetProperty\n\tCharacteristic: ' + self.path +
                '\n\tProperty: Descriptors\n\tDescriptors: ' + JSON.stringify(self.descriptors));
            callback(self.getDescriptorPaths());
        }
    });

    gattChrcInterf.addMethod('ReadValue', { out: 'ay' }, this.onReadValue.bind(this));
    gattChrcInterf.addMethod('WriteValue', { out: 'ay' }, this.onWriteValue.bind(this));
    gattChrcInterf.addMethod('StartNotifying', {}, this.onStartNotifying.bind(this));
    gattChrcInterf.addMethod('StopNotifying', {}, this.onStopNotifying.bind(this));

    // Override function to resemble bluez, this could theoretically be skipped but debugging is nice.
    var propertyInterface = serviceObject.createInterface(DBUS_PROP_IFACE);
    propertyInterface.addMethod('GetAll', { in: 's', out: 'a{sv}'}, function GetAll(interfaceName, callback){
        if (interfaceName !== GATT_CHRC_IFACE){
            debug(DBUS_PROP_IFACE +
                '-GetAll Error: org.freedesktop.DBus.Error.InvalidArgs\n\tCharacteristic: ' + self.path);
            callback(new Error('org.freedesktop.DBus.Error.InvalidArgs'));
            return;
        }

        var properties = self.getProperties()[GATT_CHRC_IFACE];
        callback(properties);
        debug(DBUS_PROP_IFACE + '-GetAll: Success on retrieving properties.\n\tCharacteristic: '
            + self.path + '\n\tProperties: ' + properties.toString());
    });
};

Characteristic.prototype.getDescriptorPaths = function GetCharacteristicDescriptorPaths(){
    var paths = [];
    var descriptors = this.descriptors;
    for(var i = 0; i < descriptors.length; i++){
        paths.push(descriptors[i].path);
    }

    return paths;
};

Characteristic.prototype.getProperties = function GetCharacteristicProperties(){
    var properties = {};
    properties[GATT_CHRC_IFACE] = {
        'Service': this.service.path,
        'UUID': this.uuid,
        'Flags': this.flags
        //,
        //'Descriptors': this.getDescriptorPaths()
    };
};

Characteristic.prototype.onReadValue = function OnReadCharacteristicValue(callback){
    debug('onReadValue: Called Default Read Value, throwing not supported exception\n\t' +
        'Characteristic: ' + this.path);

    callback(new Error( 'org.bluez.Error.NotSupported'));
};

Characteristic.prototype.onWriteValue = function OnWriteCharacteristicValue(callback){
    debug('onWriteValue: Called Default Write Value, throwing not supported exception\n\t' +
        'Characteristic: ' + this.path);

    callback(new Error( 'org.bluez.Error.NotSupported'));
};

Characteristic.prototype.onStartNotifying = function OnStartNotifyingCharacteristicValue(callback){
    debug('onStartNotifying: Called Default StartNotifying, throwing not supported exception\n\t' +
        'Characteristic: ' + this.path);

    callback(new Error( 'org.bluez.Error.NotSupported'));
};

Characteristic.prototype.onStopNotifying = function OnStopNotifyingValue(callback){
    debug('onStopNotifying: Called Default StopNotifying, throwing not supported exception\n\t' +
        'Characteristic: ' + this.path);

    callback(new Error( 'org.bluez.Error.NotSupported'));
};
