/**
 * node-bluez/lib/gatt/gatt.js
 */
'use strict';

var debug = require('debug')('gatt');

var DBus = require('dbus');
var dbus = new DBus();

var BLUEZ_SERVICE_NAME = 'org.bluez';
var GATT_MANAGER_IFACE = 'org.bluez.GattManager1';
var DBUS_OM_IFACE = 'org.freedesktop.DBus.ObjectManager';

var GATT_ADAPTER_IFACE = 'org.bluez.Adapter1';
var GATT_SERVICE_IFACE = 'org.bluez.GattService1';
var GATT_CHRC_IFACE =    'org.bluez.GattCharacteristic1';
var GATT_DESC_IFACE =    'org.bluez.GattDescriptor1';

var GATT = module.exports = function GATT(){
    this.bus = dbus.getBus('system');
    this.rootPath = null;
    this.services = [];

    var bus = this.bus;

    this.dbusService = bus.dbus.registerService('system', 'org.bluez');
    var self = this;
    bus.getInterface(BLUEZ_SERVICE_NAME, '/', DBUS_OM_IFACE,
        function OnReceiveInterface(err, iface){
            if (err){
                console.log(err);
                return;
            }
            debug('getInterface:\n\tService - ' + BLUEZ_SERVICE_NAME + '\n\tobject: /\n\tinterface: ' +
                DBUS_OM_IFACE);

            iface.GetManagedObjects['timeout'] = 1500;
            iface.GetManagedObjects['finish'] = function OnFinishGetManagedObjects(objects){
                var adapterObjectPath = null;
                var managedObjectKeys = Object.keys(objects);
                var i = 0;
                var ii = managedObjectKeys.length;
                for(; i < ii; i++){
                    var key = managedObjectKeys[i];
                    if(objects[key].hasOwnProperty(GATT_MANAGER_IFACE)){
                        adapterObjectPath = key;
                        break;
                    }
                }

                if (!adapterObjectPath){
                    debug('adapter: failed to locate proper adapter');
                    return;
                }

                // Have the service path be of the format org/bluez/{msDate}/{hci0,hci1,...}/dev_XX_XX_XX_XX_XX_XX/serviceXX
                var adapter = adapterObjectPath.split('/')[2];

                // Find the hci interface MAC address and transform 12:34:56:78:90 -> 12_34_56_78_90
                var address = objects[adapterObjectPath][GATT_ADAPTER_IFACE].Address.split(':').join('_');
                self.rootPath = '/org/bluez/' + process.pid + '/' + adapter + '/' + 'dev_' + address + '/';
                debug('rootPath set: \n\t' + self.rootPath);

                bus.getInterface(BLUEZ_SERVICE_NAME, adapterObjectPath, GATT_MANAGER_IFACE,
                    function (error, serviceManager){
                        if (error){
                            debug('serviceManager: Error acquiring service manager\n' + error);
                            return;
                        }

                        self.serviceManager = serviceManager;
                    });
            };
            iface.GetManagedObjects();
        });
};

GATT.prototype.Characteristic = require('./characteristic');
GATT.prototype.descriptor = require('./descriptor');
GATT.prototype.Service = require('./service');

GATT.prototype.registerService = function RegisterGATTService(service, cb){
    var serviceManager = this.serviceManager;

    debug('registerService: Attempting to register GATT service\n\tService: ' + service.path);

    serviceManager['timeout'] = 1500;
    serviceManager['finish'] = function OnFinishRegisterService(){
        debug('registerService: Successfully registered GATT Service');
        if (cb){
            cb();
        }
    };
    serviceManager['error'] = function OnRegisterServiceError(error){
        debug('registerService: Error on attempting to register GATT service\n' + error);
        cb(error);
    };

    service.initBus(this.dbusService);
    serviceManager.RegisterService(service.path, {});
};

GATT.prototype.unregisterService = function UnregisterGATTService(){

};
