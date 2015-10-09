/**
 * node-bluez/examples/hello/hello.js
 */
'use strict';

var bluez = require('../../');

var GATT = new bluez.GATT();

var util = require('util');

// TODO(BRYCE ) - this needs to be a constructor call, to avoid calling 'init' in index
var Characteristic = GATT.Characteristic;
var Service = GATT.Service;

function HelloCharacteristic(service){
    Characteristic.call(this, {
        uuid: '13333333-3333-3333-3333-333333333333',
        flags: ['read'],
        index: 0,
        service: service,
        value: 0
    });
}
util.inherits(HelloCharacteristic, Characteristic);


function HelloService(){
    Service.call(this, {
        index: 0,
        path: GATT.rootPath,
        uuid: '13333333-3333-3333-3333-333333333333',
        primary: true
    });

    this.characteristics.push(new HelloCharacteristic(this));
}
util.inherits(HelloService, Service);

module.exports = (function (){
    setTimeout(function (){
        var service = new HelloService();
        GATT.registerService(service, function (error){
            if (error){
                console.log('Error registering service: %s', error.toString());
            } else{
                console.log('Successfully Registered HelloService');
            }
        });
    }, 3000);

}());
