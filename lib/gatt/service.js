'use strict';

var debug = require('debug')('service');

var Service = module.exports = function (options){
    debug('options: ' + options.toString());
    this.bus = options.bus;
    this.path = options.path + 'service' + options.index;
    this.primary = options.primary;
    this.uuid = options.uuid;
};
