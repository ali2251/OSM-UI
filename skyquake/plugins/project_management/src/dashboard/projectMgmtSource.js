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

        getUsers: {
          remote: function() {
              return new Promise(function(resolve, reject) {
                $.ajax({
                  url: `/user?api_server=${API_SERVER}`,
                  type: 'GET',
                  beforeSend: Utils.addAuthorizationStub,
                  success: function(data, textStatus, jqXHR) {
                    resolve(data.user);
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
            'error': 'There was an error retrieving the resource orchestrator information.'
          }),
          success: Alt.actions.global.getUsersSuccess,
          loading: Alt.actions.global.showScreenLoader,
          error: Alt.actions.global.handleServerReportedError
        },
        getProjects: {
          remote: function() {
              return new Promise(function(resolve, reject) {
                $.ajax({
                  url: `/project?api_server=${API_SERVER}`,
                  type: 'GET',
                  beforeSend: Utils.addAuthorizationStub,
                  success: function(data, textStatus, jqXHR) {
                    resolve(data.project);
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
            'error': 'There was an error retrieving the resource orchestrator information.'
          }),
          success: Alt.actions.global.getProjectsSuccess,
          loading: Alt.actions.global.showScreenLoader,
          error: Alt.actions.global.handleServerReportedError
        },
        updateProject: {
          remote: function(state, project) {
            return new Promise(function(resolve, reject) {
              $.ajax({
                  url: `/project?api_server=${API_SERVER}`,
                  type: 'PUT',
                  data: project,
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
            'error': 'There was an error updating the project.'
          }),
          success: Alt.actions.global.updateProjectSuccess,
          loading: Alt.actions.global.showScreenLoader,
          error: Alt.actions.global.handleServerReportedError
        },
        deleteProject: {
          remote: function(state, project) {
            return new Promise(function(resolve, reject) {
              $.ajax({
                url: `/project/${encodeURIComponent(project['name'])}?api_server=${API_SERVER}`,
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
            'error': 'There was an error deleting the user.'
          }),
          success: Alt.actions.global.deleteProjectSuccess,
          loading: Alt.actions.global.showScreenLoader,
          error: Alt.actions.global.handleServerReportedError
        },
        createProject: {
            remote: function(state, project) {

              return new Promise(function(resolve, reject) {
                $.ajax({
                  url: `/project?api_server=${API_SERVER}`,
                  type: 'POST',
                  data: project,
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
              'error': 'There was an error updating the account.'
            }),
            success: Alt.actions.global.createProjectSuccess,
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

