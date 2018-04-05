var request = require('request');
var Promise = require('bluebird');
var rp = require('request-promise');
var utils = require('../../../framework/core/api_utils/utils.js');
var constants = require('../../../framework/core/api_utils/constants.js');
var _ = require('underscore');
var APIVersion = '/v2'
var Redundancy = {};

Redundancy.get = function(req) {
    return new Promise(function(resolve, reject) {
        var self = this;
        var api_server = req.query["api_server"];
        var requestHeaders = {};
        var url = utils.confdPort(api_server) + '/api/operational/redundancy-config';

        _.extend(
            requestHeaders,
            constants.HTTP_HEADERS.accept.data, {
                'Authorization': req.session && req.session.authorization
            }
        );

        request({
                url: url + '?deep',
                type: 'GET',
                headers: requestHeaders,
                forever: constants.FOREVER_ON,
                rejectUnauthorized: false
            },
            function(error, response, body) {
                var data;
                var objKey = 'rw-redundancy:redundancy-config';
                //SDN model doesn't follow convention
                if (utils.validateResponse('Redundancy.get', error, response, body, resolve, reject)) {
                    try {
                        data = JSON.parse(response.body);
                        data = data[objKey]
                    } catch (e) {
                        console.log('Problem with "Redundancy.get"', e);
                        var err = {};
                        err.statusCode = 500;
                        err.errorMessage = {
                            error: 'Problem with "Redundancy.get": ' + e
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


Redundancy.getState = function(req) {
    return new Promise(function(resolve, reject) {
        var self = this;
        var api_server = req.query["api_server"];
        var requestHeaders = {};
        var url = utils.confdPort(api_server) + '/api/operational/redundancy-state';
        _.extend(
            requestHeaders,
            constants.HTTP_HEADERS.accept.data, {
                'Authorization': req.session && req.session.authorization
            }
        );
        request({
                url: url + '?deep',
                type: 'GET',
                headers: requestHeaders,
                forever: constants.FOREVER_ON,
                rejectUnauthorized: false
            },
            function(error, response, body) {
                var data;
                var objKey = 'rw-redundancy:redundancy-state';
                //SDN model doesn't follow convention
                if (utils.validateResponse('Redundancy.getState', error, response, body, resolve, reject)) {
                    try {
                        data = JSON.parse(response.body);
                        data = data[objKey]
                    } catch (e) {
                        console.log('Problem with "Redundancy.getState"', e);
                        var err = {};
                        err.statusCode = 500;
                        err.errorMessage = {
                            error: 'Problem with "Redundancy.getState": ' + e
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

Redundancy.configUpdate = function(req) {
    var self = this;
    var id = req.params.id || req.params.name;
    var api_server = req.query["api_server"];
    var data = req.body;
    var requestHeaders = {};
    var createData = {};
    var updateTasks = [];
    var method = 'PUT';
    if(data.hasOwnProperty('revertive-preference')) {
        var revertivePreferenceUrl = utils.confdPort(api_server) + '/api/config/redundancy-config/revertive-preference';
        var revertuvePreferenceData = {
            'preferred-site-name': data['revertive-preference']['preferred-site-name']
        };
        var revertivePreferencePromise = new Promise(function(resolve, reject) {
            _.extend(requestHeaders,
                constants.HTTP_HEADERS.accept.data,
                constants.HTTP_HEADERS.content_type.data, {
                    'Authorization': req.session && req.session.authorization
                });
            request({
                url: revertivePreferenceUrl,
                method: method,
                headers: requestHeaders,
                forever: constants.FOREVER_ON,
                rejectUnauthorized: false,
                json: revertuvePreferenceData,
            }, function(error, response, body) {
                if (utils.validateResponse('revertivePreferencePromise.' + method, error, response, body, resolve, reject)) {
                    return resolve({
                        statusCode: response.statusCode,
                        data: JSON.stringify(response.body)
                    });
                };
            });
        });
        updateTasks.push(revertivePreferencePromise);
    }

    if(data.hasOwnProperty('geographic-failover-decision')) {
        var geoFailDecisionConfigUrl = utils.confdPort(api_server) + '/api/config/redundancy-config';
        var geoFailDecisionConfigData = {'geographic-failover-decision' : data['geographic-failover-decision']};
        var geoFailDecisionPromise = new Promise(function(resolve, reject) {
            _.extend(requestHeaders,
                constants.HTTP_HEADERS.accept.data,
                constants.HTTP_HEADERS.content_type.data, {
                    'Authorization': req.session && req.session.authorization
                });
            request({
                url: geoFailDecisionConfigUrl,
                method: method,
                headers: requestHeaders,
                forever: constants.FOREVER_ON,
                rejectUnauthorized: false,
                json: geoFailDecisionConfigData,
            }, function(error, response, body) {
                if (utils.validateResponse('geoFailDecisionPromise.' + method, error, response, body, resolve, reject)) {
                    return resolve({
                        statusCode: response.statusCode,
                        data: JSON.stringify(response.body)
                    });
                };
            });
        });
        updateTasks.push(geoFailDecisionPromise);
    }

    if(data.hasOwnProperty('user-credentials')) {
        var userCredentialsUrl = utils.confdPort(api_server) + '/api/config/redundancy-config';
        var userCredentialsData = {'user-credentials' : data['user-credentials']};
        var userCredentialsPromise = new Promise(function(resolve, reject) {
            _.extend(requestHeaders,
                constants.HTTP_HEADERS.accept.data,
                constants.HTTP_HEADERS.content_type.data, {
                    'Authorization': req.session && req.session.authorization
                });
            request({
                url: userCredentialsUrl,
                method: method,
                headers: requestHeaders,
                forever: constants.FOREVER_ON,
                rejectUnauthorized: false,
                json: userCredentialsData,
            }, function(error, response, body) {
                if (utils.validateResponse('userCredentials.' + method, error, response, body, resolve, reject)) {
                    return resolve({
                        statusCode: response.statusCode,
                        data: JSON.stringify(response.body)
                    });
                };
            });
        });
        updateTasks.push(userCredentialsPromise);
    }

    if(data.hasOwnProperty('polling-config')) {
        var pollingConfigUrl = utils.confdPort(api_server) + '/api/config/redundancy-config/polling-config';
        var pollingConfigData = data['polling-config'];
        var revertivePreferencePromise = new Promise(function(resolve, reject) {
            _.extend(requestHeaders,
                constants.HTTP_HEADERS.accept.data,
                constants.HTTP_HEADERS.content_type.data, {
                    'Authorization': req.session && req.session.authorization
                });
            request({
                url: pollingConfigUrl,
                method: method,
                headers: requestHeaders,
                forever: constants.FOREVER_ON,
                rejectUnauthorized: false,
                json: pollingConfigData,
            }, function(error, response, body) {
                if (utils.validateResponse('pollingConfigPromise.' + method, error, response, body, resolve, reject)) {
                    return resolve({
                        statusCode: response.statusCode,
                        data: JSON.stringify(response.body)
                    });
                };
            });
        });
        updateTasks.push(revertivePreferencePromise);
    }

    if(data.hasOwnProperty('dns-ip-fqdn')) {
        var dnsIpFqdn = data['dns-ip-fqdn'];
        var dnsIpFqdnUrl = utils.confdPort(api_server) + '/api/config/redundancy-config';
        if(dnsIpFqdn.trim() != '') {
            var dnsIpFqdnData = {'dns-ip-fqdn' : dnsIpFqdn}
            var dnsIpFqdnPromise = new Promise(function(resolve, reject) {
                _.extend(requestHeaders,
                    constants.HTTP_HEADERS.accept.data,
                    constants.HTTP_HEADERS.content_type.data, {
                        'Authorization': req.session && req.session.authorization
                    });
                request({
                    url: dnsIpFqdnUrl,
                    method: method,
                    headers: requestHeaders,
                    forever: constants.FOREVER_ON,
                    rejectUnauthorized: false,
                    json: dnsIpFqdnData,
                }, function(error, response, body) {
                    if (utils.validateResponse('dnsIpFqdnPromise.' + method, error, response, body, resolve, reject)) {
                        return resolve({
                            statusCode: response.statusCode,
                            data: JSON.stringify(response.body)
                        });
                    };
                });
            });
        } else {
            //Delete config item
            var dnsIpFqdnPromise = new Promise(function(resolve, reject) {
                _.extend(requestHeaders,
                    constants.HTTP_HEADERS.accept.data,
                    constants.HTTP_HEADERS.content_type.data, {
                        'Authorization': req.session && req.session.authorization
                    });
                request({
                    url: dnsIpFqdnUrl + '/dns-ip-fqdn',
                    method: 'DELETE',
                    headers: requestHeaders,
                    forever: constants.FOREVER_ON,
                    rejectUnauthorized: false
                }, function(error, response, body) {
                    if (utils.validateResponse('dnsIpFqdnDelete.' + method, error, response, body, resolve, reject)) {
                        return resolve({
                            statusCode: response.statusCode,
                            data: JSON.stringify(response.body)
                        });
                    };
                });
            });
        }
        updateTasks.push(dnsIpFqdnPromise);
    }
    return new Promise(function(resolve, reject) {
        Promise.all(updateTasks).then(function(results) {
            if(results && results[0]) {
                resolve({
                    statusCode: results[0].statusCode,
                    data: {}
                });
            }
        })
    })
}


Redundancy.siteUpdate = function(req) {
    var self = this;
    var id = req.params.id || req.params.name;
    var api_server = req.query["api_server"];
    var data = req.body;
    var requestHeaders = {};
    var createData = {};
    var url = utils.confdPort(api_server) + '/api/config/redundancy-config/site'
    var method = 'POST'
    createData = {};
    if (!id) {
        createData = {site: data}
    } else {
        method = 'PUT';
        url += '/' + encodeURIComponent(id);
        createData['rw-redundancy:site'] = data;
    }



    return new Promise(function(resolve, reject) {
        _.extend(requestHeaders,
            constants.HTTP_HEADERS.accept.data,
            constants.HTTP_HEADERS.content_type.data, {
                'Authorization': req.session && req.session.authorization
            });
        request({
            url: url,
            method: method,
            headers: requestHeaders,
            forever: constants.FOREVER_ON,
            rejectUnauthorized: false,
            json: createData,
        }, function(error, response, body) {
            if (utils.validateResponse('siteUpdate.' + method, error, response, body, resolve, reject)) {
                return resolve({
                    statusCode: response.statusCode,
                    data: JSON.stringify(response.body)
                });
            };
        });
    })
}

Redundancy.siteDelete = function(req) {
    var self = this;
    var id = req.params.id || req.params.name;
    var api_server = req.query["api_server"];
    var data = req.body;
    var requestHeaders = {};
    var createData = {};
    var url = utils.confdPort(api_server) + '/api/config/redundancy-config/site/';
    url += encodeURIComponent(id);
    return new Promise(function(resolve, reject) {
        _.extend(requestHeaders,
            constants.HTTP_HEADERS.accept.data,
            constants.HTTP_HEADERS.content_type.data, {
                'Authorization': req.session && req.session.authorization
            });
        request({
            url: url,
            method: 'DELETE',
            headers: requestHeaders,
            forever: constants.FOREVER_ON,
            rejectUnauthorized: false,
        }, function(error, response, body) {
            if (utils.validateResponse( 'siteUpdate.DELETE', error, response, body, resolve, reject)) {
                return resolve({
                    statusCode: response.statusCode,
                    data: JSON.stringify(response.body)
                });
            };
        });
    })
}

module.exports = Redundancy;
