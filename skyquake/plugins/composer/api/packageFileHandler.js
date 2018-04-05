var request = require('request');
var Promise = require('bluebird');
var rp = require('request-promise');
var utils = require('../../../framework/core/api_utils/utils.js');
var constants = require('../../../framework/core/api_utils/constants.js');
var fs = require('fs');
var _ = require('lodash');

var PackageFileHandler = {};

function deleteFile(filename) {
	setTimeout(function() {
		try {
			fs.unlinkSync(constants.BASE_PACKAGE_UPLOAD_DESTINATION + '/' + filename);
		} catch (e) {
			console.log("file delete error", e);
		}
	}, constants.PACKAGE_FILE_DELETE_DELAY_MILLISECONDS);
};

function checkStatus(req, transactionId, jobType) {
    var api_server = req.query["api_server"];
    var uri = utils.confdPort(api_server);
	var id = req.params['id'];
	var jobName = jobType + '-jobs';
    var url = utils.projectContextUrl(req, uri + '/api/operational/' + jobName + (transactionId ? '/job/' + transactionId : ''));
	request({
		url: url,
		method: 'GET',
		headers: _.extend({}, constants.HTTP_HEADERS.accept.data, {
			'Authorization': req.session && req.session.authorization
		}),
		forever: constants.FOREVER_ON,
       	rejectUnauthorized: false
	}, function(error, response, body) {
		if (error) {
			console.log('Error checking status for transaction', transactionId, '. Will delete file', req.file.filename, ' in ', constants.PACKAGE_FILE_DELETE_DELAY_MILLISECONDS ,' milliseconds');
			deleteFile(req.file.filename);
		} else {
			var jsonStatus = null;
			if (typeof body == 'string' || body instanceof String) {
				try {jsonStatus = JSON.parse(body)['rw-pkg-mgmt:job'];} catch(e) {jsonStatus = {status: 'failure'}}
			} else {
				jsonStatus = body;
			}

			if (jsonStatus && jsonStatus.status && (jsonStatus.status == 'COMPLETED' || jsonStatus.status == 'FAILED')) {
				console.log('Transaction ', transactionId, ' completed with status ', jsonStatus.status ,'. Will delete file', req.file.filename, ' in ', constants.PACKAGE_FILE_DELETE_DELAY_MILLISECONDS ,' milliseconds');
				deleteFile(req.file.filename);
			} else {
				setTimeout(function() {
					checkStatus(req, transactionId, jobType);
				}, constants.PACKAGE_FILE_ONBOARD_TRANSACTION_STATUS_CHECK_DELAY_MILLISECONDS);
			}
		}
	});
};

PackageFileHandler.checkCreatePackageStatusAndHandleFile = function(req, transactionId, jobType) {
	checkStatus(req, transactionId, jobType);
};


module.exports = PackageFileHandler;
