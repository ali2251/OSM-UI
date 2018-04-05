
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
 * Node configuration routes module.
 * Provides a RESTful API to provide configuration
 * details such as api_server.
 * @module framework/core/modules/routes/configuration
 * @author Kiran Kashalkar <kiran.kashalkar@riftio.com>
 */

var cors = require('cors');
var bodyParser = require('body-parser');
var configurationAPI = require('../api/configuration');
var Router = require('express').Router();
var utils = require('../../api_utils/utils');
var CONSTANTS = require('../../api_utils/constants.js');
var request = require('request');
var _ = require('lodash');

Router.use(bodyParser.json());
Router.use(cors());
Router.use(bodyParser.urlencoded({
    extended: true
}));

Router.put('/server-configuration', cors(), function(req, res) {
    configurationAPI.update(req).then(function(data) {
        utils.sendSuccessResponse(data, res);
	}, function(error) {
		utils.sendErrorResponse(error, res);
	});
});

Router.get('/server-configuration', cors(), function(req, res) {
    configurationAPI.get(req).then(function(data) {
        utils.sendSuccessResponse(data, res);
    }, function(error) {
        utils.sendErrorResponse(error, res);
    });
});


module.exports = Router;
