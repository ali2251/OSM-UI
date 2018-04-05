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

import Alt from 'widgets/skyquake_container/skyquakeAltInstance';

const NSD_SCHEMA_PATH = 'nsd-catalog/nsd';
const VNFD_SCHEMA_PATH = 'vnfd-catalog/vnfd';

import {
    modelActions
} from 'source/model'

class AdminStore {
    constructor() {
        this.adminActions = this.alt.generateActions(
            'openModel'
        );
        this.state = {
            modelList: [
                'openidc-provider-config'
            ]
        }
        this.bindActions(modelActions);
        
    }

    get actions() {
        return this.adminActions
    }
    processRequestFailure(result){
        console.debug('processRequestFailure');
        Alt.actions.global.showNotification.defer(result.response.error.message);
    }
    processRequestSuccess(data){
        console.debug('processRequestSuccess');
    }
    processRequestInitiated(data){
        console.debug('processRequestInitiated');
    }
}

export default AdminStore