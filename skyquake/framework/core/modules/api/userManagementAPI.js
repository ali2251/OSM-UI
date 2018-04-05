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


var UserManagement = {};
var Promise = require('bluebird');
var rp = require('request-promise');
var Promise = require('promise');
var constants = require('../../api_utils/constants');
var utils = require('../../api_utils/utils');
var _ = require('lodash');
var ProjectManagementAPI = require('./projectManagementAPI.js');
var API_VERSION = 'v2';

UserManagement.get = function(req) {
    var self = this;
    var api_server = req.query['api_server'];

    return new Promise(function(resolve, reject) {
        var userConfig = rp({
                uri: utils.confdPort(api_server) +  '/' + API_VERSION  + '/api/operational/user-config/user',
                method: 'GET',
                headers: _.extend({}, constants.HTTP_HEADERS.accept.data, {
                    'Authorization': req.session && req.session.authorization
                }),
                forever: constants.FOREVER_ON,
                rejectUnauthorized: false,
                resolveWithFullResponse: true
            });
        var userOp = rp({
                uri: utils.confdPort(api_server) +  '/' + API_VERSION  + '/api/operational/user-state/user',
                method: 'GET',
                headers: _.extend({}, constants.HTTP_HEADERS.accept.data, {
                    'Authorization': req.session && req.session.authorization
                }),
                forever: constants.FOREVER_ON,
                rejectUnauthorized: false,
                resolveWithFullResponse: true
            })
        Promise.all([
            userConfig,
            userOp
        ]).then(function(result) {
            var response = {};
            var userConfig = [];
            var userOpData = {};
            response['data'] = {};
            if (result[0].body) {
                userConfig = JSON.parse(result[0].body)['rw-user:user'];
            }
            if (result[1].body) {
                JSON.parse(result[1].body)['rw-user:user'].map(function(u) {
                    userOpData[u['user-domain'] + ',' + u['user-name']] = u;
                })
            }
            response.statusCode = constants.HTTP_RESPONSE_CODES.SUCCESS.OK
            response['data']['user'] = userConfig.map(function(u,i) {
                var mergedData = _.merge(u, userOpData[u['user-domain'] + ',' + u['user-name']]);
                mergedData.projects = {
                    ids: [],
                    data: {}
                };
                var projects = mergedData.projects;
                mergedData.role && mergedData.role.map(function(r) {
                    if ((r.role != "rw-project:user-self" )&& (r.role != "rw-rbac-platform:user-self")) {
                        var projectId = r.keys.split(';')[0];
                        if (projectId == "") {
                            projectId = "platform"
                        }
                        if (!projects.data[projectId]) {
                            projects.ids.push(projectId);
                            projects.data[projectId] = [];
                        }
                        projects.data[projectId].push(r.role);
                    }
                })
                return mergedData;
            })
            resolve(response);
        }).catch(function(error) {
            var response = {};
            console.log('Problem with UserManagement.get', error);
            response.statusCode = error.statusCode || constants.HTTP_RESPONSE_CODES.ERROR.INTERNAL_SERVER_ERROR;
            response.errorMessage = {
                error: 'Failed to get UserManagement' + error
            };
            reject(response);
        });
    });
};


