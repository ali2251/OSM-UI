
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
 * auth routes module. Provides a RESTful API for this
 * skyquake instance's auth state.
 * @module framework/core/modules/routes/auth
 * @author Kiran Kashalkar <kiran.kashalkar@riftio.com>
 */

var cors = require('cors');
var bodyParser = require('body-parser');
var Router = require('express').Router();
var utils = require('../../api_utils/utils');
var configurationAPI = require('../api/configuration');

var auth = {};

auth.routes = function(authManager) {
	console.log('Configuring auth routes');
	Router.use(bodyParser.json());
	Router.use(cors());
	Router.use(bodyParser.urlencoded({
	    extended: true
	}));

	// Define routes.
    Router.get('/', function(req, res) {
    	var default_page = null;
    	var api_server = req.query['api_server'] || (req.protocol + '://' + configurationAPI.globalConfiguration.get().api_server);
        if (req.session && req.session.topApplication) {
            default_page = utils.buildRedirectURL(req, configurationAPI.globalConfiguration, req.session.topApplication);
        } else {
            default_page = utils.buildRedirectURL(req, configurationAPI.globalConfiguration, 'user_management', '#/user-profile');
        }
        if (!req.user) {
            res.redirect('/login');
        } else {
            res.redirect(default_page);
        }
    });

    Router.get('/login', cors(), function(req, res) {
        // res.render('login.html');
        res.redirect('/login/idp');
    });

    Router.get('/login/idp',
        authManager.passport.authenticate('oauth2')
    );

    Router.get('/callback', function(req, res, next) {
        authManager.passport.authenticate('oauth2', function(err, user, info) {
            if (err) {
                // Catch some errors specific to deployments (e.g. IDP unavailable)
                if (err.oauthError && err.oauthError.code == 'ENOTFOUND') {
                    return res.render('idpconnectfail.ejs', {
                        callback_url: req.url
                    });
                }
                return res.redirect('/login');
            }
            if (!user) {
                return res.redirect('/login');
            }
            req.logIn(user, function(err) {
                if (err) {
                    return next(err);
                }
                return res.redirect('/session?redirectParams=' + req.url);
            });
        })(req, res, next);
    });


    Router.get('/login.html', cors(), function(req, res) {
        res.render('login.html');
    });
}

auth.router = Router;

module.exports = auth;
