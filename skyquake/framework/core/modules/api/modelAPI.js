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

router.get('/model', cors(), function (req, res) {
    get(req).then(function (response) {
        utils.sendSuccessResponse(response, res);
    }, function (error) {
        utils.sendErrorResponse(error, res);
    });
});

router.patch('/model', cors(), function (req, res) {
    update(req).then(function (response) {
        utils.sendSuccessResponse(response, res);
    }, function (error) {
        utils.sendErrorResponse(error, res);
    });
});

router.put('/model', cors(), function (req, res) {
    add(req).then(function (response) {
        utils.sendSuccessResponse(response, res);
    }, function (error) {
        utils.sendErrorResponse(error, res);
    });
});

router.delete('/model', cors(), function (req, res) {
    remove(req).then(function (response) {
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

get = function (req) {
    var backend = configuration.getBackendAPI();
    var modelPath = req.query['path'];
    var requestHeaders = _.extend({}, constants.HTTP_HEADERS.accept.collection, {
        'Authorization': req.session && req.session.authorization
    })
    return new Promise(function (resolve, reject) {
        Promise.all([
            rp({
                uri: backend + '/config' + modelPath,
                method: 'GET',
                headers: requestHeaders,
                forever: constants.FOREVER_ON,
                rejectUnauthorized: false,
                resolveWithFullResponse: true
                // }),
                // rp({
                //     uri: utils.projectContextUrl(req, backend + '/api/operational' + modelPath),
                //     method: 'GET',
                //     headers: requestHeaders,
                //     forever: constants.FOREVER_ON,
                //     rejectUnauthorized: false,
                //     resolveWithFullResponse: true
            })
        ]).then(function (results) {
            var response = {
                statusCode: results[0].statusCode || 200,
                data: [null]
            }
            if (results[0].body && !results[0].error) {
                var result = JSON.parse(results[0].body);
                if (result.collection) {
                    result = result.collection[Object.keys(result.collection)[0]];
                    if (!result.length) {
                        result = null;
                    } else if (result.length === 1) {
                        result = result[0];
                    }
                }
                response.data = result;
            }
            resolve(response);

        }).catch(function (error) {
            var res = {};
            console.log('Problem with model get', error);
            res.statusCode = error.statusCode || 500;
            res.errorMessage = {
                error: 'Failed to get model: ' + error
            };
            reject(res);
        });
    });
};

add = function (req) {
    var backend = configuration.getBackendAPI();
    var modelPath = req.query['path'];
    var targetProperty = modelPath.split('/').pop();
    var newElement = {};
    var data = {};
    console.log(req.body);
    _.forIn(req.body, function (value, key) {
        if (_.isObject(value)) {
            if (value.type === 'leaf_empty') {
                if (value.data) {
                    data[key] = ' ';
                }
            } else if (value.type === 'leaf_list') {
                data[key] = value.data.add;
            }
        } else {
            data[key] = value;
        }
    });
    newElement[targetProperty] = [data];
    console.log(newElement);
    var target = backend + '/config' + modelPath;
    var method = 'POST'
    var requestHeaders = _.extend({},
        constants.HTTP_HEADERS.accept.data, {
            'Authorization': req.session && req.session.authorization
        });
    return new Promise(function (resolve, reject) {
        rp({
            uri: target,
            method: method,
            headers: requestHeaders,
            forever: constants.FOREVER_ON,
            json: newElement,
            rejectUnauthorized: false,
            resolveWithFullResponse: true
        }).then(function (results) {
            var response = {};
            response.data = {
                path: modelPath,
                data: data
            };
            response.statusCode = constants.HTTP_RESPONSE_CODES.SUCCESS.OK;
            console.log(response);
            resolve(response);
        }).catch(function (result) {
            var response = {};
            var error = {};
            if (result.error['rpc-reply']) {
                error.type = result.error['rpc-reply']['rpc-error']['error-tag'];
                error.message = result.error['rpc-reply']['rpc-error']['error-message'];
                error.rpcError = result.error['rpc-reply']['rpc-error']
            } else {
                error.type = 'api-error';
                error.message = 'invalid api call';
            }
            console.log('Problem with model update', error);
            response.statusCode = error.statusCode || 500;
            response.error = error;
            reject(response);
        });
    });
};

update = function (req) {
    var backend = configuration.getBackendAPI();
    var modelPath = req.query['path'];
    var requestHeaders = _.extend({},
        constants.HTTP_HEADERS.accept.data, {
            'Authorization': req.session && req.session.authorization
        });
    var base = backend + '/config' + modelPath + '/';

    function getUpdatePromise(name, value) {
        var data = {};
        data[name] = value;
        return new Promise(function (resolve, reject) {
            rp({
                uri: base + name,
                method: value ? 'PATCH' : 'DELETE',
                headers: requestHeaders,
                forever: constants.FOREVER_ON,
                json: data,
                rejectUnauthorized: false,
                resolveWithFullResponse: true
            }).then(function (result) {
                resolve({
                    element: name,
                    success: true,
                    value: value
                });
            }).catch(function (result) {
                var error = {};
                if (result.error['rpc-reply']) {
                    error.type = result.error['rpc-reply']['rpc-error']['error-tag'];
                    error.message = result.error['rpc-reply']['rpc-error']['error-message'];
                    error.rpcError = result.error['rpc-reply']['rpc-error']
                } else {
                    error.type = 'api-error';
                    error.message = 'invalid api call';
                }
                resolve({
                    element: name,
                    success: false,
                    error: error,
                    value: value
                });
            })
        })
    }

    function getDeletePromise(targetProp, item) {
        if (item) {
            targetProp = targetProp + '/' + item;
        }
        return getUpdatePromise(targetProp, '');
    }

    var updates = [];
    _.forIn(req.body, function (value, key) {
        var data = {};
        if (_.isObject(value)) {
            if (value.type === 'leaf_list') {
                _.forEach(value.data.remove, function (v) {
                    updates.push(getDeletePromise(key))
                })
                _.forEach(value.data.add, function (v) {
                    updates.push(getUpdatePromise(key, v))
                })
            } else if (value.type === 'leaf_empty') {
                if (value.data) {
                    updates.push(getUpdatePromise(key, ' '))
                } else {
                    updates.push(getDeletePromise(key))
                }
            }
        } else {
            updates.push(getUpdatePromise(key, value))
        }
    })

    return new Promise(function (resolve, reject) {
        Promise.all(updates).then(function (results) {
            var response = {};
            var output = {};
            var hasError = false;
            _.forEach(results, function (result) {
                var record = {};
                if (output[result.element]) {
                    if (_.isArray(output[result.element].value)) {
                        output[result.element].value.push(result.value);
                    } else {
                        output[result.element].value = [output[result.element].value, result.value];
                    }
                } else {
                    output[result.element] = result;
                }
                hasError = hasError || !result.success
            })
            response.data = {
                result: output,
                hasError: hasError
            };
            response.statusCode = constants.HTTP_RESPONSE_CODES.SUCCESS.OK;
            console.log(response);
            resolve(response);
        }).catch(function (result) {
            var response = {};
            var error = {};
            if (result.error['rpc-reply']) {
                error.type = result.error['rpc-reply']['rpc-error']['error-tag'];
                error.message = result.error['rpc-reply']['rpc-error']['error-message'];
                error.rpcError = result.error['rpc-reply']['rpc-error']
            } else {
                error.type = 'api-error';
                error.message = 'invalid api call';
            }
            console.log('Problem with model update', error);
            response.statusCode = error.statusCode || 500;
            response.error = error;
            reject(response);
        });
    });
};

remove = function (req) {
    var backend = configuration.getBackendAPI();
    var modelPath = req.query['path'];
    var target = backend + '/config' + modelPath;
    var requestHeaders = _.extend({},
        constants.HTTP_HEADERS.accept.data,
        constants.HTTP_HEADERS.content_type.data, {
            'Authorization': req.session && req.session.authorization
        })
    return new Promise(function (resolve, reject) {
        rp({
            url: target,
            method: 'DELETE',
            headers: requestHeaders,
            forever: constants.FOREVER_ON,
            rejectUnauthorized: false,
        }).then(function (response) {
            return resolve({
                statusCode: constants.HTTP_RESPONSE_CODES.SUCCESS.OK,
                data: modelPath
            });
        }).catch(function (result) {
            var response = {};
            var error = {};
            if (result.error['rpc-reply']) {
                error.type = result.error['rpc-reply']['rpc-error']['error-tag'];
                error.message = result.error['rpc-reply']['rpc-error']['error-message'];
                error.rpcError = result.error['rpc-reply']['rpc-error']
            } else {
                error.type = 'api-error';
                error.message = 'invalid api call';
            }
            console.log('Problem with model update', error);
            response.statusCode = error.statusCode || 500;
            response.error = error;
            reject(response);
        });
    })
}