UserManagement.getProfile = function(req) {
    var self = this;
    var api_server = req.query['api_server'];
    return new Promise(function(resolve, reject) {
        var response = {};
        try {
            var userId = req.session.userdata.username
            response['data'] = {
                userId: userId,
                projectId: req.session.projectId,
                domain: req.session.passport.user.domain
            };
            UserManagement.getUserInfo(req, userId).then(function(result) {
                response.statusCode = constants.HTTP_RESPONSE_CODES.SUCCESS.OK;
                response.data.data = result.data
                resolve(response);
            }, function(error) {
                console.log('Error retrieving getUserInfo');
                response.statusCode = constants.HTTP_RESPONSE_CODES.ERROR.INTERNAL_SERVER_ERROR;
                reject(response);
            })
        } catch (e) {
            var response = {};
            console.log('Problem with UserManagement.get', error);
            response.statusCode = error.statusCode || 500;
            response.errorMessage = {
                error: 'Failed to get UserManagement' + error
            };
            reject(response);
        }
    });
};
UserManagement.getUserInfo = function(req, userId, domain) {
    var self = this;
    var api_server = req.query['api_server'];
    var id = req.params['userId'] || userId;
    var domain = req.params['domainId'] || domain;
    var response = {};
    return new Promise(function(resolve, reject) {
        if (id) {
            var getProjects = ProjectManagementAPI.get(req, ['name', 'project-config']);
            var getPlatformUser = ProjectManagementAPI.getPlatform(req, id);
            var getUserUiState = UserManagement.getUserUiState(req);
            Promise.all([
                getProjects,
                getPlatformUser,
                getUserUiState
            ]).then(function(result) {
                var userData = {
                    platform: {
                        role: {

                        }
                    },
                    //id/key values for each project
                    projectId:[],
                    project: {
                        /**
                         *  [projectId] : {
                         *      data: [project object],
                         *      role: {
                         *          [roleId]: true
                         *      }
                         *  }
                         */
                    }
                }
                //Build UI state
                var uiState = result[2].data && result[2].data['rw-user:user'];
                userData['ui-state'] = uiState['ui-state'];
                //Build platform roles
                var platformRoles = result[1].data.platform && result[1].data.platform.role;
                platformRoles && platformRoles.map(function(r) {
                    userData.platform.role[r.role] = true
                });
                //Build project roles
                var projects = result[0].data.project;
                var userProjects = [];
                projects && projects.map(function(p, i) {
                    userData.project[p.name] = {
                        data: p,
                        role: {}
                    }
                    userData.projectId.push(p.name);
                    if (userData.platform.role['rw-rbac-platform:super-admin']) {
                        userData.project[p.name] = {
                            data: p,
                            role: {
                                "rw-project:project-admin": true,
                                "rw-project:project-oper": true,
                                "rw-project-mano:account-admin": true,
                                "rw-project-mano:account-oper": true,
                                "rw-project-mano:catalog-admin": true,
                                "rw-project-mano:catalog-oper": true,
                                "rw-project-mano:lcm-admin": true,
                                "rw-project-mano:lcm-oper": true
                            }
                        }
                    } else {
                        var users = p['project-config'] && p['project-config'].user;
                        users && users.map(function(u) {
                            if(u['user-name'] == id) {
                                u.role && u.role.map(function(r) {
                                    userData.project[p.name].role[r.role] = true;
                                    if (r.role === 'rw-project:project-admin') {
                                        userData.project[p.name].role["rw-project-mano:account-admin"] = true;
                                        userData.project[p.name].role["rw-project-mano:catalog-admin"] = true;
                                        userData.project[p.name].role["rw-project-mano:lcm-admin"] = true;
                                        userData.isLCM = true;
                                    } else if (r.role === 'rw-project:project-oper') {
                                        userData.project[p.name].role["rw-project-mano:account-oper"] = true;
                                        userData.project[p.name].role["rw-project-mano:catalog-oper"] = true;
                                        userData.project[p.name].role["rw-project-mano:lcm-oper"] = true;
                                        userData.isLCM = true;
                                    }
                                });
                                u["rw-project-mano:mano-role"] && u["rw-project-mano:mano-role"] .map(function(r) {
                                    userData.project[p.name].role[r.role] = true;
                                    if (r.role.indexOf('rw-project-mano:lcm') > -1) {
                                        userData.isLCM = true;
                                    }
                                });
                            }
                        })
                    }
                });
                response.data = userData;
                response.statusCode = constants.HTTP_RESPONSE_CODES.SUCCESS.OK;

                req.session.projectMap = userData.project;
                req.session.platformMap = userData.platform;
                resolve(response);
            })
        } else {
            var errorMsg = 'userId not specified in UserManagement.getUserInfo';
            console.error(errorMsg);
            response.statusCode = constants.HTTP_RESPONSE_CODES.ERROR.BAD_REQUEST;
            response.error = errorMsg;
            reject(response)
        }

    })
}
UserManagement.create = function(req) {
    var self = this;
    var api_server = req.query['api_server'];
    var data = req.body;
    data = {
        "user":[data]
    }
    return new Promise(function(resolve, reject) {
        Promise.all([
            rp({
                uri: utils.confdPort(api_server) +  '/' + API_VERSION  + '/api/config/user-config',
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
            console.log('Problem with UserManagement.create', error);
            response.statusCode = error.statusCode || 500;
            response.errorMessage = {
                error: 'Failed to create user' + error
            };
            reject(response);
        });
    });
};
UserManagement.update = function(req) {
    var self = this;
    var api_server = req.query['api_server'];
    var bodyData = req.body;
    data = {
        "rw-user:user": bodyData
    }
    var updateTasks = [];
    if(bodyData.hasOwnProperty('old-password')) {
        var changePW = rp({
            uri: utils.confdPort(api_server) +  '/' + API_VERSION  + '/api/operations/change-password',
            method: 'POST',
            headers: _.extend({}, constants.HTTP_HEADERS.accept.data, {
                'Authorization': req.session && req.session.authorization
            }),
            forever: constants.FOREVER_ON,
            json: {
                "input": {
                    'user-name' : bodyData['user-name'],
                    'user-domain' : bodyData['user-domain'],
                    'old-password' : bodyData['old-password'],
                    'new-password' : bodyData['new-password'],
                    'confirm-password' : bodyData['confirm-password'],
                }
            },
            rejectUnauthorized: false,
            resolveWithFullResponse: true
        });
        updateTasks.push(changePW);
    };
    var updateUser = rp({
                uri: utils.confdPort(api_server) +  '/' + API_VERSION  + '/api/config/user-config/user/' + encodeURIComponent(bodyData['user-name']) + ',' +  encodeURIComponent(bodyData['user-domain']),
                method: 'PUT',
                headers: _.extend({}, constants.HTTP_HEADERS.accept.data, {
                    'Authorization': req.session && req.session.authorization
                }),
                forever: constants.FOREVER_ON,
                json: data,
                rejectUnauthorized: false,
                resolveWithFullResponse: true
            });
    updateTasks.push(updateUser)
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
            console.log('Problem with UserManagement.passwordChange', error);
            response.statusCode = error.statusCode || 500;
            response.errorMessage = {
                error: 'Failed to passwordChange user' + error
            };
            reject(response);
        });
    });
};

