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
 * sessions api module. Provides API functions for sessions
 * @module framework/core/modules/api/sessions
 * @author Kiran Kashalkar <kiran.kashalkar@riftio.com>
 */
"use strict"
var Promise = require('promise');
var constants = require('../../api_utils/constants');
var utils = require('../../api_utils/utils');
var request = utils.request;
var rp = require('request-promise');
var sessionsAPI = {};
var _ = require('lodash');
var base64 = require('base-64');
var APIVersion = '/v2';
var configurationAPI = require('./configuration');
var UserManagement = require('./userManagementAPI.js');
var URL = require('url');

// Used for determining what page a user should first go to.
var Application = {
    order: [
        "rw-rbac-platform:super-admin",
        "rw-rbac-platform:platform-admin",
        "rw-rbac-platform:platform-oper",
        "rw-project:project-admin",
        "rw-project:project-oper",
        "rw-project-mano:lcm-admin",
        "rw-project-mano:lcm-oper",
        "rw-project-mano:catalog-admin",
        "rw-project-mano:catalog-oper",
        "rw-project-mano:account-admin",
        "rw-project-mano:account-oper"
    ],
    key: {
        "rw-rbac-platform:super-admin": "user_management",
        "rw-rbac-platform:platform-admin": "user_management",
        "rw-rbac-platform:platform-oper": "user_management",
        "rw-project:project-admin": "project_management",
        "rw-project:project-oper": "project_management",
        "rw-project-mano:catalog-admin": "composer",
        "rw-project-mano:catalog-oper": "composer",
        "rw-project-mano:lcm-admin": "launchpad",
        "rw-project-mano:lcm-oper": "launchpad",
        "rw-project-mano:account-admin": "accounts",
        "rw-project-mano:account-oper": "accounts"
    }
};

function logAndReject(mesg, reject, errCode) {
    var res = {};
    res.errorMessage = {
        error: mesg
    }
    res.statusCode = errCode || constants.HTTP_RESPONSE_CODES.ERROR.BAD_REQUEST;
    console.log(mesg);
    reject(res);
}

function logAndRedirectToLogin(mesg, res, req, invalid) {
    console.log(mesg);
    if (!invalid) {
        res.redirect(utils.buildRedirectURL(req, configurationAPI.globalConfiguration, 'login', '&referer=' + encodeURIComponent(req.headers.referer)));
    }
    res.end();
}

function logAndRedirectToEndSession(mesg, res, authorization, url) {
    console.log(mesg);
    res.set({
        'Authorization': authorization
    });
    res.redirect(url);
    res.end();
}
var sessionPromiseResolve = null;
sessionsAPI.sessionPromise = new Promise(function(resolve, reject) {
    sessionPromiseResolve = resolve;
});

sessionsAPI.create = function (req, res) {
    if (!req.session.passport){
        logAndRedirectToLogin("lost session", res, req);
        return new Promise(function (resolve, reject){reject("lost session")});
    }
    var api_server = req.query['api_server'] || (req.protocol + '://' + configurationAPI.globalConfiguration.get().api_server);
    var uri = utils.confdPort(api_server);
    var username = req.session.passport.user['username'];
    var authorization_header_string = 'Bearer ' + req.session.passport.user.user.access_token;
    return new Promise(function (resolve, reject) {
        req.session.authorization = authorization_header_string;
        req.session.api_server = api_server;
        req.session.api_protocal = req.protocol;
        req.session.loggedIn = true;
        req.session.userdata = {
            username: username,
        };
        UserManagement.getUserInfo(req, req.session.passport.user.username).then(function (results) {
            var project_list_for_user = null;
            if (!req.session.projectId && results.data.project) {
                project_list_for_user = Object.keys(results.data.project);
                if (project_list_for_user.length > 0) {
                    req.session.projectId = project_list_for_user.sort() && project_list_for_user[0];
                }
            }
            sessionsAPI.setTopApplication(req);
            req.session.isLCM = results.data.isLCM;

            req.session['ui-state'] = results.data['ui-state'];
            var lastActiveProject = req.session['ui-state'] && req.session['ui-state']['last-active-project'];
            if (lastActiveProject) {
                if (results.data.project.hasOwnProperty(lastActiveProject)) {
                    req.session.projectId = lastActiveProject;
                }

            }

            var successMsg = 'User => ' + username + ' successfully logged in.';
            successMsg += req.session.projectId ? 'Project => ' + req.session.projectId + ' set as default.' : '';

            console.log(successMsg);

            req.session.save(function (err) {
                if (err) {
                    console.log('Error saving session to store', err);
                }
                // no response data, just redirect now that session data is set
                if (req.session['ui-state'] && req.session['ui-state']['last-active-uri']) {
                    var url = URL.parse(req.session['ui-state']['last-active-uri']);
                    var host = req.headers.host;
                    var path = url.path;
                    var hash = url.hash;
                    var protocol = url.protocol;
                    var newUrl = protocol + '//' + host + path + (hash?hash:'');
                    console.log('Redirecting to: ' + newUrl)
                    res.redirect(newUrl)
                } else {
                    if(req.session.topApplication) {
                        res.redirect(utils.buildRedirectURL(req, configurationAPI.globalConfiguration, req.session.topApplication));
                    } else {
                        res.redirect(utils.buildRedirectURL(req, configurationAPI.globalConfiguration, 'user_management', '#/user-profile'));
                    }
                }
            })

            sessionPromiseResolve(req.session);

        }).catch(function (error) {
            // Something went wrong - Redirect to /login
            var errorMsg = 'Error logging in or getting list of projects. Error: ' + error;
            console.log(errorMsg);
            logAndRedirectToLogin(errorMsg, res, req);
        });
    })
};

