/*
 *
 *   Copyright 2016 RIFT.IO Inc
 *
 *   Licensed under the Apache License, Version 2.0 (the "License");
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 *
 */

/**
 * inactivity routes module. Provides a RESTful API for this
 * skyquake instance's inactivity state.
 * @module framework/core/modules/routes/inactivity
 * @author Laurence Maultsby <laurence.maultsby@riftio.com>
 */

var cors = require('cors');
var bodyParser = require('body-parser');
var Router = require('express').Router();
var utils = require('../../api_utils/utils');
var ProjectManagementAPI = require('../api/projectManagementAPI.js');

Router.use(bodyParser.json());
Router.use(cors());
Router.use(bodyParser.urlencoded({
    extended: true
}));

Router.get('/project', cors(), function(req, res) {
    ProjectManagementAPI.get(req).then(function(response) {
        utils.sendSuccessResponse(response, res);
    }, function(error) {
        utils.sendErrorResponse(error, res);
    });
});
Router.post('/project', cors(), function(req, res) {
    ProjectManagementAPI.create(req).then(function(response) {
        utils.sendSuccessResponse(response, res);
    }, function(error) {
        utils.sendErrorResponse(error, res);
    });
});
Router.put('/project', cors(), function(req, res) {
    ProjectManagementAPI.update(req).then(function(response) {
        utils.sendSuccessResponse(response, res);
    }, function(error) {
        utils.sendErrorResponse(error, res);
    });
});
Router.delete('/project/:projectname', cors(), function(req, res) {
    ProjectManagementAPI.delete(req).then(function(response) {
        utils.sendSuccessResponse(response, res);
    }, function(error) {
        utils.sendErrorResponse(error, res);
    });
});

Router.put('/platform', cors(), function(req, res) {
    ProjectManagementAPI.updatePlatform(req).then(function(response) {
        utils.sendSuccessResponse(response, res);
    }, function(error) {
        utils.sendErrorResponse(error, res);
    });
});

Router.get('/platform', cors(), function(req, res) {
    ProjectManagementAPI.getPlatform(req).then(function(response) {
        utils.sendSuccessResponse(response, res);
    }, function(error) {
        utils.sendErrorResponse(error, res);
    });
});
module.exports = Router;



