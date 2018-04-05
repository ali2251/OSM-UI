
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
 * Node sessions routes module.
 * Provides a RESTful API to manage sessions.
 * @module framework/core/modules/routes/sessions
 * @author Kiran Kashalkar <kiran.kashalkar@riftio.com>
 */

var cors = require('cors');
var bodyParser = require('body-parser');
var sessionsAPI = require('../api/sessions');
var Router = require('express').Router();
var utils = require('../../api_utils/utils');
var CONSTANTS = require('../../api_utils/constants.js');
var request = require('request');
var _ = require('lodash');

var sessions = {};

sessions.routes = function(sessionsConfig) {
    Router.use(bodyParser.json());
    Router.use(cors());
    Router.use(bodyParser.urlencoded({
        extended: true
    }));

    // Overloaded get method to handle OpenIDConnect redirect to establish a session.
    Router.get('/session*', cors(), /*sessionsConfig.authManager.passport.authenticate('main', {
        noredirect: false
    }), */function(req, res) {
        req.query['api_server'] = sessionsConfig.api_server_protocol + '://' + sessionsConfig.api_server;
        sessionsAPI.create(req, res).then(function(data) {
            utils.sendSuccessResponse(data, res);
        });
    });

    // For project switcher UI
    Router.put('/session/:projectId', cors(), function(req, res) {
        sessionsAPI.addProjectToSession(req, res).then(function(data) {
            utils.sendSuccessResponse(data, res);
        }, function(error) {
            utils.sendErrorResponse(error, res);
        });
    });

    Router.delete('/session', cors(), function(req, res) {
        sessionsAPI.delete(req, res).then(function(data) {
            utils.sendSuccessResponse(data, res);
        });
    });
}

sessions.router = Router;


module.exports = sessions;
