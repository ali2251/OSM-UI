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
import React from 'react';
import './admin.scss';
import SkyquakeComponent from 'widgets/skyquake_container/skyquakeComponent.jsx';
import AppHeader from 'widgets/header/header.jsx';
import AdminStore from './AdminStore'
import ModelStore from './store/ModelStore'
import ModelExplorer from './components/ModelExplorer'

import 'style/layout.scss';

class Element {
  constructor(explorerModel) {
    this.explorerModel = explorerModel;
    this.node = explorerModel.dataModel.path.split('/').pop().split(':').pop();
    this.dataModel = explorerModel.dataModel;
    if (this.dataModel.data && this.dataModel.schema[this.node].type === 'list' && !Array.isArray(this.dataModel.data)) {
      this.dataModel.data = [this.dataModel.data];
    }
  }
  get name() { return this.dataModel.path.split(':').pop() }
  get type() { return this.dataModel.schema[this.node].type }
  get value() { return this.dataModel.data }
  get schema() { return this.dataModel.schema[this.node] }
  getItemInfo(item) {
    return ModelExplorer.getItemInfo(this.dataModel.schema[this.node].key, item);
  }
  // explore model methods
  getElement = path => path.length > 1 ? this.explorerModel.getElement(path.slice(1)) : this;
}


class Admin extends React.Component {
  constructor(props) {
    super(props)
    this.adminStore = props.flux.stores['AdminStore'] || props.flux.createStore(AdminStore, 'AdminStore');
    this.adminStore.listen(this.updateAdminState);
    this.state = { explorerModels: {}, ...this.adminStore.getState() };
  }

  componentDidMount() {
    const storeList = this.state.modelList ? this.state.modelList.map((path, index) => {
      const store = this.props.flux.stores[path] || this.props.flux.createStore(ModelStore, path, path);
      store.listen(this.updateModelState);
      store.get();
      return store;
    }) : [];
    this.setState({ storeList });
  }

  componentWillUnmount() {
    this.adminStore.unlisten(this.updateSchema);
    this.state.storeList.forEach((store) => store.unlisten(this.updateModelState));
  }

  updateModelState = model => {
    const explorerModels = Object.assign({}, this.state.explorerModels);
    explorerModels[model.path] = new Element(ModelExplorer.getExplorerModel(model));
    this.setState({ explorerModels });
  }

  updateAdminState = admin => {
    // if storeList has changed then handle that
  }

  updateModel = (path, operation, data) => {
    const store = this.props.flux.stores[path[1]] || this.props.flux.createStore(ModelStore, path[1]);
    store[operation](path.slice(2), data);
    return operation === 'delete'; // close column?
  }

  adminExplorerModel = new class {
    constructor(admin) {
      this.admin = admin;
    }

    getElement(path) {
      if (path.length > 2) {
        return this.admin.state.explorerModels[path[1]].getElement(path.slice(1))
      } else if (path.length > 1) {
        return this.admin.state.explorerModels[path[1]]
      } else {
        const data = Object.values(this.admin.state.explorerModels);
        const properties = data.length ? 
          data.map(e => ({
            name: e.dataModel.path, 
            type: ((e.dataModel.schema && e.dataModel.schema[e.node].type) || 'loading')
          }))
          : [];
        const schema = {
          name: "Configuration", 
          type: 'container', 
          properties
        }
        return {
          schema,
          value: data,
          type: schema.type,
          name: schema.name
        }
      }
    }
  }(this);

  render() {
    const { flux } = this.props;
    const { storeList } = this.state;
    const modelList = storeList && storeList.map(store => store.getState())
    return (
      <div className="admin-container">
        <ModelExplorer model={this.adminExplorerModel} onUpdate={this.updateModel} />
      </div>
    )
  }
}
export default SkyquakeComponent(Admin);
