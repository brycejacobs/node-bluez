'use strict';

var debug = require('debug')('service');
var DBus = require('dbus');

var GATT_SERVICE_IFACE = 'org.bluez.GattService1';

var DBUS_OM_IFACE = 'org.freedesktop.DBus.ObjectManager';
var DBUS_PROP_IFACE = 'org.freedesktop.DBus.Properties';

var Service = module.exports = function (options){
    debug('options:\n\t' + JSON.stringify(options) + '\n');
    this.characteristics = options.characteristics || [];
    this.path = options.path + 'service' + options.index;
    this.primary = options.primary;
    this.uuid = options.uuid;
};

Service.prototype.getCharacteristicPaths = function GetServiceCharacteristicPaths(){
    var paths = [];
    for (var i = 0; i < this.characteristics.length; i++){
        paths.push(this.characteristics[i].path);
    }

    return paths;
};

Service.prototype.getProperties = function GetServiceProperties(){
    var properties = {};
    properties[GATT_SERVICE_IFACE] = {
        'UUID': this.uuid,
        'Primary': this.primary,
        'Characteristics': this.getCharacteristicPaths()
    };

    return properties;
};

Service.prototype.initBus = function InitializeServiceBus(service){
    var serviceObject = service.createObject(this.path);
    var self = this;

    var gattServiceInterf = serviceObject.createInterface(GATT_SERVICE_IFACE);
    gattServiceInterf.addProperty('UUID', {
        type: DBus.Define(String),
        getter: function OnGetServiceUUID(callback){
            callback(self.uuid);
        }
    });

    gattServiceInterf.addProperty('Primary', {
        type: DBus.Define(Boolean),
        getter: function OnGetServicePrimaryFlag(callback){
            callback(self.primary);
        }
    });

    gattServiceInterf.addProperty('Characteristics', {
        type: DBus.Define(Array),
        getter: function OnGetServiceCharacteristics(callback){
            callback(self.getCharacteristicPaths());
        }
    });

    var dbusOmInterf = serviceObject.createInterface(DBUS_OM_IFACE);
    dbusOmInterf.addMethod('GetManagedObjects', { out: 'a{oa{sa{sv}}}' },
        function GetManagedObjects(callback){
            var response = {};
            // object{objectPath: {string: object}}
            response[self.path] = self.getProperties();

            var characteristics = self.characteristics;
            for(var i = 0; i < characteristics.length; i++){
                var characteristic = characteristics[i];
                response[characteristic.path] = characteristic.getProperties();

                var descriptors = characteristic.descriptors;
                for(var j = 0; j < descriptors.length; j++){
                    var descriptor = descriptors[j];
                    response[descriptor.path] = descriptor.getProperties();
                }
            }

            debug(DBUS_OM_IFACE + '-GetManagedObjects\n\tService: ' + self.path + '\n\tResponse: '
                + JSON.stringify(response) + '\n');
            callback(response);
        });

    // Override function to resemble bluez, this could theoretically be skipped but debugging is nice.
    var propertyInterface = serviceObject.createInterface(DBUS_PROP_IFACE);
    propertyInterface.addMethod('GetAll', { in: 's', out: 'a{sv}'}, function GetAll(interfaceName, callback){
        if (interfaceName !== GATT_SERVICE_IFACE){
            debug(DBUS_PROP_IFACE + '-GetAll Error: org.freedesktop.DBus.Error.InvalidArgs\n');
            callback(new Error('org.freedesktop.DBus.Error.InvalidArgs'));
            return;
        }

        var properties = self.getProperties()[GATT_SERVICE_IFACE];
        debug(DBUS_PROP_IFACE + '-GetAll: Success on retrieving properties.\n\tService@'
            + self.path + '\n\tProperties: ' + properties.toString());
        callback(properties);
    });
};
