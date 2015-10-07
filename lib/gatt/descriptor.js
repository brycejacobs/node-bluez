'use strict';

var debug = require('debug')('descriptor');

var Descriptor = module.exports = function (options){
    debug('options: ' + options.toString());

    this.bus = options.bus;
    this.characteristic = options.characteristic;
    this.flags = options.flags;
    this.index = options.index;
    this.path = options.characteristic.path + '/desc' + options.index;
    this.uuid = options.uuid;
};
