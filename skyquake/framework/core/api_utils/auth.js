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
 * Auth util for use across the api_server.
 * @module framework/core/api_utils/auth
 * @author Kiran Kashalkar <kiran.kashalkar@riftio.com>
 */

var jsonLoader = require('require-json');
var passport = require('passport');
var OpenIdConnectStrategy = require('passport-openidconnect').Strategy;
var BearerStrategy = require('passport-http-bearer').Strategy;
var OAuth2Strategy = require('passport-oauth2');
var OAuth2RefreshTokenStrategy = require('passport-oauth2-middleware').Strategy;
var openidConnectConfig = require('./openidconnect_config.json');
var _ = require('lodash');
var constants = require('./constants');
var utils = require('./utils');
var request = utils.request;
var rp = require('request-promise');
var nodeutil = require('util');


var Authorization = function(openidConfig) {

    var self = this;

    self.passport = passport;

    self.openidConnectConfig = openidConnectConfig;

    var refreshStrategy = new OAuth2RefreshTokenStrategy({
        refreshWindow: constants.REFRESH_WINDOW, // Time in seconds to perform a token refresh before it expires
        userProperty: 'user', // Active user property name to store OAuth tokens
        authenticationURL: '/login', // URL to redirect unauthorized users to
        callbackParameter: 'callback' //URL query parameter name to pass a return URL
    });

    self.passport.use('main', refreshStrategy);

    var openidConfigPrefix = openidConfig.idpServerProtocol + '://' + openidConfig.idpServerAddress + ':' + openidConfig.idpServerPortNumber;

    self.openidConnectConfig.authorizationURL = openidConfigPrefix + self.openidConnectConfig.authorizationURL;
    self.openidConnectConfig.tokenURL = openidConfigPrefix + self.openidConnectConfig.tokenURL;
    self.openidConnectConfig.callbackURL = openidConfig.callbackServerProtocol + '://' + openidConfig.callbackAddress + ':' + openidConfig.callbackPortNumber + self.openidConnectConfig.callbackURL;

    var userInfoURL = openidConfigPrefix + self.openidConnectConfig.userInfoURL;

    function SkyquakeOAuth2Strategy(options, verify) {
        OAuth2Strategy.call(this, options, verify);
    }
    nodeutil.inherits(SkyquakeOAuth2Strategy, OAuth2Strategy);

    SkyquakeOAuth2Strategy.prototype.userProfile = function(access_token, done) {

        var requestHeaders = {
            'Authorization': 'Bearer ' + access_token
        };

        request({
            url: userInfoURL,
            type: 'GET',
            headers: requestHeaders,
            forever: constants.FOREVER_ON,
            rejectUnauthorized: constants.REJECT_UNAUTHORIZED
        }, function(err, response, body) {
            if (err) {
                console.log('Error obtaining userinfo: ', err);
                return done(null, {
                    username: '',
                    subject: ''
                });
            } else {
                if (response.statusCode == constants.HTTP_RESPONSE_CODES.SUCCESS.OK) {
                    try {
                        var data = JSON.parse(response.body);
                        var username = data['preferred_username'];
                        var subject = data['sub'];
                        var domain = data['user_domain'] || 'system';
                        return done(null, {
                            username: username,
                            subject: subject,
                            domain: domain
                        })
                    } catch (ex) {
                        console.log('Error parsing userinfo data');
                        return done(null, {
                            username: '',
                            subject: ''
                        });
                    }
                }
            }
        })
    };

    var oauthStrategy = new SkyquakeOAuth2Strategy(self.openidConnectConfig,
        refreshStrategy.getOAuth2StrategyCallback());

    self.passport.use('oauth2', oauthStrategy);
    refreshStrategy.useOAuth2Strategy(oauthStrategy);

    self.passport.serializeUser(function(user, done) {
        done(null, user);
    });

    self.passport.deserializeUser(function(obj, done) {
        done(null, obj);
    });

};

Authorization.prototype.configure = function(config) {
	this.config = config;
	// Initialize Passport and restore authentication state, if any, from the
    // session.
    if (this.config.app) {
    	this.config.app.use(this.passport.initialize());
    	this.config.app.use(this.passport.session());
    } else {
    	console.log('FATAL error. Bad config passed into authorization module');
    }
};

Authorization.prototype.invalidate_token = function(token) {

};

module.exports = Authorization;
