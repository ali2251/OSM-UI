/*
 *
 *   Copyright 2017 RIFT.IO Inc
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
 * CSRF util for use across the api_server.
 * @module framework/core/api_utils/csrf
 * @author Kiran Kashalkar <kiran.kashalkar@riftio.com>
 */

var constants = require('./constants.js');
var utils = require('./utils.js');

var target = null;

function configure(config) {
	target = config.target;
}

function csrfCheck(req, res, next) {
	var host = null;

	if (req.headers.origin != 'null') {
		host = utils.getHostNameFromURL(req.headers.origin);
	} else if (req.headers.referer) {
		host = utils.getHostNameFromURL(req.headers.referer);
	} else {
		var msg = 'Request did not contain an origin or referer header. Request terminated.';
		var error = {};
		error.statusCode = constants.HTTP_RESPONSE_CODES.ERROR.METHOD_NOT_ALLOWED;
		error.errorMessage = {
			error: msg
		}
		return utils.sendErrorResponse(error, res);
	}

	if (!host || host != target) {
		var msg = 'Request did not originate from authorized source (Potential CSRF attempt). Request terminated.';
		var error = {};
		error.statusCode = constants.HTTP_RESPONSE_CODES.ERROR.METHOD_NOT_ALLOWED;
		error.errorMessage = {
			error: msg
		}
		return utils.sendErrorResponse(error, res);
	} else {
		return next();
	}
}

module.exports = {
	configure: configure,
	csrfCheck: csrfCheck
};