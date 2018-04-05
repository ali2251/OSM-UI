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
import schemaActions from './schemaActions'
import Utils from 'utils/utils'
import $ from 'jquery';
import StoreCache from '../SourceCache'

const storeCache = new StoreCache('schema');
storeCache.init(); // get the ball rolling

function getCachedSchema(request) {
    const cachedSchema = {};
    const requestSchema = [];
    request.forEach((path) => {
        let schema = storeCache.get(path);
        if (schema) {
            cachedSchema[path] = schema
        } else {
            requestSchema.push(path);
        }
    });
    return {
        cachedSchema,
        requestSchema
    };
}

const schemaSource = {
    loadSchema: function () {
        return {
            local: function (state, request) {
                request = Array.isArray(request) ? request : [request];
                const results = getCachedSchema(request);
                if (!results.requestSchema.length) {
                    return(Promise.resolve(results.cachedSchema));
                }
            }, 

            remote: function (state, request) {
                return new Promise(function (resolve, reject) {
                    storeCache.init().then(() => {
                        request = Array.isArray(request) ? request : [request];
                        const results = getCachedSchema(request);
                        if (!results.requestSchema.length) {
                            resolve({
                                schema: results.cachedSchema
                            });
                        } else {
                            $.ajax({
                                url: '/schema?request=' + results.requestSchema.join(','),
                                type: 'GET',
                                success: function ({
                                    schema
                                }) {
                                    for (let path in schema) {
                                        storeCache.set(path, schema[path]);
                                    }
                                    resolve(getCachedSchema(request).cachedSchema);
                                },
                                error: function (error) {
                                    console.log("There was an error getting the schema: ", error);
                                    reject(error);
                                }
                            }).fail(function (xhr) {
                                console.log("There was an error getting the schema: ", xhr);
                                Utils.checkAuthentication(xhr.status);
                                reject("There was an error getting the schema.")
                            });
                        }
                    })
                })
            },
            success: schemaActions.loadSchemaSuccess,
            loading: schemaActions.loadSchemaLoading,
            error: schemaActions.loadSchemaFail
        }
    },
}
export default schemaSource;