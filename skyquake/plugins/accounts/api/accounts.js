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

var request = require('request');
var Promise = require('bluebird');
var rp = require('request-promise');
var utils = require('../../../framework/core/api_utils/utils.js');
var constants = require('../../../framework/core/api_utils/constants.js');
var _ = require('underscore');
var Cloud = require('./cloud_account/cloudAccount')
var Sdn = require('./sdn_account/sdnAccount')
var ConfigAgent = require('./config_agent/configAgent')
var Accounts = {};
var nameSpace = {
    cloud: 'cloud',
    sdn: 'sdn',
    'config-agent': 'config-agent',
    'resource-orchestrator': 'ro-account'
};
var APIVersion = '/v2'
Accounts.get = function(req) {
    return new Promise(function(resolve, reject) {
        if (req.params.type || req.params.name) {
            getAccount(req)
                .then(function(data) {
                    resolve({
                        statusCode: 200,
                        data: Object.assign(data, {
                            type: req.params.type
                        })
                    });
                }, function(reason) {
                    reject(reason);
                })
        } else {
            getAll(req, resolve, reject);
        }
    });

    function getAll(req, resolve, reject) {
        Promise.all([
            Cloud.get(req),
            Sdn.get(req),
            ConfigAgent.get(req),
            getResourceOrchestrator(req)
        ]).then(function(result) {
            var ReturnData = {
                cloud: result[0],
                sdn: result[1],
                'config-agent': result[2],
                'resource-orchestrator': result[3]
            };
            ReturnData.cloud.type = 'cloud';
            ReturnData.sdn.type = 'sdn';
            ReturnData['config-agent'].type = 'config';
            resolve({
                statusCode: 200,
                data: ReturnData
            });
        }, function(reason) {
            reject(reason);
        })
    }
}

Accounts.update = updateAccount;
Accounts.create = updateAccount;
Accounts.delete = deleteAccount;
Accounts.refreshAccountConnectionStatus = refreshAccountConnectionStatus

function getAccount(req) {
    return new Promise(function(resolve, reject) {
        var self = this;
        var api_server = req.query["api_server"];
        var id = req.params.id || req.params.name;
        var requestHeaders = {};
        var type = nameSpace[req.params.type];
        var url = utils.confdPort(api_server) + '/api/operational/' + type + '/account';
        if (id) {
            url += '/' + encodeURIComponent(id);
        }

        _.extend(
            requestHeaders,
            id ? constants.HTTP_HEADERS.accept.data : constants.HTTP_HEADERS.accept.collection, {
                'Authorization': req.session && req.session.authorization
            }
        );

        request({
                url: utils.projectContextUrl(req, url + '?deep'),
                type: 'GET',
                headers: requestHeaders,
                forever: constants.FOREVER_ON,
                rejectUnauthorized: false
            },
            function(error, response, body) {
                var data;
                var objKey = 'rw-' + type + ':account';
                //SDN model doesn't follow convention
                if (utils.validateResponse(type.toUpperCase() + '.get', error, response, body, resolve, reject)) {
                    try {
                        data = JSON.parse(response.body);
                        if (!id) {
                            data = data.collection;
                        }
                        data = data[objKey]
                    } catch (e) {
                        console.log('Problem with "' + type.toUpperCase() + '.get"', e);
                        var err = {};
                        err.statusCode = 500;
                        err.errorMessage = {
                            error: 'Problem with "' + type.toUpperCase() + '.get": ' + e
                        }
                        return reject(err);
                    }
                    return resolve({
                        statusCode: response.statusCode,
                        data: data
                    });
                };
            });
    });
}

function updateAccount(req) {
    var self = this;
    var id = req.params.id || req.params.name;
    var api_server = req.query["api_server"];
    var type = nameSpace[req.params.type];
    var data = req.body;
    var requestHeaders = {};
    var createData = {};
    var url = utils.confdPort(api_server) + '/api/config/' + type //+ '/account';
    var method = 'POST'
    if (!id) {
        createData = {}
        if (type == 'ro-account') {
            createData['rw-ro-account:account'] = Array.isArray(data) ? data : [data]
        } else {
            createData['account'] = Array.isArray(data) ? data : [data]
        }
        console.log('Creating ' + type + ' account: ', createData);
    } else {
        method = 'PUT';
        url += '/account/' + encodeURIComponent(id);
        createData['rw-' + type + ':account'] = Array.isArray(data) ? data : [data];
    }



    return new Promise(function(resolve, reject) {
        _.extend(requestHeaders,
            constants.HTTP_HEADERS.accept.data,
            constants.HTTP_HEADERS.content_type.data, {
                'Authorization': req.session && req.session.authorization
            });
        request({
            url: utils.projectContextUrl(req, url),
            method: method,
            headers: requestHeaders,
            forever: constants.FOREVER_ON,
            rejectUnauthorized: false,
            json: createData,
        }, function(error, response, body) {
            if (utils.validateResponse(type.toUpperCase() + '.' + method, error, response, body, resolve, reject)) {
                return resolve({
                    statusCode: response.statusCode,
                    data: JSON.stringify(response.body)
                });
            };
        });
    })
}

