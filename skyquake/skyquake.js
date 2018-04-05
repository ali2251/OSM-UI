

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
 * Main skyquake module.
 * @module skyquake
 * @author Kiran Kashalkar <kiran.kashalkar@riftio.com>
 */

// Standard library imports for forking
var cluster = require("cluster");
var cpu = require('os').cpus().length;
var clusteredLaunch = process.env.CLUSTER_SUPPORT || false;
var constants = require('./framework/core/api_utils/constants');
// Uncomment for Replay support
// const Replay  = require('replay');
var freePorts = [];
for (var i = 0; i < constants.SOCKET_POOL_LENGTH; i++) {
    freePorts[i] = constants.SOCKET_BASE_PORT + i;
};


if (cluster.isMaster && clusteredLaunch) {
    console.log(cpu, 'CPUs found');
    for (var i = 0; i < cpu; i ++) {
        var worker = cluster.fork();
        worker.on('message', function(msg) {
            if (msg && msg.getPort) {
                worker.send({
                    port: freePorts.shift()
                });
                console.log('freePorts after shift for worker', this.process.pid, ':', freePorts);
            } else if (msg && msg.freePort) {
                freePorts.unshift(msg.port);
                console.log('freePorts after unshift of', msg.port, 'for worker', this.process.pid, ':', freePorts);
            }
        });
    }

    cluster.on('online', function(worker) {
        console.log("Worker Started pid : " + worker.process.pid);
    });
    cluster.on('exit', function(worker, code, signal) {
        console.log('worker ' + worker.process.pid + ' stopped');
    });
} else {
    // Standard library imports
    require('require-json');
    var argv = require('minimist')(process.argv.slice(2));
    var pid = process.pid;
    var fs = require('fs');
    var https = require('https');
    var http = require('http');
    var express = require('express');
    var session = require('express-session');
    var cors = require('cors');
    var lusca = require('lusca');
    var bodyParser = require('body-parser');
    var _ = require('lodash');
    var reload = require('require-reload')(require);
    var Sockets = require('./framework/core/api_utils/sockets.js');
    var AuthorizationManager = require('./framework/core/api_utils/auth.js');
    var utils = require('./framework/core/api_utils/utils.js');
    var CSRFManager = require('./framework/core/api_utils/csrf.js');

    // SSL related configuration bootstrap
    var httpServer = null;
    var secureHttpServer = null;

    var httpsConfigured = false;

    var sslOptions = null;

    var apiServer = argv['api-server'] ? argv['api-server'] : 'localhost';
    var apiServerProtocol = argv['api-server-protocol'] ? argv['api-server-protocol'] : 'https';
    var uploadServer = argv['upload-server'] ? argv['upload-server'] : null;
    var devDownloadServer = argv['dev-download-server'] ? argv['dev-download-server'] : null;

    var launchpadAddress = argv['launchpad-address'] ? argv['launchpad-address'] : constants.LAUNCHPAD_ADDRESS;
    var idpServerPortNumber = argv['idp-port-number'] ? argv['idp-port-number'] : constants.IDP_PORT_NUMBER;
    var idpServerProtocol = argv['idp-server-protocol'] ? argv['idp-server-protocol'] : constants.IDP_SERVER_PROTOCOL;
    var callbackServerProtocol = argv['callback-server-protocol'] ? argv['callback-server-protocol'] : constants.CALLBACK_SERVER_PROTOCOL;
    var callbackPortNumber = argv['callback-port-number'] ? argv['callback-port-number'] : constants.CALLBACK_PORT_NUMBER;
    var callbackAddress = argv['callback-address'] ? argv['callback-address'] : constants.CALLBACK_ADDRESS;

    var devServerAddress = argv['dev-server-address'] ? argv['dev-server-address'] : null;

    try {
        if (argv['enable-https']) {
            var keyFilePath = argv['keyfile-path'];
            var certFilePath = argv['certfile-path'];

            sslOptions = {
                key: fs.readFileSync(keyFilePath),
                cert: fs.readFileSync(certFilePath)
            };

            httpsConfigured = true;
        }
    } catch (e) {
        console.log('HTTPS enabled but file paths missing/incorrect');
        process.exit(code = -1);
    }

    var app = express();

    app.set('views', __dirname + '/framework/core/views');
    app.engine('html', require('ejs').renderFile);
    app.set('view engine', 'ejs');

    app.use(session({
      secret: 'riftio rocks',
      resave: false,
      saveUninitialized: true
    }));
    // clickjack attach suppression
    app.use(lusca.xframe('SAMEORIGIN')); // for older browsers
    app.use(lusca.csp({ policy: { 'frame-ancestors': '\'none\'' }}));

    app.use(bodyParser.json());
    app.use(cors());
    app.use(bodyParser.urlencoded({
        extended: true
    }));

    var csrfTarget = (devServerAddress ? devServerAddress : launchpadAddress)

    var csrfConfig = {
        target: csrfTarget
    }

    CSRFManager.configure(csrfConfig);

    var openidConfig = {
        idpServerProtocol: idpServerProtocol,
        idpServerAddress: launchpadAddress,
        idpServerPortNumber: idpServerPortNumber,
        callbackServerProtocol: callbackServerProtocol,
        callbackAddress: callbackAddress,
        callbackPortNumber: callbackPortNumber
    }

    var authManager = new AuthorizationManager(openidConfig);
    var authConfig = {
        app: app
    };


    var socketManager = new Sockets();
    var socketConfig = {
        httpsConfigured: httpsConfigured
    };

    if (httpsConfigured) {
        socketConfig.sslOptions = sslOptions;
    };

    var sessionsConfig = {
        authManager: authManager,
        api_server: apiServer,
        api_server_protocol: apiServerProtocol
    }

    // Rift framework imports
    var constants = require('./framework/core/api_utils/constants');
    var skyquakeEmitter = require('./framework/core/modules/skyquakeEmitter');
    var auth_routes = require('./framework/core/modules/routes/auth');
    var navigation_routes = require('./framework/core/modules/routes/navigation');
    var socket_routes = require('./framework/core/modules/routes/sockets');
    var restconf_routes = require('./framework/core/modules/routes/restconf');
    var inactivity_routes = require('./framework/core/modules/routes/inactivity');
    var descriptor_routes = require('./framework/core/modules/routes/descriptorModel');
    var configuration_routes = require('./framework/core/modules/routes/configuration');
    var configurationAPI = require('./framework/core/modules/api/configuration');
    var userManagement_routes = require('./framework/core/modules/routes/userManagement');
    var projectManagement_routes = require('./framework/core/modules/routes/projectManagement');
    var session_routes = require('./framework/core/modules/routes/sessions');
    var schemaAPI = require('./framework/core/modules/api/schemaAPI');
    var modelAPI = require('./framework/core/modules/api/modelAPI');
    var appConfigAPI = require('./framework/core/modules/api/appConfigAPI');

    schemaAPI.init();
    modelAPI.init();
    appConfigAPI.init();
    /**
     * Processing when a plugin is added or modified
     * @param {string} plugin_name - Name of the plugin
     */
    function onPluginAdded(plugin_name) {
        // Load plugin config
        var plugin_config = reload('./plugins/' + plugin_name + '/config.json');

        // Load all app's views
        app.use('/' + plugin_name, express.static('./plugins/' + plugin_name + '/' + plugin_config.root));

        // Load all app's routes
        app.use('/' + plugin_name, require('./plugins/' + plugin_name + '/routes'));

        // Publish navigation links
        if (plugin_config.routes && _.isArray(plugin_config.routes)) {
            skyquakeEmitter.emit('config_discoverer.navigation_discovered', plugin_name, plugin_config);
        }

    }

    /**
     * Serve jquery
     */
    app.use('/jquery', express.static('./node_modules/jquery/dist/jquery.min.js'));
    /**
     * Serve images
     */
    app.use('/img', express.static('./framework/style/img'));

    /**
     * Start listening on a port
     * @param {string} port - Port to listen on
     * @param {object} httpServer - httpServer created with http(s).createServer
     */
    function startListening(port, httpServer) {
        var server = httpServer.listen(port, function () {
            var host = server.address().address;

            var port = server.address().port;

            console.log('Express server listening on port', port);
        });
        return server;
    }

    /**
     * Initialize skyquake
     */
    function init() {
        skyquakeEmitter.on('plugin_discoverer.plugin_discovered', onPluginAdded);
        skyquakeEmitter.on('plugin_discoverer.plugin_updated', onPluginAdded);
    }

    /**
     * Configure skyquake
     */
    function config() {
        // Conigure any globals
        process.env.NODE_TLS_REJECT_UNAUTHORIZED=0;

        // Configure auth manager
        authManager.configure(authConfig);

        // Configure auth router
        auth_routes.routes(authManager);
        app.use(auth_routes.router);

        //Configure session route(s)
        session_routes.routes(sessionsConfig);
        app.use(session_routes.router);

        // Configure navigation router
        app.use(navigation_routes);

        // Configure restconf router
        app.use(restconf_routes);

        //Configure inactivity route(s)
        app.use(inactivity_routes);

        // Configure global config with ssl enabled/disabled
        var globalConfig = {
            ssl_enabled: httpsConfigured,
            api_server: apiServer,
            api_server_protocol: apiServerProtocol,
            api_server_port_number: constants.LAUNCHPAD_PORT,
            idp_server_address: launchpadAddress,
            idp_server_protocol: idpServerProtocol,
            idp_server_port_number: idpServerPortNumber,
            csrf_target: csrfTarget
        };

        if (uploadServer) {
            globalConfig.upload_server = uploadServer;
        }
        if (devDownloadServer) {
            globalConfig.dev_download_server = devDownloadServer;
        }

        configurationAPI.globalConfiguration.update(globalConfig);

        // Configure configuration route(s)
        app.use(configuration_routes);

        // Configure schema api
        app.use(schemaAPI.getRouter());

        // Configure model api
        app.use(modelAPI.getRouter());

        // Configure config api
        app.use(appConfigAPI.getRouter());

        //Configure descriptor route(s)
        app.use(descriptor_routes);

        //Configure user management route(s)
        app.use(userManagement_routes);

        //Configure project management route(s)
        app.use(projectManagement_routes);

        // app.get('/testme', function(req, res) {
        //  res.sendFile(__dirname + '/index.html');
        // });

        // Configure HTTP/HTTPS server and populate socketConfig.
        if (httpsConfigured) {
            console.log('HTTPS configured. Will create 2 servers');
            secureHttpServer = https.createServer(sslOptions, app);
            // Add redirection on SERVER_PORT
            httpServer = http.createServer(function(req, res) {
                var host = req.headers['host'];
                host = host.replace(/:\d+$/, ":" + constants.SECURE_SERVER_PORT);

                res.writeHead(301, { "Location": "https://" + host + req.url });
                res.end();
            });

            socketConfig.httpServer = secureHttpServer;
        } else {
            httpServer = http.createServer(app);
            socketConfig.httpServer = httpServer;
        }

        // Configure socket manager
        socketManager.configure(socketConfig);

        // Configure socket router
        socket_routes.routes(socketManager);
        app.use(socket_routes.router);

        // Serve multiplex-client
        app.get('/multiplex-client', function(req, res) {
            res.sendFile(__dirname + '/node_modules/websocket-multiplex/multiplex_client.js');
        });

        // handle requests for gzip'd files
        app.get('*gzip*', function (req, res, next) {
            res.set('Content-Encoding', 'gzip');
            next();
        });

    }

    /**
     * Run skyquake functionality
     */
    function run() {

        // Start plugin_discoverer
        var navigation_manager = require('./framework/core/modules/navigation_manager');
        var plugin_discoverer = require('./framework/core/modules/plugin_discoverer');

        // Initialize asynchronous modules
        navigation_manager.init();
        plugin_discoverer.init();

        // Configure asynchronous modules
        navigation_manager.config()
        plugin_discoverer.config({
            plugins_path: './plugins'
        });

        // Run asynchronous modules
        navigation_manager.run();
        plugin_discoverer.run();


        // Server start
        if (httpsConfigured) {
            console.log('HTTPS configured. Will start 2 servers');
            // Start listening on SECURE_SERVER_PORT (8443)
            var secureServer = startListening(constants.SECURE_SERVER_PORT, secureHttpServer);
        }
        // Start listening on SERVER_PORT (8000)
        var server = startListening(constants.SERVER_PORT, httpServer);

    }

    init();

    config();

    run();
}
