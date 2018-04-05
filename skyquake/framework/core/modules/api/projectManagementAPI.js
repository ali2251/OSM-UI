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


var ProjectManagement = {};
var Promise = require('bluebird');
var rp = require('request-promise');
var Promise = require('promise');
var constants = require('../../api_utils/constants');
var utils = require('../../api_utils/utils');
var _ = require('lodash');
var API_VERSION = 'v2';
ProjectManagement.get = function(req, fields) {
    var self = this;
    var api_server = req.query['api_server'];
    // by default just load basic info as this request is expensive
    fields = fields || ['name', 'description', 'project-config'];
    var select = fields.length ? '?fields=' + fields.join(';') : '';

    return new Promise(function(resolve, reject) {
        Promise.all([
            rp({
                uri: `${utils.confdPort(api_server)}/${API_VERSION}/api/operational/project` + select,
                method: 'GET',
                headers: _.extend({}, constants.HTTP_HEADERS.accept.data, {
                    'Authorization': req.session && req.session.authorization
                }),
                forever: constants.FOREVER_ON,
                rejectUnauthorized: false,
                resolveWithFullResponse: true
            })
        ]).then(function(result) {
            var response = {};
            response['data'] = {};
            if (result[0].body) {
                response['data']['project'] = JSON.parse(result[0].body)['rw-project:project'];
            }
            response.statusCode = constants.HTTP_RESPONSE_CODES.SUCCESS.OK

            resolve(response);
        }).catch(function(error) {
            var response = {};
            console.log('Problem with ProjectManagement.get', error);
            response.statusCode = error.statusCode || 500;
            response.errorMessage = {
                error: 'Failed to get ProjectManagement' + error
            };
            reject(response);
        });
    });
};

ProjectManagement.create = function(req) {
    var self = this;
    var api_server = req.query['api_server'];
    var data = req.body;
    data = {
        "project":[data]
    }
    return new Promise(function(resolve, reject) {
        Promise.all([
            rp({
                uri: utils.confdPort(api_server) + '/' + API_VERSION  + '/api/config/project',
                method: 'POST',
                headers: _.extend({}, constants.HTTP_HEADERS.accept.data, {
                    'Authorization': req.session && req.session.authorization
                }),
                forever: constants.FOREVER_ON,
                json: data,
                rejectUnauthorized: false,
                resolveWithFullResponse: true
            })
        ]).then(function(result) {
            var response = {};
            response['data'] = {};
            if (result[0].body) {
                response['data'] = result[0].body;
            }
            response.statusCode = constants.HTTP_RESPONSE_CODES.SUCCESS.OK

            resolve(response);
        }).catch(function(error) {
            var response = {};
            console.log('Problem with ProjectManagement.create', error);
            response.statusCode = error.statusCode || 500;
            response.errorMessage = {
                error: 'Failed to create user' + error
            };
            reject(response);
        });
    });
};
ProjectManagement.update = function(req) {
    //"rw-project:project"
    var self = this;
    var api_server = req.query['api_server'];
    var bodyData = req.body;
    // oddly enough, if we do not encode this here letting the request below does so incorrectly
    var projectName = encodeURIComponent(bodyData.name);
    var descriptionData = {
        "rw-project:project" : {
            "name": bodyData.name,
            "description": bodyData.description
        }
    }
    var updateTasks = [];
    var baseUrl = utils.confdPort(api_server) + '/' + API_VERSION  + '/api/config/project/' + projectName
    var updateProjectConfig = rp({
                uri: baseUrl + '/project-config',
                method: 'PUT',
                headers: _.extend({}, constants.HTTP_HEADERS.accept.data, {
                    'Authorization': req.session && req.session.authorization
                }),
                forever: constants.FOREVER_ON,
                json: {
                    "project-config": bodyData['project-config']
                },
                rejectUnauthorized: false,
                resolveWithFullResponse: true
            });
    updateTasks.push(updateProjectConfig);

    var updateProjectDescription = rp({
                uri: baseUrl + '/description',
                method: 'PATCH',
                headers: _.extend({}, constants.HTTP_HEADERS.accept.data, {
                    'Authorization': req.session && req.session.authorization
                }),
                forever: constants.FOREVER_ON,
                json: {"description": bodyData.description},
                rejectUnauthorized: false,
                resolveWithFullResponse: true
            });
    updateTasks.push(updateProjectDescription)
    return new Promise(function(resolve, reject) {
        Promise.all(
            updateTasks
        ).then(function(result) {
            var response = {};
            response['data'] = {};
            if (result[0].body) {
                response['data'] = result[0].body;
            }
            response.statusCode = constants.HTTP_RESPONSE_CODES.SUCCESS.OK

            resolve(response);
        }).catch(function(error) {
            var response = {};
            console.log('Problem with ProjectManagement.update', error);
            response.statusCode = error.statusCode || 500;
            response.errorMessage = {
                error: 'Failed to update project - ' + error
            };
            reject(response);
        });
    });
};