function deleteAccount(req) {
    var self = this;
    var id = req.params.id || req.params.name;
    var api_server = req.query["api_server"];
    var type = nameSpace[req.params.type];
    var data = req.body;
    var requestHeaders = {};
    var createData = {};
    var url = utils.confdPort(api_server) + '/api/config/' + type;
    url += '/account/' + encodeURIComponent(id);
    return new Promise(function(resolve, reject) {
        _.extend(requestHeaders,
            constants.HTTP_HEADERS.accept.data,
            constants.HTTP_HEADERS.content_type.data, {
                'Authorization': req.session && req.session.authorization
            });
        request({
            url: utils.projectContextUrl(req, url),
            method: 'DELETE',
            headers: requestHeaders,
            forever: constants.FOREVER_ON,
            rejectUnauthorized: false,
        }, function(error, response, body) {
            if (utils.validateResponse(type.toUpperCase() + '.DELETE', error, response, body, resolve, reject)) {
                return resolve({
                    statusCode: response.statusCode,
                    data: JSON.stringify(response.body)
                });
            };
        });
    })
}

function refreshAccountConnectionStatus(req) {
    var api_server = req.query['api_server'];
    var Name = req.params.name;
    var Type = req.params.type;
    var jsonData = {
        input: {}
    };
    var rpcInfo = {
        sdn: {
            label: 'sdn-account',
            rpc: 'update-sdn-status'
        },
        'config-agent': {
            label: 'cfg-agent-account',
            rpc: 'update-cfg-agent-status'
        },
        cloud: {
            label: 'cloud-account',
            rpc: 'update-cloud-status'
        },
        'resource-orchestrator': {
            label: 'ro-account',
            rpc: 'update-ro-account-status'
        }
    }
    jsonData.input[rpcInfo[Type].label] = Name;
    var headers = _.extend({},
        constants.HTTP_HEADERS.accept.data,
        constants.HTTP_HEADERS.content_type.data, {
            'Authorization': req.session && req.session.authorization
        }
    );
    var uri = utils.projectContextUrl(req, utils.confdPort(api_server) + '/api/operations/' + rpcInfo[Type].rpc);

    jsonData['input'] = utils.addProjectContextToRPCPayload(req, uri, jsonData['input']);

    return new Promise(function(resolve, reject) {

        request({
            uri: uri,
            method: 'POST',
            headers: headers,
            forever: constants.FOREVER_ON,
            rejectUnauthorized: false,
            json: jsonData
        }, function(error, response, body) {
            if (utils.validateResponse('RPC.refreshAccountConnectionStatus', error, response, body, resolve, reject)) {

                resolve({
                    statusCode: response.statusCode,
                    data: body
                });
            }
        });
    }).catch(function(error) {
        console.log('Error refreshing account info');
    });
};

function getResourceOrchestrator(req, id) {
    var self = this;
    var api_server = req.query["api_server"];
    var accountID = req.params.id || req.params.name;

    return new Promise(function(resolve, reject) {
        var requestHeaders = {};
        _.extend(requestHeaders,
            constants.HTTP_HEADERS.accept.collection, {
                'Authorization': req.session && req.session.authorization
            }
        );
        var urlOp =  utils.projectContextUrl(req, utils.confdPort(api_server) + APIVersion + '/api/operational/ro-account/account');
        var urlConfig =  utils.projectContextUrl(req, utils.confdPort(api_server) + APIVersion + '/api/operational/ro-account-state/account');
        if(accountID) {
            urlOp = url + '/' + encodeURIComponent(accountID);
            urlConfig = url + '/' + encodeURIComponent(accountID);
        }
        var allRequests = [];
        var roOpData = new Promise(function(resolve, reject) {
            request({
                url: urlOp,
                type: 'GET',
                headers: requestHeaders,
                forever: constants.FOREVER_ON,
                rejectUnauthorized: false
                },
                function(error, response, body) {
                    var data;
                    if (utils.validateResponse('RoAccount.get', error, response, body, resolve, reject)) {
                        try {
                            data = JSON.parse(response.body).collection['rw-ro-account:account']
                        } catch (e) {
                            console.log('Problem with "RoAccount.get"', e);
                            var err = {};
                            err.statusCode = 500;
                            err.errorMessage = {
                                error: 'Problem with "RoAccount.get": ' + e // + e.toString()
                            }
                            return reject(err);
                        }
                        return resolve({
                            statusCode: response.statusCode,
                            data: data
                        });
                    };
                }
            );
        });
        var roConfigData = new Promise(function(resolve, reject){
            request({
                url: urlConfig,
                type: 'GET',
                headers: requestHeaders,
                forever: constants.FOREVER_ON,
                rejectUnauthorized: false
                },
                function(error, response, body) {
                    var data;
                    if (utils.validateResponse('RoAccount.get', error, response, body, resolve, reject)) {
                        try {
                            data = JSON.parse(response.body).collection['rw-ro-account:account']
                        } catch (e) {
                            console.log('Problem with "RoAccount.get"', e);
                            var err = {};
                            err.statusCode = 500;
                            err.errorMessage = {
                                error: 'Problem with "RoAccount.get": ' + e // + e.toString()
                            }
                            return reject(err);
                        }
                        return resolve({
                            statusCode: response.statusCode,
                            data: data
                        });
                    };
                }
            );
        });

        allRequests.push(roOpData);
        allRequests.push(roConfigData);
        Promise.all(allRequests).then(function(data) {
            var state = data[1].data;
            var op = data[0].data;
            var result = [];
            var dict = {};
            if (!accountID) {
                state.map && state.map(function(s){
                    if(s.name != "rift") {
                        dict[s.name] = s;
                    }
                });
                op.map && op.map(function(o) {
                    if(o.name != "rift") {
                        dict[o.name] = _.extend(dict[o.name], o);
                    }
                });
                Object.keys(dict).map(function(d) {
                    result.push(dict[d]);
                })
            } else {
                result = _.extend(op, state);
            }
            resolve({
                statusCode: 200,
                data: result
            })
        })

    })
}

module.exports = Accounts;
