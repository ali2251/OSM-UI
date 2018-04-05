/*
 * STANDARD_RIFT_IO_COPYRIGHT
 */
import $ from 'jquery';
var Utils = require('utils/utils.js');
let API_SERVER = require('utils/rw.js').getSearchParams(window.location).api_server;
let HOST = API_SERVER;
let NODE_PORT = require('utils/rw.js').getSearchParams(window.location).api_port || ((window.location.protocol == 'https:') ? 8443 : 8000);
let DEV_MODE = require('utils/rw.js').getSearchParams(window.location).dev_mode || false;

if (DEV_MODE) {
    HOST = window.location.protocol + '//' + window.location.hostname;
}



module.exports = function(Alt) {
    return {

        getRedundancy: {
          remote: function() {
              return new Promise(function(resolve, reject) {
                $.ajax({
                  url: `config?api_server=${API_SERVER}`,
                  type: 'GET',
                  beforeSend: Utils.addAuthorizationStub,
                  success: function(data, textStatus, jqXHR) {
                    resolve(data);
                  }
                }).fail(function(xhr){
                  //Authentication and the handling of fail states should be wrapped up into a connection class.
                  Utils.checkAuthentication(xhr.status);
                  let msg = xhr.responseText;
                  if(xhr.errorMessage) {
                    msg = xhr.errorMessage
                  }
                  reject(msg);
                });
              });
          },
          interceptResponse: interceptResponse({
            'error': 'There was an error retrieving the redundancy config.'
          }),
          success: Alt.actions.global.getRedundancySuccess,
          loading: Alt.actions.global.showScreenLoader,
          error: Alt.actions.global.handleServerReportedError
        },
        openRedundancyStateSocket: {
          remote: function(state) {
            return new Promise(function(resolve, reject) {
              //If socket connection already exists, eat the request.
              if(state.socket) {
                console.log('connection already exists')
                return resolve(false);
              }
               $.ajax({
                url: '/socket-polling',
                type: 'POST',
                beforeSend: Utils.addAuthorizationStub,
                data: {
                    url: 'redundancy/state?api_server=' + API_SERVER
                },
                success: function(data, textStatus, jqXHR) {
                  Utils.checkAndResolveSocketRequest(data, resolve, reject);
                }
              }).fail(function(xhr){
                //Authentication and the handling of fail states should be wrapped up into a connection class.
                Utils.checkAuthentication(xhr.status);
                reject(xhr.responseText || 'An error occurred. Check your logs for more information');
              });;
            });
          },
          loading: Alt.actions.global.showScreenLoader,
          success: Alt.actions.global.openRedundancyStateSocketSuccess
        },
        getSites: {
          remote: function() {
              return new Promise(function(resolve, reject) {
                $.ajax({
                  url: `site?api_server=${API_SERVER}`,
                  type: 'GET',
                  beforeSend: Utils.addAuthorizationStub,
                  success: function(data, textStatus, jqXHR) {
                    resolve(data.site);
                  }
                }).fail(function(xhr){
                  //Authentication and the handling of fail states should be wrapped up into a connection class.
                  Utils.checkAuthentication(xhr.status);
                  let msg = xhr.responseText;
                  if(xhr.errorMessage) {
                    msg = xhr.errorMessage
                  }
                  reject(msg);
                });
              });
          },
          interceptResponse: interceptResponse({
            'error': 'There was an error retrieving the redundancy sites.'
          }),
          success: Alt.actions.global.getSitesSuccess,
          loading: Alt.actions.global.showScreenLoader,
          error: Alt.actions.global.handleServerReportedError
        },
        updateConfig: {
          remote: function(state, site) {
            return new Promise(function(resolve, reject) {
              $.ajax({
                  url: `config?api_server=${API_SERVER}`,
                  type: 'PUT',
                  data: site,
                  beforeSend: Utils.addAuthorizationStub,
                  success: function(data, textStatus, jqXHR) {
                    resolve(data);
                  }
                }).fail(function(xhr){
                  //Authentication and the handling of fail states should be wrapped up into a connection class.
                  Utils.checkAuthentication(xhr.status);
                  let msg = xhr.responseText;
                  if(xhr.errorMessage) {
                    msg = xhr.errorMessage
                  }
                  reject(msg);
                });
            });
          },
          interceptResponse: interceptResponse({
            'error': 'There was an error updating the redundancy config.'
          }),
          success: Alt.actions.global.updateConfigSuccess,
          loading: Alt.actions.global.showScreenLoader,
          error: Alt.actions.global.handleServerReportedError
        },
        updateSite: {
          remote: function(state, site) {
            let data = site;
            data['rw-instances'].map(function(s) {
              if(s.hasOwnProperty('isNew')) {
                delete s.isNew;
              }
            })
            return new Promise(function(resolve, reject) {
              $.ajax({
                  url: `site/${encodeURIComponent(site['site-name'])}?api_server=${API_SERVER}`,
                  type: 'PUT',
                  data: data,
                  beforeSend: Utils.addAuthorizationStub,
                  success: function(data, textStatus, jqXHR) {
                    resolve(data);
                  }
                }).fail(function(xhr){
                  //Authentication and the handling of fail states should be wrapped up into a connection class.
                  Utils.checkAuthentication(xhr.status);
                  let msg = xhr.responseText;
                  if(xhr.errorMessage) {
                    msg = xhr.errorMessage
                  }
                  reject(msg);
                });
            });
          },
          interceptResponse: interceptResponse({
            'error': 'There was an error updating the site.'
          }),
          success: Alt.actions.global.updateSiteSuccess,
          loading: Alt.actions.global.showScreenLoader,
          error: Alt.actions.global.handleServerReportedError
        },
        deleteSite: {
          remote: function(state, site) {
            return new Promise(function(resolve, reject) {
              $.ajax({
                url: `site/${encodeURIComponent(site['site-name'])}?api_server=${API_SERVER}`,
                type: 'DELETE',
                beforeSend: Utils.addAuthorizationStub,
                success: function(data, textStatus, jqXHR) {
                  resolve(data);
                }
              }).fail(function(xhr){
                //Authentication and the handling of fail states should be wrapped up into a connection class.
                Utils.checkAuthentication(xhr.status);
                let msg = xhr.responseText;
                if(xhr.errorMessage) {
                  msg = xhr.errorMessage
                }
                reject(msg);
              });
            });
          },
          interceptResponse: interceptResponse({
            'error': 'There was an error deleting the site.'
          }),
          success: Alt.actions.global.deleteSiteSuccess,
          loading: Alt.actions.global.showScreenLoader,
          error: Alt.actions.global.handleServerReportedError
        },
        createSite: {
            remote: function(state, site) {
              let data = site;
              data['rw-instances'].map(function(s) {
                if(s.hasOwnProperty('isNew')) {
                  delete s.isNew;
                }
              })
              return new Promise(function(resolve, reject) {
                $.ajax({
                  url: `site?api_server=${API_SERVER}`,
                  type: 'POST',
                  data: data,
                  beforeSend: Utils.addAuthorizationStub,
                  success: function(data, textStatus, jqXHR) {
                    resolve(data);
                  }
                }).fail(function(xhr){
                  //Authentication and the handling of fail states should be wrapped up into a connection class.
                  Utils.checkAuthentication(xhr.status);
                  let msg = xhr.responseText;
                  if(xhr.errorMessage) {
                    msg = xhr.errorMessage
                  }
                  reject(msg);
                });
              });
            },
            interceptResponse: interceptResponse({
              'error': 'There was an error creating the site.'
            }),
            success: Alt.actions.global.createSiteSuccess,
            loading: Alt.actions.global.showScreenLoader,
            error: Alt.actions.global.handleServerReportedError
        }
      }
}

function interceptResponse (responses) {
  return function(data, action, args) {
    if(responses.hasOwnProperty(data)) {
      return {
        type: data,
        msg: responses[data]
      }
    } else {
      return data;
    }
  }
}