ProjectManagement.delete = function(req) {
    var self = this;
    var projectname = encodeURIComponent(req.params.projectname);
    var api_server = req.query["api_server"];
    var requestHeaders = {};
    var url = utils.confdPort(api_server) + '/' + API_VERSION  + '/api/config/project/' + projectname
    return new Promise(function(resolve, reject) {
        _.extend(requestHeaders,
            constants.HTTP_HEADERS.accept.data,
            constants.HTTP_HEADERS.content_type.data, {
                'Authorization': req.session && req.session.authorization
            });
        rp({
            url: url,
            method: 'DELETE',
            headers: requestHeaders,
            forever: constants.FOREVER_ON,
            rejectUnauthorized: false,
        }, function(error, response, body) {
            if (utils.validateResponse('ProjectManagement.DELETE', error, response, body, resolve, reject)) {
                return resolve({
                    statusCode: response.statusCode,
                    data: JSON.stringify(response.body)
                });
            };
        });
    })
}


ProjectManagement.getPlatform = function(req, userId) {
    var self = this;
    var api_server = req.query['api_server'];
    var user = req.params['userId'] || userId;
    return new Promise(function(resolve, reject) {
        var url = utils.confdPort(api_server) +  '/' + API_VERSION  + '/api/operational/rbac-platform-config';
        if(user) {
            url = url + '/user/' + encodeURIComponent(user);
        }
        Promise.all([
            rp({
                uri: url,
                method: 'GET',
                headers: _.extend({}, constants.HTTP_HEADERS.accept.data, {
                    'Authorization': req.session && req.session.authorization
                }),
                forever: constants.FOREVER_ON,
                rejectUnauthorized: false,
                resolveWithFullResponse: true
            })
        ]).then(function(result) {
            var response = {};
            response['data'] = {};
            if (result[0].body) {
                if(user) {
                    response['data']['platform'] = JSON.parse(result[0].body)['rw-rbac-platform:user'];
                } else {
                    response['data']['platform'] = JSON.parse(result[0].body)['rw-rbac-platform:rbac-platform-config'];
                }
            }
            response.statusCode = constants.HTTP_RESPONSE_CODES.SUCCESS.OK

            resolve(response);
        }).catch(function(error) {
            var response = {};
            console.log('Problem with ProjectManagement.getPlatform', error);
            response.statusCode = error.statusCode || 500;
            response.errorMessage = {
                error: 'Failed to get ProjectManagement.getPlatform' + error
            };
            reject(response);
        });
    });
};

ProjectManagement.updatePlatform = function(req) {
    var self = this;
    var api_server = req.query['api_server'];
    var bodyData = req.body;
    data = bodyData;
    data.user = JSON.parse(data.user)
    var updateTasks = [];

    var updatePlatform = rp({
                uri: utils.confdPort(api_server) +   '/' + API_VERSION  + '/api/config/rbac-platform-config',
                method: 'PUT',
                headers: _.extend({}, constants.HTTP_HEADERS.accept.data, {
                    'Authorization': req.session && req.session.authorization
                }),
                forever: constants.FOREVER_ON,
                json: {
                    "rw-rbac-platform:rbac-platform-config": data
                },
                rejectUnauthorized: false,
                resolveWithFullResponse: true
            });
    updateTasks.push(updatePlatform)
    return new Promise(function(resolve, reject) {
        Promise.all([
            updateTasks
        ]).then(function(result) {
            var response = {};
            response['data'] = {};
            if (result[0].body) {
                response['data'] = result[0].body;
            }
            response.statusCode = constants.HTTP_RESPONSE_CODES.SUCCESS.OK

            resolve(response);
        }).catch(function(error) {
            var response = {};
            console.log('Problem with ProjectManagement.updatePlatform', error);
            response.statusCode = error.statusCode || 500;
            response.errorMessage = {
                error: 'Failed to update platform - ' + error
            };
            reject(response);
        });
    });
};


module.exports = ProjectManagement;
