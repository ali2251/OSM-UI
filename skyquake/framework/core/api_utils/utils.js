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
// Helper Functions


/**
 * Utils for use across the api_server.
 * @module framework/core/utils
 */

var fs = require('fs');
var request = require('request');
var Promise = require('promise');
var CONSTANTS = require('./constants.js');
var CONFD_PORT = '8008';
var APIVersion = '/v1';
var _ = require('lodash');

var requestWrapper = function(request) {
	if (process.env.HTTP_PROXY && process.env.HTTP_PROXY != '') {
		request = request.defaults({
			'proxy': process.env.HTTP_PROXY
		});
	}
	return request;
}

var confdPort = function(api_server) {
	try {
		api_server = api_server.replace(api_server.match(/[0-9](:[0-9]+)/)[1], '')
	} catch (e) {

	}
	return api_server + ':' + CONFD_PORT;
};

var projectContextUrl = function(req, url) {
	//NOTE: We need to go into the sessionStore because express-session
	// does not reliably update the session.
	// See https://github.com/expressjs/session/issues/450
	var projectId = (req.session &&
					 req.sessionStore &&
					 req.sessionStore.sessions &&
					 req.sessionStore.sessions[req.session.id] &&
					 JSON.parse(req.sessionStore.sessions[req.session.id])['projectId']) ||
					 (null);
	if (projectId) {
		projectId = encodeURIComponent(projectId);
		return url.replace(/(\/api\/operational\/|\/api\/config\/)(.*)/, '$1project/' + projectId + '/$2');
	}
	return url;
}

var addProjectContextToRPCPayload = function(req, url, inputPayload) {
	//NOTE: We need to go into the sessionStore because express-session
	// does not reliably update the session.
	// See https://github.com/expressjs/session/issues/450
	var projectId = (req.session &&
					 req.sessionStore &&
					 req.sessionStore.sessions &&
					 req.sessionStore.sessions[req.session.id] &&
					 JSON.parse(req.sessionStore.sessions[req.session.id])['projectId']) ||
					 (null);
	if (projectId) {
		if (url.indexOf('/api/operations/')) {
			inputPayload['project-name'] = projectId;
		}
	}
	return inputPayload;
}


var validateResponse = function(callerName, error, response, body, resolve, reject) {
	var res = {};

	if (error) {
		console.log('Problem with "', callerName, '": ', error);
		res.statusCode = 500;
		res.errorMessage = {
			error: 'Problem with ' + callerName + ': ' + error
		};
		reject(res);
		return false;
	} else if (response.statusCode >= CONSTANTS.HTTP_RESPONSE_CODES.ERROR.BAD_REQUEST) {
		console.log('Problem with "', callerName, '": ', response.statusCode, ':', body);
		res.statusCode = response.statusCode;

		// auth specific
		if (response.statusCode == CONSTANTS.HTTP_RESPONSE_CODES.ERROR.UNAUTHORIZED) {
			res.errorMessage = {
				error: 'Authentication needed' + body
			};
			reject(res);
			return false;
		}

		res.errorMessage = {
			error: 'Problem with ' + callerName + ': ' + response.statusCode + ': ' + typeof(body) == 'string' ? body : JSON.stringify(body),
			body: body
		};

		reject(res);
		return false;
	} else if (response.statusCode == CONSTANTS.HTTP_RESPONSE_CODES.SUCCESS.NO_CONTENT) {
		resolve({
			statusCode: response.statusCode,
			data: {}
		});
		return false;
	} else {
		return true;
	}
};


var checkAuthorizationHeader = function(req) {
	return new Promise(function(resolve, reject) {
		if (req.session && req.session.authorization == null) {
			reject();
		} else {
			resolve();
		}
	});
};

if (process.env.LOG_REQUESTS) {
	var logFile = process.env.REQUESTS_LOG_FILE;

	if (logFile && logFile != '') {
		validateResponse = function(callerName, error, response, body, resolve, reject) {
			var res = {};

			if (error) {
				console.log('Problem with "', callerName, '": ', error);
				res.statusCode = 500;
				res.errorMessage = {
					error: 'Problem with ' + callerName + ': ' + error
				};
				reject(res);
				fs.appendFileSync(logFile, 'Request API: ' + response.request.uri.href + ' ; ' + 'Error: ' + error);
				return false;
			} else if (response.statusCode >= CONSTANTS.HTTP_RESPONSE_CODES.ERROR.BAD_REQUEST) {
				console.log('Problem with "', callerName, '": ', response.statusCode, ':', body);
				res.statusCode = response.statusCode;

				// auth specific
				if (response.statusCode == CONSTANTS.HTTP_RESPONSE_CODES.ERROR.UNAUTHORIZED) {
					res.errorMessage = {
						error: 'Authentication needed' + body
					};
					reject(res);
					fs.appendFileSync(logFile, 'Request API: ' + response.request.uri.href + ' ; ' + 'Error Body: ' + body);
					return false;
				}

				res.errorMessage = {
					error: 'Problem with ' + callerName + ': ' + response.statusCode + ': ' + body
				};

				reject(res);
				fs.appendFileSync(logFile, 'Request API: ' + response.request.uri.href + ' ; ' + 'Error Body: ' + body);
				return false;
			} else if (response.statusCode == CONSTANTS.HTTP_RESPONSE_CODES.SUCCESS.NO_CONTENT) {
				resolve();
				fs.appendFileSync(logFile, 'Request API: ' + response.request.uri.href + ' ; ' + 'Response Body: ' + body);
				return false;
			} else {
				fs.appendFileSync(logFile, 'Request API: ' + response.request.uri.href + ' ; ' + 'Response Body: ' + body);
				return true;
			}
		};
	}
}

