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
import AppHeader from 'widgets/header/header.jsx';
import RedundancyStore from './redundancyStore.js';
import SkyquakeComponent from 'widgets/skyquake_container/skyquakeComponent.jsx';
import {SkyquakeRBAC, isRBACValid} from 'widgets/skyquake_rbac/skyquakeRBAC.jsx';
import ROLES from 'utils/roleConstants.js';


const PROJECT_ROLES = ROLES.PROJECT;
const PLATFORM = ROLES.PLATFORM;

//Delete this line after testing is done
// PROJECT_ROLES.ACCOUNT_ADMIN = '';
import 'style/layout.scss';

class AccountsDashboard extends React.Component {
    constructor(props) {
        super(props);
        this.Store = this.props.flux.stores.hasOwnProperty('RedundancyStore') ? this.props.flux.stores.RedundancyStore : this.props.flux.createStore(RedundancyStore, "RedundancyStore");
        this.state = this.Store.getState();
    }
    componentWillMount() {
        this.Store.listen(this.updateState);
    }
    componentWillUnmount() {
        this.Store.unlisten(this.updateState);
    }
    updateState = (state) => {
        this.setState(state);
    }
    render() {
        let self = this;
        let html;
        let READONLY = !isRBACValid(this.context.userProfile, [PROJECT_ROLES.ACCOUNT_ADMIN, PROJECT_ROLES.PROJECT_ADMIN]);
        html = (<div className="launchpad-account-dashboard content-wrapper">
                <AppHeader nav={[{ name: 'SITES', onClick: this.context.router.push.bind(this, { pathname: '/sites' })  }, { name: 'CONFIG', onClick: this.context.router.push.bind(this, { pathname: '/config' }) }, { name: 'STATUS', onClick: this.context.router.push.bind(this, { pathname: '/status' }) }]} />
                    <div className="flex">
                      <div>
                        { this.props.children ? React.cloneElement(this.props.children, {readonly: READONLY, store: self.Store, ...self.state}) : 'Edit or Create New Accounts'
                        }
                      </div>
                    </div>
              </div>);
        return html;
    }
}
AccountsDashboard.contextTypes = {
    router: React.PropTypes.object,
    userProfile: React.PropTypes.object
};

export default SkyquakeComponent(AccountsDashboard);
