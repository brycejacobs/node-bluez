'use strict';

var debug = require('debug')('characteristic');

var Characteristic = module.exports = function (options){
    debug('options: ' + options.toString());

    this.bus = options.bus;
    this.uuid = options.uuid;
    this.service = options.service;
    this.flags = options.flags;
    this.descriptors = options.descriptors;
    this.path = options.service.path + '/char' + options.index;
};
