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
import $ from 'jquery';

const configPromise = new Promise((resolve, reject) => {
    $.ajax({
        url: '/app-config',
        type: 'GET',
        success: function (data) {
            if (data.version.endsWith('.1')){
                data.version = '' + Date.now();
            }
            resolve(data);
        },
        error: function (error) {
            console.log("There was an error getting config: ", error);
            reject(error);
        }
    }).fail(function (xhr) {
        console.log('There was an xhr error getting the config', xhr);
        reject(xhr);
    });
});

module.exports = {
    get: () => configPromise
};