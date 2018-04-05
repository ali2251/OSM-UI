/*
 * STANDARD_RIFT_IO_COPYRIGHT
 */

import React from 'react';
import ReactDOM from 'react-dom';
import AppHeader from 'widgets/header/header.jsx';
import RedundancyStore from './redundancyStore.js';
import SkyquakeComponent from 'widgets/skyquake_container/skyquakeComponent.jsx';
import SkyquakeRBAC from 'widgets/skyquake_rbac/skyquakeRBAC.jsx';
import 'style/layout.scss';
import {Panel, PanelWrapper} from 'widgets/panel/panel';
import {InputCollection, FormSection} from 'widgets/form_controls/formControls.jsx';

import TextInput from 'widgets/form_controls/textInput.jsx';
import Input from 'widgets/form_controls/input.jsx';
import Button, {ButtonGroup} from 'widgets/button/sq-button.jsx';
import SelectOption from 'widgets/form_controls/selectOption.jsx';
import 'widgets/form_controls/formControls.scss';
import imgAdd from '../../node_modules/open-iconic/svg/plus.svg'
import imgRemove from '../../node_modules/open-iconic/svg/trash.svg'
import _  from 'lodash';
import ROLES from 'utils/roleConstants.js';

import './redundancy.scss';
const PROJECT_ROLES = ROLES.PROJECT;
const PLATFORM = ROLES.PLATFORM;

class StatusDashboard extends React.Component {
    constructor(props) {
        super(props);
        this.Store = this.props.flux.stores.hasOwnProperty('RedundancyStore') ? this.props.flux.stores.RedundancyStore : this.props.flux.createStore(RedundancyStore, 'RedundancyStore');
        this.state = this.Store.getState();
        this.actions = this.state.actions;
    }
    componentDidUpdate() {
    }
    componentWillMount() {
        this.state = this.Store.getState();
        this.Store.getRedundancy();
        this.Store.openRedundancyStateSocket();
        this.Store.listen(this.updateState);
    }
    componentWillUnmount() {
        this.Store.unlisten(this.updateState);
        this.Store.closeSocket();
    }
    updateState = (state) => {
        this.setState(state);
    }
    render() {
        let self = this;
        let html;
        let props = this.props;
        let state = this.state;
        let STATUS = state.status;
        /*

    {
        "active-instance": {
            "active-inst-id": "10.64.210.20",
            "is-this-instance-active": "true",
            "site-name": "site20"
        },
        "vm-identity": "ebbd6444-d6a7-4eda-ab0d-e23fdbcdeffe",
        "health-status": [
            {
                "state": "RUNNING_AS_ACTIVE",
                "rwinstance-id": "10.64.210.20",
                "site-name": "site20"
            },
            {
                "state": "NO_RESPONSE",
                "rwinstance-id": "10.64.210.33",
                "site-name": "site33"
            }
        ]
    }


         */

        html = (
                <PanelWrapper onKeyUp={this.evaluateSubmit}
                    className={`SiteAdmin column`} column>
                    <AppHeader nav={[{ name: 'SITES', onClick: this.context.router.push.bind(this, { pathname: '/sites' })  }, { name: 'CONFIG', onClick: this.context.router.push.bind(this, { pathname: '/config' })}, { name: 'STATUS' }]} />
                    <PanelWrapper onKeyUp={this.evaluateSubmit}
                    className={`SiteAdmin column`} style={{overflow: 'auto'}} column>
                    <Panel
                        title="Active Instance"
                        style={{flex: '0 0 300px'}}
                        no-corners>
                        <TextInput type="text" label="VM ID" readonly={true} value={STATUS['vm-identity'] } />
                        <TextInput type="text" label="active instance ID" readonly={true} value={STATUS['active-instance'] && STATUS['active-instance']['active-inst-id'] } />
                        <TextInput type="text" label="Site Name" readonly={true} value={STATUS['active-instance'] && STATUS['active-instance']['site-name'] } />
                    </Panel>
                    <Panel
                        title="CONFIGURATION STATE"
                        style={{flex: '0 0 250px'}}
                        no-corners>
                           <div className="tableRow tableRow--header">
                                <div>
                                    SITE NAME
                                </div>
                                 <div>
                                    INSTANCE IP
                                </div>
                                <div>
                                    CURRENT STATE
                                </div>
                                <div>
                                    PREVIOUS STATE
                                </div>
                                <div>
                                    CONFIG GENERATION #
                                </div>
                                <div>
                                    LAST PACKAGE UPDATE
                                </div>
                            </div>
                            {
                                STATUS['config-state'] && STATUS['config-state'].map((u, k) => {
                                    return (
                                        <div className={`tableRow tableRow--data`} key={k}>
                                            <div>
                                                {u['site-name'] || '--'}
                                            </div>
                                            <div>
                                                {u['rwinstance-ip'] || '--'}
                                            </div>
                                            <div>
                                                {u['current-state'] || '--'}
                                            </div>
                                            <div>
                                                {u['previous-state'] || '--'}
                                            </div>
                                            <div>
                                                {u['config-generation-number'] || '--'}
                                            </div>
                                            <div>
                                                {u['last-package-update'] || '--'}
                                            </div>


                                        </div>
                                    )
                                })
                            }


                    </Panel>
                    <Panel
                        title="HEALTH STATUS"
                        style={{flex: '0 0 250px'}}
                        no-corners>
                           <div className="tableRow tableRow--header">
                                <div>
                                    RW INSTANCE
                                </div>
                                <div>
                                    STATUS
                                </div>
                            </div>
                            {STATUS['health-status'] && STATUS['health-status'].map((u, k) => {
                            return (
                                <div className={`tableRow tableRow--data`} key={k}>
                                    <div>
                                        {u['rwinstance-id'] || '--'}
                                    </div>
                                    <div>
                                        {u['state'] || '--'}
                                    </div>


                                </div>
                            )
                        })}


                    </Panel>
                </PanelWrapper>
                </PanelWrapper>
        );
        return html;
    }
}
// onClick={this.Store.update.bind(null, Account)}
StatusDashboard.contextTypes = {
    router: React.PropTypes.object,
    userProfile: React.PropTypes.object
};

StatusDashboard.defaultProps = {
    siteList: [],
    selectedSite: {}
}

export default SkyquakeComponent(StatusDashboard);