sessionsAPI.addProjectToSession = function (req, res) {
    return new Promise(function (resolve, reject) {
        if (req.session && req.session.loggedIn == true) {
            Promise.all([UserManagement.getProfile(req), UserManagement.updateActiveProject(req)]).then(function () {
                req.session.projectId = req.params.projectId;
                req.session.topApplication = null;
                sessionsAPI.setTopApplication(req, req.query.app);
                req.session.save(function (err) {
                    if (err) {
                        console.log('Error saving session to store', err);
                        var errorMsg = 'Session does not exist or not logged in';
                        logAndReject(errorMsg, reject, constants.HTTP_RESPONSE_CODES.ERROR.NOT_FOUND);
                    } else {
                        var successMsg = 'Added project ' + req.session.projectId + ' to session ' + req.sessionID;
                        console.log(successMsg);
                        var response = {
                            statusCode: constants.HTTP_RESPONSE_CODES.SUCCESS.OK,
                            data: JSON.stringify({
                                status: successMsg
                            })
                        }
                        return resolve(response);
                    }
                    // res.redirect('/');
                });

            })

        }
    });
}

sessionsAPI.delete = function (req, res) {
    var idpServerAddress = configurationAPI.globalConfiguration.get().idp_server_address;
    var idpServerProtocol = configurationAPI.globalConfiguration.get().idp_server_protocol;
    var idpServerPortNumber = configurationAPI.globalConfiguration.get().idp_server_port_number;
    var idpEndSessionPath = constants.END_SESSION_PATH;
    var url = idpServerProtocol + '://' +
        idpServerAddress + ':' +
        idpServerPortNumber + '/' +
        idpEndSessionPath;
    var authorization = req.session.authorization;
    return new Promise(function (resolve, reject) {
        Promise.all([
            UserManagement.updateActiveUri(req),
            new Promise(function (success, failure) {
                req.session.destroy(function (err) {
                    if (err) {
                        var errorMsg = 'Error deleting session. Error: ' + err;
                        console.log(errorMsg);
                        success({
                            status: 'error',
                            message: errorMsg
                        });
                    }

                    var successMsg = 'Success deleting session';
                    console.log(successMsg);

                    success({
                        status: 'success',
                        message: successMsg
                    });
                });
            })
        ]).then(function (result) {
            // assume the session was deleted!
            var message = 'Session was deleted. Redirecting to end_session';
            resolve({
                statusCode: constants.HTTP_RESPONSE_CODES.SUCCESS.OK,
                data: {
                    url: url,
                    message: message
                }
            });

        }).catch(function (error) {
            var message = "An error occured while deleting session";
            resolve({
                statusCode: constants.HTTP_RESPONSE_CODES.SUCCESS.OK,
                data: {
                    url: url,
                    message: message
                }
            });
        });
    });
}

sessionsAPI.setTopApplication = function (req, suggestedPlugin) {
    var selectedProject = req.session.projectId;
    var userProject = selectedProject ? req.session.projectMap[selectedProject] : null;
    if (userProject) {
        if (suggestedPlugin) {
            if (req.session.platformMap['rw-rbac-platform:super-admin']) {
                topApplication = suggestedPlugin;
            } else {
                var roles = _.reduce(Object.keys(Application.key), function (accumulator, role) {
                    if (Application.key[role] === suggestedPlugin) {
                        accumulator.push(role);
                    }
                    return accumulator;
                }, []);
                if (_.some(roles, function (role){return userProject.role[role]})) {
                    req.session.topApplication = suggestedPlugin;
                    return;
                }
            }
        }
        _.some(Application.order, function (role) {
            if (userProject.role[role] || req.session.platformMap.role[role]) {
                req.session.topApplication = Application.key[role];
                return true;
            }
            return false;
        })
    }
}

module.exports = sessionsAPI;
