
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
import $ from 'jquery';
let Utils = require('utils/utils.js');
let rw = require('utils/rw.js');
const API_SERVER = require('utils/rw.js').getSearchParams(window.location).api_server;
const API_PORT = require('utils/rw.js').getSearchParams(window.location).api_port;
export default function(Alt){
  const Actions = Alt.actions.global;
  return {
  getCatalog: {
      remote (state) {
        return new Promise((resolve,reject) => {
          $.ajax({
            url: 'api/decorated-catalog?api_server=' + API_SERVER,
            type: 'GET',
            beforeSend: Utils.addAuthorizationStub,
            success: function (data) {
              resolve(
                      typeof(data) == "string" ? JSON.parse(data):data
                      );
            }
          }).fail(function(xhr){
            console.log(xhr)
            //Authentication and the handling of fail states should be wrapped up into a connection class.
            Utils.checkAuthentication(xhr.status);
          });
        });
      },
      success: Alt.actions.global.getCatalogSuccess,
      error: Alt.actions.global.getCatalogError
  },
  getDataCenters:{
      remote () {
        return new Promise((resolve, reject) => {
          $.ajax({
            url: 'api/data-centers?api_server=' +
              API_SERVER,
              type: 'GET',
              beforeSend: Utils.addAuthorizationStub,
              success: function (data) {
                resolve(data);
              }
          })
        })
      },
      success: Alt.actions.global.getDataCentersSuccess,
      error: Alt.actions.global.getDataCentersError
  },
  getVDU: {
      remote (state, VNFDid) {
        return new Promise((resolve,reject) => {
          $.ajax({
            url: 'api/vnfd?api_server=' + API_SERVER,
            type: 'POST',
            beforeSend: Utils.addAuthorizationStub,
            dataType:'json',
            data: {
              data: VNFDid
            },
            success: function (data) {
              resolve(
                typeof(data) == "string" ? JSON.parse(data):data
              );
            }
          })
        });
      },
      success: Alt.actions.global.getVDUSuccess,
      error: Alt.actions.global.getVDUError
  },
  launchNSR: {
      remote (state, NSR) {
        return new Promise((resolve, reject) => {
          console.log('Attempting to instantiate NSR:', NSR)
          $.ajax({
            url: 'api/nsr?api_server=' + API_SERVER,
            type: 'POST',
            beforeSend: Utils.addAuthorizationStub,
            dataType:'json',
            data: {
              data: NSR
            },
            success: function (data) {
              resolve(
                      typeof(data) == "string" ? JSON.parse(data):data
                      );
            },
            error: function (err) {
              console.log('There was an error launching')
            }
          }).fail(function(xhr){
            //Authentication and the handling of fail states should be wrapped up into a connection class.
            Utils.checkAuthentication(xhr.status);
            reject(xhr.responseText || 'An error occurred. Check your logs for more information');
          });
        })
      },
      loading: Alt.actions.global.launchNSRLoading,
      success: Alt.actions.global.launchNSRSuccess,
      error: Alt.actions.global.launchNSRError
  },
  getSshKey: {
      remote (state) {
        return new Promise((resolve,reject) => {
          $.ajax({
            url: 'api/ssh-key?api_server=' + API_SERVER,
            type: 'GET',
            beforeSend: Utils.addAuthorizationStub,
            success: function (data) {
              resolve(data);
            }
          }).fail(function(xhr){
            console.log(xhr)
            //Authentication and the handling of fail states should be wrapped up into a connection class.
            Utils.checkAuthentication(xhr.status);
          });
        });
      },
      loading: Actions.getInstantiateSshKeyLoading,
      success: Actions.getInstantiateSshKeySuccess,
      error: Actions.getInstantiateSshKeyError
  },
  getSshKeys:{
      remote(state) {
        return new Promise((resolve, reject) => {
          $.ajax({
            url: 'api/nsd/' + encodeURIComponent(NSDId) + '/input-param?api_server=' + API_SERVER,
            type: 'GET',
              beforeSend: Utils.addAuthorizationStub,
              success: function (data) {
                resolve(data);
              }
          });
        });
      }
  },
  getConfigAgent:{
      remote (state, cb) {
        return new Promise((resolve, reject) => {
          $.ajax({
            url: 'api/config-agent-account?api_server=' +
              API_SERVER,
              type: 'GET',
              beforeSend: Utils.addAuthorizationStub,
              success: function (data) {
                resolve(data);
                if(cb) {
                  cb();
                }
              }
          })
        })
      },
      success: Alt.actions.global.getConfigAgentSuccess,
      error: Alt.actions.global.getConfigAgentError
  },
  getResourceOrchestratorAccounts: {
          remote: function(state, cb) {
              return new Promise(function(resolve, reject) {
                $.ajax({
                  url: 'api/ro-account' + '?api_server=' + API_SERVER,
                  type: 'GET',
                  beforeSend: Utils.addAuthorizationStub,
                  contentType: "application/json",
                  success: function(data) {
                    if(cb) {
                      cb();
                    }
                    resolve(data);
                  },
                  error: function(error) {
                    console.log("There was an error updating the account: ", arguments);

                  }
                }).fail(function(xhr){
                  //Authentication and the handling of fail states should be wrapped up into a connection class.
                  Utils.checkAuthentication(xhr.status);
                  return reject('error');
                });
              });
          },
          interceptResponse: interceptResponse({
            'error': 'There was an error retrieving the resource orchestrator information.'
          }),
          success: Alt.actions.global.getResourceOrchestratorAccountsSuccess,
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
