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
import appConfiguration from '../utils/appConfiguration'

let versionKeyPrefix = null;

const localCache = new class {
    get(key) {
        let valueAsString = localStorage.getItem(key);
        return valueAsString ? JSON.parse(valueAsString) : undefined;
    }
    set(key, val) {
        localStorage.setItem(key, typeof val === 'string' ? val : JSON.stringify(val));
    }
}();

let objCache = new Map();

const storeCache = new class {
    get(key) {
        if (objCache[key]) {
            objCache[key].timerId && clearTimeout(objCache[key].timerId)
            objCache[key].timerId = setTimeout((key) => delete objCache[key], 2000)
            return objCache[key].value;
        } 
        const obj = localCache.get(key);
        if (obj) {
            objCache[key] = {
                value: obj,
                timerId: setTimeout((key) => delete objCache[key], 2000)
            }
            return obj;
        }
    }
    set(key, obj) {
        setTimeout(localCache.set, 100, key, obj);
        objCache[key] = {
            value: obj,
            timerId: setTimeout((key) => delete objCache[key], 2000)
        }
    }
    init(version) {
        versionKeyPrefix = 's-v-' + version;
        const currentStoreVersion = localStorage.getItem('store-version');
        if (currentStoreVersion !== version) {
            let removeItems = [];
            for (let i = 0; i < localStorage.length; ++i) {
                let key = localStorage.key(i);
                if (key.startsWith('s-v-')) {
                    removeItems.push(key);
                }
            }
            removeItems.forEach((key) => localStorage.removeItem(key));
            localStorage.setItem('store-version', version);
        }
    }
}();

class StoreCache {
    constructor(name) {
        this.name = 's-v-' + name;
    }
    get(key) {
        return storeCache.get(this.name + key);
    }
    set(key, obj) {
        storeCache.set(this.name + key, obj);
    }
    init() {
        return versionKeyPrefix ? Promise.resolve() : new Promise(
            (resolve, reject) => {
                appConfiguration.get().then((config) => {
                    storeCache.init(config.version);
                    resolve();
                })
            }
        )
    }
}

module.exports = StoreCache;