/**
 * Serve the error response back back to HTTP requester
 * @param {Object} error - object of the format
 *					{
 *						statusCode - HTTP code to respond back with
 *						error - actual error JSON object to serve
 *					}
 * @param {Function} res - a handle to the express response function
 */
var sendErrorResponse = function(error, res) {
	if (!error.statusCode) {
		console.error('Status Code has not been set in error object: ', error);
	}
	res.status(error.statusCode);
	res.send(error);
}

/**
 * Serve the success response back to HTTP requester
 * @param {Object} response - object of the format
 *					{
 *						statusCode - HTTP code to respond back with
 *						data - actual data JSON object to serve
 *					}
 * @param {Function} res - a handle to the express response function
 */
var sendSuccessResponse = function(response, res) {
	res.status(response.statusCode);
	res.send(response.data);
}

var passThroughConstructor = function(app) {
	app.get('/passthrough/:type/*', function(req, res) {
		var url = req.params[0];
		var type = req.params.type;
		var api_server = req.query["api_server"];
		var uri = confdPort(api_server) + APIVersion + '/' + url + '?deep';
		// Check that type is valid
		switch (type) {
			case 'data':
				;
			case 'collection':
				break;
			default:
				res.send({});
		}
		new Promise(function(resolve, reject) {
			request({
				uri: projectContextUrl(req, uri),
				method: 'GET',
				headers: _.extend({}, CONSTANTS.HTTP_HEADERS.accept[type], {
					'Authorization': req.session && req.session.authorization,
					forever: CONSTANTS.FOREVER_ON,
					rejectUnauthorized: false,
				})
			}, function(error, response, body) {
				if (validateResponse('Passthrough: ' + url, error, response, body, resolve, reject)) {
					resolve(JSON.parse(response.body))
				};
			});
		}).then(function(data) {
            res.send(data);
        }, function(error) {
        	res.send({'error': error, uri: uri})
        });;
	});
}

var getPortForProtocol = function(protocol) {
  switch (protocol) {
    case 'http':
      return 8000;
    case 'https':
      return 8443;
  }
}

var buildRedirectURL = function(req, globalConfiguration, plugin, extra) {
    var api_server = req.query['api_server'] || (req.protocol + '://' + globalConfiguration.get().api_server);
    var download_server = req.query['dev_download_server'] || globalConfiguration.get().dev_download_server;
	var url = '/';
	url += plugin;
	url += '/?api_server=' + api_server;
	url += download_server ? '&dev_download_server=' + download_server : '';
	url += extra || '';
	return url;
}

var getHostNameFromURL = function(url) {
    var match = url.match(/^(https?\:)\/\/(([^:\/?#]*)(?:\:([0-9]+))?)([^?#]*)(\?[^#]*|)(#.*|)$/);
    return match && match[3];
}

var dataToJsonSansPropNameNamespace = function(s) {
	var a = JSON.parse(s);
	var b = JSON.stringify(a);
	var c = b.replace(/{"[-\w]+:/g, '{"');
	var d = c.replace(/,"[-\w]+:/g, ',"');
	var j = JSON.parse(d);
	return j;
}

module.exports = {
	/**
	 * Ensure confd port is on api_server variable.
	 **/
	confdPort: confdPort,

	validateResponse: validateResponse,

	checkAuthorizationHeader: checkAuthorizationHeader,

	request: requestWrapper.call(null, request),

	sendErrorResponse: sendErrorResponse,

	sendSuccessResponse: sendSuccessResponse,

    passThroughConstructor: passThroughConstructor,

    getPortForProtocol: getPortForProtocol,

    projectContextUrl: projectContextUrl,

	addProjectContextToRPCPayload: addProjectContextToRPCPayload,

	buildRedirectURL: buildRedirectURL,

	getHostNameFromURL: getHostNameFromURL,

	dataToJsonSansPropNameNamespace: dataToJsonSansPropNameNamespace
};