UserManagement.delete = function(req) {
    var self = this;
    var username = req.params.username;
    var domain = req.params.domain;
    var api_server = req.query["api_server"];
    var requestHeaders = {};
    var url = `${utils.confdPort(api_server)}/${API_VERSION}/api/config/user-config/user/${encodeURIComponent(username)},${encodeURIComponent(domain)}`
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
            if (utils.validateResponse('UserManagement.DELETE', error, response, body, resolve, reject)) {
                return resolve({
                    statusCode: response.statusCode,
                    data: JSON.stringify(response.body)
                });
            };
        });
    })
};
UserManagement.getUserUiState = function(req) {
    var self = this;
    var api_server = req.query['api_server'];
    var user = req.session.passport.user;
    return new Promise(function(resolve, reject) {
        Promise.all([
            rp({
                uri: utils.confdPort(api_server) +  '/' + API_VERSION  + '/api/config/user-config/user/'+encodeURIComponent(user.username) + ',' + encodeURIComponent(user.domain),
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
                response['data'] = JSON.parse(result[0].body);
            }
            response.statusCode = constants.HTTP_RESPONSE_CODES.SUCCESS.OK

            resolve(response);
        }).catch(function(error) {
            var response = {};
            console.log('Problem with UserManagement.getUserUiState', error);
            response.statusCode = error.statusCode || 500;
            response.errorMessage = {
                error: 'Failed to create user' + error
            };
            reject(response);
        });
    });
};
UserManagement.updateActiveProject = function(req) {
    var self = this;
    var api_server = req.query['api_server'];
    var user = req.session.passport.user;
    var data = {
        "rw-user:user-config": {
            "user":{
                "user-name" : user.username,
                "user-domain": user.domain,
                "ui-state": {
                     "last-active-project" : req.params.projectId
                }
            }
        }
    }
    return new Promise(function(resolve, reject) {
        Promise.all([
            rp({
                uri: utils.confdPort(api_server) +  '/' + API_VERSION  + '/api/config/user-config',
                method: 'PATCH',
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
            console.log('Problem with UserManagement.updateActiveProject', error);
            response.statusCode = error.statusCode || 500;
            response.errorMessage = {
                error: 'Failed to create user' + error
            };
            reject(response);
        });
    });
};
UserManagement.updateActiveUri = function(req) {
    if (!req.session.passport) {
        console.debug("passport gone before we got the save the active uri");
        var response = {
            statusCode: 500,
            errorMessage: {
                error: 'Failed to save active uri'
            }};
        return Promise.resolve(response);
    }
    var self = this;
    var api_server = req.query['api_server'];
    var user = req.session.passport.user;
    var ref = req.headers.referer;
    var hash = req.query.hash;
    var data = {
        "rw-user:user-config": {
            "user":{
                "user-name" : user.username,
                "user-domain": user.domain,
                "ui-state": {
                     "last-active-uri" : ref + decodeURIComponent(hash)
                }
            }
        }
    }
    return new Promise(function(resolve, reject) {
        Promise.all([
            rp({
                uri: utils.confdPort(api_server) +  '/' + API_VERSION  + '/api/config/user-config',
                method: 'PATCH',
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
            console.log('Problem with UserManagement.updateActiveProject', error);
            response.statusCode = error.statusCode || 500;
            response.errorMessage = {
                error: 'Failed to create user' + error
            };
            reject(response);
        });
    });
};
module.exports = UserManagement;
