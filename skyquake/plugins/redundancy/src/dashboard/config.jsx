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
const PLATFORM = ROLES.PLATFORM;

class ConfigDashboard extends React.Component {
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
        this.Store.listen(this.updateState);
    }
    componentWillUnmount() {
        this.Store.unlisten(this.updateState);
    }
    updateState = (state) => {
        this.setState(state);
    }
    updateConfigInput = (containerName, key, e) => {
        let configData = this.state[containerName];
        if(!configData) {
            configData = {};
        }
        configData[key] = e.target.value;
        this.actions.handleUpdateConfigInput({[containerName]:configData})
    }
    updateDnsIpFqdnConfigInput = (e) => {
        let value = e.target.value;
        this.actions.handleUpdateConfigInput({'dns-ip-fqdn':value})
    }
    updateConfig = (e) => {
        let self = this;
        e.preventDefault();
        e.stopPropagation();
        let configData = self.state.configData;
        let userCredentials = configData['user-credentials'];
        if (!userCredentials || (userCredentials['username'].trim() == '' ) || (userCredentials['password'].trim() == '' )) {
            self.props.flux.actions.global.showNotification("Please enter your user credentials");
            return;
        }
        this.Store.updateConfig(configData);
    }
     evaluateSubmit = (e) => {
        if (e.keyCode == 13) {
            if (this.props.isEdit) {
                this.updateConfig(e);
            } else {
                this.updateConfig(e);
            }
            e.preventDefault();
            e.stopPropagation();
        }
    }
    failOverDecisionChange = (e) => {
        let value = e.target.value;
        value = value.toUpperCase();
        this.actions.handleFailOverDecisionChange(value);
    }
    render() {
        let self = this;
        let html;
        let props = this.props;
        let state = this.state;
        let passwordSectionHTML = null;
        let configData = state.configData;
        let formButtonsHTML = (
            <ButtonGroup className="buttonGroup">
                <Button label="Update" type="submit" onClick={this.updateConfig} />
            </ButtonGroup>
        )
        let GeoFailoverDecision = this.state.configData['geographic-failover-decision'];

        html = (
                <PanelWrapper onKeyUp={this.evaluateSubmit}
                    className={`SiteAdmin column`} column>
                    <AppHeader nav={[{ name: 'SITES', onClick: this.context.router.push.bind(this, { pathname: '/sites' })  }, { name: 'CONFIG'}, { name: 'STATUS', onClick: this.context.router.push.bind(this, { pathname: '/status' }) }]} />
                    <PanelWrapper onKeyUp={this.evaluateSubmit}
                    className={`SiteAdmin column`} style={{overflow: 'auto'}} column>
                    <Panel
                        title="GEOGRAPHIC FAILOVER DECISION"
                        style={{flex: `0 0 ${GeoFailoverDecision != "INDIRECT" ? '150px' : '220px'}`}}
                        no-corners>
                        <Input className="userInfo-section"
                            type="radiogroup"
                            onChange={this.failOverDecisionChange}
                            value={GeoFailoverDecision}
                            options={state.failOverDecisionOptions}
                        />
                        {
                            GeoFailoverDecision != "INDIRECT" ? null :
                            <Input type="text"  onChange={self.updateDnsIpFqdnConfigInput.bind(self)} label="DNS FQDN/IP Address" value={state.configData['dns-ip-fqdn']} />
                        }
                    </Panel>
                    {
                        GeoFailoverDecision == "DIRECT" ?
                            <Panel
                                title="Preferred Failback Site"
                                style={{flex: '0 0 160px'}}
                                no-corners>
                                <Input type="text"  onChange={self.updateConfigInput.bind(self, 'revertive-preference', 'preferred-site-name')} label="Site Name" value={state.configData['revertive-preference'] && state.configData['revertive-preference']['preferred-site-name']} />
                            </Panel>
                       : null
                    }
                     <Panel
                        title="User Credentials"
                        style={{flex: '0 0 250px'}}
                        no-corners>
                        <Input type="text"  onChange={self.updateConfigInput.bind(self, 'user-credentials', 'username')} label="Username" value={state.configData['user-credentials'] && state.configData['user-credentials']['username']}
                        required />
                        <Input type="password"  onChange={self.updateConfigInput.bind(self, 'user-credentials', 'password')} label="Password" value={state.configData['user-credentials'] && state.configData['user-credentials']['password']}
                        required />
                    </Panel>
                    <Panel
                        title="Polling Configuration"
                        style={{flex: `0 0 ${GeoFailoverDecision != "INDIRECT" ? '390px' : '230px'}`}}
                        no-corners>
                            <Input type="text"  onChange={self.updateConfigInput.bind(self, 'polling-config', 'poll-interval')} label="polling interval (s)" value={state.configData['polling-config'] && state.configData['polling-config']['poll-interval']} />
                            {
                                GeoFailoverDecision == "DIRECT" ?
                                    <Input type="text"  onChange={self.updateConfigInput.bind(self, 'polling-config', 'failover-timeo')} label="Failover Timeout (s)" value={state.configData['polling-config'] && state.configData['polling-config']['failover-timeo']} />
                               : null
                            }
                            {
                                GeoFailoverDecision == "DIRECT" ?
                                    <Input type="text"  onChange={self.updateConfigInput.bind(self, 'polling-config', 'failback-timeo')} label="Failback Timeout (s)" value={state.configData['polling-config'] && state.configData['polling-config']['failback-timeo']} />
                               : null
                            }
                            <Input type="text" onChange={self.updateConfigInput.bind(self,'polling-config', 'no-response-counter')} label="No Response Counter" value={state.configData['polling-config'] && state.configData['polling-config']['no-response-counter']} />


                    </Panel>
                    </PanelWrapper>
                     <SkyquakeRBAC allow={[PLATFORM.SUPER, PLATFORM.ADMIN]} site={this.state.name} className="rbacButtonGroup">
                        {formButtonsHTML}
                     </SkyquakeRBAC>
                </PanelWrapper>
        );
        return html;
    }
}
// onClick={this.Store.update.bind(null, Account)}
ConfigDashboard.contextTypes = {
    router: React.PropTypes.object,
    userProfile: React.PropTypes.object
};

ConfigDashboard.defaultProps = {
    siteList: [],
    selectedSite: {}
}

export default SkyquakeComponent(ConfigDashboard);


function isElementInView(el) {
    var rect = el && el.getBoundingClientRect() || {};

    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) && /*or $(window).height() */
        rect.right <= (window.innerWidth || document.documentElement.clientWidth) /*or $(window).width() */
    );
}


// isReadOnly={state.isReadOnly} disabled={state.disabled} onChange={this.disableChange}

class isDisabled extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        let props = this.props;
        return (<div/>)
    }
}

function showInput(e){
  let target = e.target;
  if(target.parentElement.classList.contains("addInput")) {
    target = target.parentElement;
  }
  target.style.display = 'none';
  target.parentElement.nextElementSibling.style.display = 'flex';
  // e.target.parentElement.nextElementSibling.children[1].style.display = 'initial';
}
function hideInput(e){
  let target = e.target;
  if(target.parentElement.classList.contains("removeInput")) {
    target = target.parentElement;
  }
  target.parentElement.style.display = 'none';
  target.parentElement.previousElementSibling.children[1].style.display = 'inline';
  target.previousSibling.value = '';
}


