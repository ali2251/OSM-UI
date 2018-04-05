/*
 * STANDARD_RIFT_IO_COPYRIGHT
 */

var app = require('express').Router();
var cors = require('cors');
var utils = require('../../framework/core/api_utils/utils.js')
 // Begin Accounts API

    utils.passThroughConstructor(app);

module.exports = app;
