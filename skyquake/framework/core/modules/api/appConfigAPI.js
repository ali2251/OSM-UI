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
// DescriptorModelMeta API (NSD + VNFD)


var Schema = {};
var request = require('request');
var Promise = require('promise');
var constants = require('../../api_utils/constants');
var utils = require('../../api_utils/utils');
var _ = require('lodash');
var cors = require('cors');
var bodyParser = require('body-parser');
var utils = require('../../api_utils/utils');
var sessionAPI = require('./sessions.js');
var configuration = require('./configuration');

var router = require('express').Router();

router.use(bodyParser.json());
router.use(cors());
router.use(bodyParser.urlencoded({
    extended: true
}));

router.get('/app-config', cors(), function (req, res) {
    getConfig(req).then(function (response) {
        utils.sendSuccessResponse(response, res);
    }, function (error) {
        utils.sendErrorResponse(error, res);
    });
});

var inactivityTimeout = process.env.UI_TIMEOUT_SECS || 600000;

var versionPromise = null;

var init = function () {
    versionPromise = new Promise(
        function (resolve, reject) {
            sessionAPI.sessionPromise.then(
                function (session) {
                    request({
                            url: configuration.getBackendURL() + '/api/operational/version',
                            type: 'GET',
                            headers: _.extend({}, constants.HTTP_HEADERS.accept.data, {
                                'Authorization': session.authorization
                            }),
                            forever: constants.FOREVER_ON,
                            rejectUnauthorized: false
                        },
                        function (error, response, body) {
                            var data;
                            if (utils.validateResponse('schema/version.get', error, response, body, resolve, reject)) {
                                try {
                                    data = JSON.parse(response.body)['rw-base:version'];
                                    resolve(data.version);
                                } catch (e) {
                                    return reject({});
                                }
                            } else {
                                console.log(error);
                            }
                        });
                });
        });
}

var getConfig = function (req) {
    var api_server = req.query['api_server'];

    var requests = [versionPromise];

    return new Promise(function (resolve, reject) {
        Promise.all(requests).then(
            function (results) {
                var data = {
                    version: results[0],
                    'api-server': configuration.getBackendURL,
                    'inactivity-timeout': process.env.UI_TIMEOUT_SECS || 600000 
                }
                resolve({
                    data: data,
                    statusCode: constants.HTTP_RESPONSE_CODES.SUCCESS.OK
                });
            }).catch(
            function (error) {
                var response = {};
                console.log('Problem with config.get', error);
                response.statusCode = error.statusCode || 500;
                response.errorMessage = {
                    error: 'Failed to get config' + error
                };
                reject(response);
            });
    });
};

module.exports = {
    getRouter: function () {
        return router;
    },
    init: init
};