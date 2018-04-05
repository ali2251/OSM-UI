
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
 * navigation routes module. Provides a RESTful API for this
 * skyquake instance's navigation state.
 * @module framework/core/modules/routes/navigation
 * @author Kiran Kashalkar <kiran.kashalkar@riftio.com>
 */

var cors = require('cors');
var bodyParser = require('body-parser');
var navAPI = require('../api/navigation');
var Router = require('express').Router();
var utils = require('../../api_utils/utils');
var configurationAPI = require('../api/configuration');
var csrfCheck = require('../../api_utils/csrf').csrfCheck;

Router.use(bodyParser.json());
Router.use(cors());
Router.use(bodyParser.urlencoded({
    extended: true
}));

//Should have a way of adding excluded routes to this via plugin registry, instead of hard coding
Router.use(/^(?!.*(login\/idp|session|composer\/upload|composer\/update)).*/, function(req, res, next) {
    var api_server = req.query['api_server'] || (req.protocol + '://' + configurationAPI.globalConfiguration.get().api_server);
    if (req.session && req.session.loggedIn) {
        switch (req.method) {
            case 'POST':
            case 'PUT':
                csrfCheck(req, res, next);
                break;
            default:
                next();
                break;
        }
    } else {
        console.log('Redirect to login.html');
        res.redirect(utils.buildRedirectURL(req, configurationAPI.globalConfiguration, 'login', '&referer=' + encodeURIComponent(req.headers.referer)));
    }
});


Router.get('/nav', cors(), function(req, res) {
    navAPI.get(req).then(function(data) {
        utils.sendSuccessResponse(data, res);
    }, function(error) {
        utils.sendErrorResponse(error, res);
    });
});

Router.get('/nav/:plugin_id', cors(), function(req, res) {
    navAPI.get(req).then(function(data) {
        utils.sendSuccessResponse(data, res);
    }, function(error) {
        utils.sendErrorResponse(error, res);
    });
});

Router.post('/nav/:plugin_id', cors(), function(req, res) {
    navAPI.create(req).then(function(data) {
        utils.sendSuccessResponse(data, res);
    }, function(error) {
        utils.sendErrorResponse(error, res);
    });
});

Router.put('/nav/:plugin_id/:route_id', cors(), function(req, res) {
    navAPI.update(req).then(function(data) {
        utils.sendSuccessResponse(data, res);
    }, function(error) {
        utils.sendErrorResponse(error, res);
    });
});

Router.delete('/nav/:plugin_id/:route_id', cors(), function(req, res) {
    navAPI.delete(req).then(function(data) {
        utils.sendSuccessResponse(data, res);
    }, function(error) {
        utils.sendErrorResponse(error, res);
    });
});


module.exports = Router;
