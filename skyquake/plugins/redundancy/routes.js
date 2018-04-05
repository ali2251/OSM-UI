/*
 * STANDARD_RIFT_IO_COPYRIGHT
 */

var app = require('express').Router();
var cors = require('cors');
var utils = require('../../framework/core/api_utils/utils.js')

var redundancyAPI = require('./api/redundancy.js');

app.get('/config', cors(), function(req, res) {
    redundancyAPI.get(req).then(function(data) {
        utils.sendSuccessResponse(data, res);
    }, function(error) {
        utils.sendErrorResponse(error, res);
    });
});
app.get('/state', cors(), function(req, res) {
    redundancyAPI.getState(req).then(function(data) {
        utils.sendSuccessResponse(data, res);
    }, function(error) {
        utils.sendErrorResponse(error, res);
    });
});
app.post('/site', cors(), function(req, res) {
    redundancyAPI.siteUpdate(req).then(function(data) {
        utils.sendSuccessResponse(data, res);
    }, function(error) {
        utils.sendErrorResponse(error, res);
    });
});
app.put('/config', cors(), function(req, res) {
    redundancyAPI.configUpdate(req).then(function(data) {
        utils.sendSuccessResponse(data, res);
    }, function(error) {
        utils.sendErrorResponse(error, res);
    });
});
app.put('/site/:id', cors(), function(req, res) {
    redundancyAPI.siteUpdate(req).then(function(data) {
        utils.sendSuccessResponse(data, res);
    }, function(error) {
        utils.sendErrorResponse(error, res);
    });
});

app.delete('/site/:id', cors(), function(req, res) {
    redundancyAPI.siteDelete(req).then(function(data) {
        utils.sendSuccessResponse(data, res);
    }, function(error) {
        utils.sendErrorResponse(error, res);
    });
});
utils.passThroughConstructor(app);

module.exports = app;
