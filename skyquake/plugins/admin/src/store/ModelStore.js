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
import yang from '../yang/leaf-utils';

import {
    schemaActions,
    schemaSource
} from 'source/schema'
import {
    modelActions,
    modelSource
} from 'source/model'
import adminActions from '../adminActions'

function pullOutWantedProperty(path, result) {
    if (!result) {
        return null;
    }
    const nodes = path.split('/');
    if (nodes[0] === 'project') {
        nodes.shift(); // get rid of top level as it was not sent back
        result = nodes.reduce((data, node) => data[node], result);
    }
    return result;
}

function findItemIndex(list, key, keyValue) {
    const keyPath = Array.isArray(keyValue) ? keyValue : key.length > 1 ? JSON.parse(keyValue) : [keyValue];
    if (key.length > 1) {
        return list.findIndex(item => {
            return key.every((k, i) => item[k] === keyPath[i]);
        });
    } else {
        const leaf = key[0];
        const match = keyPath[0];
        return list.findIndex(item => {
            return item[leaf] === match;
        });
    }
}

function getItemFromList(list, key, keyValue) {
    return list[findItemIndex(list, key, keyValue)];
}

function getElement(path, store) {
    return path.reduce((parent, node, index) => {
        const element = Object.assign({}, parent);
        if (parent.type === 'list') {
            element.type = 'list-entry'
            element.value = getItemFromList(parent.value, parent.schema.key, node);
        } else {
            element.schema = parent.schema.properties.find(property => property.name === node)
            element.type = element.schema.type;
            element.value = (parent.value && parent.value[node]) || (parent.value[node] = {});
        }
        return element;
    }, {
        value: store.data,
        schema: store.schema[store.path],
        type: store.schema[store.path].type
    });
}

function massageData(data, schema){
    return Object.keys(data).reduce((o, name) => {
        let input = data[name];
        let output = null;
        if (yang.isLeafEmpty(input.property)) {
            output = {type: 'leaf_empty', data: input.value.length ? 'set' : ''}
        } else if (yang.isLeafList(input.property)) {
            const newList = Array.isArray(input.value) ? input.value : input.value.split(',');
            const oldList = input.currentValue ? (Array.isArray(input.currentValue) ? input.currentValue : input.currentValue.split(',')) : [];
            const addList = newList.reduce((list, v) => {
                v = v.trim();
                if (v) {
                    const i = oldList.indexOf(v);
                    if (i === -1) {
                        list.push(v);
                    } else {
                        oldList.splice(i, 1);
                    }
                }
                return list;
            }, [])
            output = {type: 'leaf_list', data: {}};
            addList.length && (output.data.add = addList);
            oldList.length && (output.data.remove = oldList);
        } else {
            output = input.value;
        }
        o[name] = output;
        return o
    }, {})
}

class ModelStore {
    constructor(path) {
        this.state = {
            path,
            isLoading: false
        };
        this.bindActions(adminActions);
        this.registerAsync(modelSource);
        this.bindActions(modelActions);
        this.registerAsync(schemaSource);
        this.bindActions(schemaActions);
        this.exportPublicMethods({
            get: this.get,
            update: this.update,
            create: this.create,
            'delete': this.remove
        })
    }

    get = () => {
        Promise.all([
            new Promise((resolve, reject) => {
                this.getInstance().loadSchema(this.state.path)
                    .then(result => resolve(result))
                    .catch(error => reject(error))
            }),
            new Promise((resolve, reject) => {
                const result = this.getInstance().loadModel(this.state.path)
                    .then(result => resolve(pullOutWantedProperty(this.state.path, result)))
                    .catch(error => reject(error))
            })
        ]).then((results) => {
            this.setState({
                isLoading: false,
                path: this.state.path,
                schema: results[0][this.state.path],
                data: results[1] || {}
            });
        }).catch((errors) => {
            this.setState({
                isLoading: false,
                error: {
                    get: errors
                }
            })
        })
        this.setState({
            isLoading: true,
            path: this.state.path
        })
    }
    update = (path, obj) => {
        const e = getElement(path, this.state);
        obj = massageData(obj, e.schema);
        this.getInstance().updateModel(path, obj)
            .then((response) => {
                const errors = [];
                const target = getElement(path, this.state);
                for (const name in response.result) {
                    if (response.result[name].success) {
                        target.value[name] = response.result[name].value
                    } else {
                        errors.push(response.result[name]);
                    }
                }
                this.setState({
                    updatingPath: null,
                    data: this.state.data
                });
                errors && this.setState({
                    error: {
                        update: errors
                    }
                });
            }).catch((errors) => {
                this.setState({
                    updatingPath: null,
                    error: {
                        update: errors
                    }
                })
            })
        this.setState({
            updatingPath: path,
        })
    }

    create = (path, obj) => {
        const e = getElement(path, this.state);
        obj = massageData(obj, e.schema);
        this.getInstance().createModel(path, obj)
            .then((response) => {
                const createList = () => {
                    const parentPath = path.slice();
                    const name = parentPath.pop();
                    const list = [];
                    const parent = getElement(parentPath, this.state)
                    if (parent.value) parent.value[name] = [];
                    return parent.value[name];
                }
                const errors = [];
                const target = getElement(path, this.state);
                const list = target.value || createList();
                list.unshift(response.data);
                this.setState({
                    updatingPath: null,
                    data: this.state.data
                });
                errors && this.setState({
                    error: {
                        update: errors
                    }
                });
            }).catch((errors) => {
                this.setState({
                    updatingPath: null,
                    error: {
                        update: errors
                    }
                })
            })
        this.setState({
            updatingPath: path,
        })
    }

    remove = (path, obj) => {
        this.getInstance().deleteModel(path)
            .then((response) => {
                path = path.slice();
                const id = path.pop();
                const list = getElement(path, this.state);
                const index = findItemIndex(list.value, list.schema.key, id);
                list.value.splice(index, 1);
                this.setState({
                    updatingPath: null,
                    data: this.state.data
                });
            }).catch((errors) => {
                this.setState({
                    updatingPath: null,
                    error: {
                        'delete': errors
                    }
                })
            })
        this.setState({
            updatingPath: path,
        })
    }
}

export default ModelStore