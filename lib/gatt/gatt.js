var DBus = require('dbus');
var debug = require('debug')('gatt');

var BLUEZ_SERVICE_NAME = 'org.bluez';
var GATT_MANAGER_IFACE = 'org.bluez.GattManager1';
var DBUS_OM_IFACE =      'org.freedesktop.DBus.ObjectManager';
var DBUS_PROP_IFACE =    'org.freedesktop.DBus.Properties';

var GATT_ADAPTER_IFACE = 'org.bluez.Adapter1';
var GATT_SERVICE_IFACE = 'org.bluez.GattService1';
var GATT_CHRC_IFACE =    'org.bluez.GattCharacteristic1';
var GATT_DESC_IFACE =    'org.bluez.GattDescriptor1';

var GATT = module.exports = function GATT(bus){
    this.bus = bus;
    this.rootPath = null;
    this.services = [];

    this.init();
};

GATT.prototype.init = function OnInitializeGATT(){
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
                var address = objects[adapterObjectPath][GATT_ADAPTER_IFACE].Address.split(':').join('_');
                self.rootPath = '/org/bluez/' + Date.now() + '/' + adapter + '/' + 'dev_' + address + '/';
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

GATT.prototype.registerService = function RegisterGATTService(service){
    var serviceManager = this.serviceManager;

    debug('registerService: Attempting to register GATT service\n' + service.toString());

    serviceManager['timeout'] = 1500;
    serviceManager['finish'] = function OnFinishRegisterService(){
        debug('registerService: Successfully registered GATT Service');
    };
    serviceManager['error'] = function OnRegisterServiceError(error){
        debug('registerService: Error on attempting to register GATT service\n' + error);
    };
    serviceManager.RegisterService(service, {});
};

GATT.prototype.unregisterService = function UnregisterGATTService(){

};
