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
var rp = require('request-promise');
var Promise = require('promise');
var constants = require('../../api_utils/constants');
var utils = require('../../api_utils/utils');
var _ = require('lodash');
var cors = require('cors');
var bodyParser = require('body-parser');
var utils = require('../../api_utils/utils');
var configuration = require('./configuration');

var router = require('express').Router();


router.use(bodyParser.json());
router.use(cors());
router.use(bodyParser.urlencoded({
    extended: true
}));

router.get('/schema', cors(), function (req, res) {
    getSchema(req).then(function (response) {
        utils.sendSuccessResponse(response, res);
    }, function (error) {
        utils.sendErrorResponse(error, res);
    });
});

module.exports = {
    getRouter: function () {
        return router;
    },
    init: function () {}
};

getSchema = function (req) {
    var schemaURI = configuration.getBackendURL() + '/api/schema/';
    var schemaPaths = req.query['request'];
    var paths = schemaPaths.split(',');

    function getSchemaRequest(path) {
        return rp({
            uri: schemaURI + path,
            method: 'GET',
            headers: _.extend({}, constants.HTTP_HEADERS.accept.collection, {
                'Authorization': req.session && req.session.authorization
            }),
            forever: constants.FOREVER_ON,
            rejectUnauthorized: false,
            resolveWithFullResponse: true
        })
    }

    var requests = _.map(paths, getSchemaRequest);

    return new Promise(function (resolve, reject) {
        Promise.all(requests).then(
            function (results) {
                var data = {
                    schema: {}
                }
                _.forEach(results, function (result, index) {
                    data.schema[paths[index]] = JSON.parse(result.body);
                });
                resolve({
                    data: data,
                    statusCode: constants.HTTP_RESPONSE_CODES.SUCCESS.OK
                });
            }).catch(
            function (error) {
                var response = {};
                console.log('Problem with schema.get', error);
                response.statusCode = error.statusCode || 500;
                response.errorMessage = {
                    error: 'Failed to get schema' + error
                };
                reject(response);
            });
    });
};