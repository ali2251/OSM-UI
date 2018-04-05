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
import rw from 'utils/rw'
import modelActions from './modelActions'
import Utils from 'utils/utils'
import $ from 'jquery';

const source = {
    loadModel: function () {
        return {
            remote: function (state, path) {
                return new Promise(function (resolve, reject) {
                    $.ajax({
                        url: '/model?path=' + path,
                        type: 'GET',
                        success: function (result) {
                            resolve(result);
                        },
                        error: function (xhr, errorType, errorMessage) {
                            console.log("There was an error updating the model: ", errorType, errorMessage, xhr);
                            reject({response: xhr.responseJSON, errorType, errorMessage});
                        }
                    });
                })
            },
            success: modelActions.processRequestSuccess,
            loading: modelActions.processRequestInitiated,
            error: modelActions.processRequestFailure
        }
    },
    updateModel: function () {
        return {
            remote: function (state, path, data) {
                const url = path.reduce((url, node) => {
                    url += node[0] !== '[' ? '/' : '';
                    return url + node
                }, `/model?path=/${state.path}`);                
                return new Promise(function (resolve, reject) {
                    $.ajax({
                        url: url,
                        type: 'PATCH',
                        data: data,
                        success: function (result) {
                            resolve(result);
                        },
                        error: function (xhr, errorType, errorMessage) {
                            console.log("There was an error updating the model: ", errorType, errorMessage, xhr);
                            reject({response: xhr.responseJSON, errorType, errorMessage});
                        }
                    });
                })
            },
            success: modelActions.processRequestSuccess,
            loading: modelActions.processRequestInitiated,
            error: modelActions.processRequestFailure
        }
    },
    createModel: function () {
        return {
            remote: function (state, path, data) {
                const url = path.reduce((url, node) => {
                    url += node[0] !== '[' ? '/' : '';
                    return url + node
                }, `/model?path=/${state.path}`);                
                return new Promise(function (resolve, reject) {
                    $.ajax({
                        url: url,
                        type: 'PUT',
                        data: data,
                        success: function (result) {
                            resolve(result);
                        },
                        error: function (xhr, errorType, errorMessage) {
                            console.log("There was an error updating the model: ", errorType, errorMessage, xhr);
                            reject({response: xhr.responseJSON, errorType, errorMessage});
                        }
                    });
                })
            },
            success: modelActions.processRequestSuccess,
            loading: modelActions.processRequestInitiated,
            error: modelActions.processRequestFailure
        }
    },

    deleteModel: function () {
        return {
            remote: function (state, path) {
                const url = path.reduce((url, node) => {
                    url += node[0] !== '[' ? '/' : '';
                    return url + node
                }, `/model?path=/${state.path}`);                
                return new Promise(function (resolve, reject) {
                    $.ajax({
                        url: url,
                        type: 'DELETE',
                        success: function (result) {
                            resolve(result);
                        },
                        error: function (xhr, errorType, errorMessage) {
                            console.log("There was an error updating the model: ", errorType, errorMessage, xhr);
                            reject({response: xhr.responseJSON, errorType, errorMessage});
                        }
                    });
                })
            },
            success: modelActions.processRequestSuccess,
            loading: modelActions.processRequestInitiated,
            error: modelActions.processRequestFailure
        }
    }
}
module.exports = source;