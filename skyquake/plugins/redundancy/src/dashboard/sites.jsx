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

class SiteManagementDashboard extends React.Component {
    constructor(props) {
        super(props);
        this.Store = this.props.flux.stores.hasOwnProperty('RedundancyStore') ? this.props.flux.stores.RedundancyStore : this.props.flux.createStore(RedundancyStore, 'RedundancyStore');
        this.state = this.Store.getState();
        this.actions = this.state.actions;
    }
    componentDidUpdate() {
        let self = this;
        ReactDOM.findDOMNode(this.siteList).addEventListener('transitionend', this.onTransitionEnd, false);
        setTimeout(function() {
            let element = self[`site-ref-${self.state.activeIndex}`]
            element && !isElementInView(element) && element.scrollIntoView({block: 'end', behavior: 'smooth'});
        })
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
    updateInput = (key, e) => {
        let property = key;
        let siteData = this.state.siteData;
        siteData[property] = e.target.value;
        this.actions.handleUpdateInput({
            siteData
        })
    }
    updateServiceTargetInput = (serviceName, key, e) => {
        let state = this.state;
        let siteData = this.state.siteData;
        let value = e.target.value;
        let index =  _.findIndex(state.siteData['target-endpoint'], function(o) {
            return o.name == serviceName
        });
        if((index == undefined) || index == -1) {
            index = siteData['target-endpoint'].push({name: serviceName}) - 1
        }
        siteData['target-endpoint'][index]['name'] = serviceName;
        if(value.trim() == '') {
            delete siteData['target-endpoint'][index][key];
        } else {
            siteData['target-endpoint'][index][key] = value
        }
        this.actions.handleUpdateInput({
            siteData
        })
    }
    updateInstanceInput = (index, key, e) => {
        let siteData = this.state.siteData;
        siteData['rw-instances'][index][key] = e.target.value;
        this.actions.handleUpdateInput({
            siteData
        })
    }
    updateInstanceInputEndpoint = (index, serviceName, key, e) => {
        let siteData = this.state.siteData;
        let state = this.state;
        let value = e.target.value;
        let listIndex =  _.findIndex(siteData['rw-instances'][index].endpoint, function(o) {
         return o.name == serviceName
        });
        if(!siteData['rw-instances'][index].endpoint) {
            siteData['rw-instances'][index].endpoint = []
        }
        if(listIndex == undefined || listIndex == -1) {
            listIndex = siteData['rw-instances'][index].endpoint.push({name: serviceName}) - 1;
        }
         if(value.trim() == '') {
            delete siteData['rw-instances'][index].endpoint[listIndex][key];
        } else {
            siteData['rw-instances'][index].endpoint[listIndex][key] = value
        }
        siteData['rw-instances'][index].endpoint[listIndex]['name'] = serviceName;
        this.actions.handleUpdateInput({
            siteData
        })
    }
    addSite = () => {
        this.actions.handleAddSite();
    }
    viewSite = (un, index) => {
        this.actions.viewSite(un, index, true);
    }
    editSite = () => {
        this.actions.editSite(false);
    }
    cancelEditSite = () => {
        this.actions.editSite(true)
    }
    closePanel = () => {
        this.actions.handleCloseSitePanel();
    }

    deleteSite = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this site?')) {
            this.Store.deleteSite({
                'site-name': this.state.siteData['site-name']
            });
        }
    }
    createSite = (e) => {
        let self = this;
        e.preventDefault();
        e.stopPropagation();
        let siteData = self.state.siteData;
        if (this.validateFields(self, siteData)) {
            this.Store.createSite(siteData);
        }
    }
    updateSite = (e) => {
        let self = this;
        e.preventDefault();
        e.stopPropagation();
        let siteData = self.state.siteData;
        if (this.validateFields(self, siteData)) {
            this.Store.updateSite(siteData);
        }
    }
    validateFields(self, siteData) {
        if (!siteData['site-name'] || siteData['site-name'].trim() == '') {
            self.props.flux.actions.global.showNotification("Please enter a site name");
            return false;
        }
        let instanceInvalid = false;
        siteData['rw-instances'] && siteData['rw-instances'].map(function(rw) {
            if (!rw['rwinstance-id'] || rw['rwinstance-id'].trim() == '' ) {
                instanceInvalid = true;;
            }
        });
        if (instanceInvalid) {
            self.props.flux.actions.global.showNotification("One or more of your RIFT.WARE Instances is missing it's FQDN/IP Address");
            return false;
        }
        return true;
    }
     evaluateSubmit = (e) => {
        if (e.keyCode == 13) {
            if (this.props.isEdit) {
                this.updateSite(e);
            } else {
                this.createSite(e);
            }
            e.preventDefault();
            e.stopPropagation();
        }
    }
    onTransitionEnd = (e) => {
        this.actions.handleHideColumns(e);
        console.log('transition end')
    }
    render() {
        let self = this;
        let html;
        let props = this.props;
        let state = this.state;
        let passwordSectionHTML = null;
        let formButtonsHTML = (
                <ButtonGroup className="buttonGroup">
                    <Button label="EDIT" type="submit" onClick={this.editSite} />
                </ButtonGroup>
        );
        if(!this.state.isReadOnly) {
            formButtonsHTML = (
                                state.isEdit ?
                                (
                                    <ButtonGroup className="buttonGroup">
                                        <Button label="Update" type="submit" onClick={this.updateSite} />
                                        <Button label="Delete" onClick={this.deleteSite} />
                                        <Button label="Cancel" onClick={this.cancelEditSite} />
                                    </ButtonGroup>
                                )
                                : (
                                    <ButtonGroup className="buttonGroup">
                                        <Button label="Create" type="submit" onClick={this.createSite}  />
                                    </ButtonGroup>
                                )
                            )
        }

        html = (
        <PanelWrapper column>
             <AppHeader nav={[{ name: 'SITES' }, { name: 'CONFIG', onClick: this.context.router.push.bind(this, { pathname: '/config' }) }, { name: 'STATUS', onClick: this.context.router.push.bind(this, { pathname: '/status' }) }]} />
            <PanelWrapper className={`row siteManagement ${!this.state.siteOpen ? 'siteList-open' : ''}`} style={{'alignContent': 'center', 'flexDirection': 'row'}} >

                <PanelWrapper ref={(div) => { this.siteList = div}} className={`column siteList expanded ${this.state.siteOpen ? 'collapsed ' : ' '} ${this.state.hideColumns ? 'hideColumns ' : ' '}`}>
                    <Panel title="Sites" style={{marginBottom: 0}} no-corners>
                        <div className="tableRow tableRow--header">
                            <div className="siteName">
                                Site Name
                            </div>
                            <div>
                                # of Instances
                            </div>
                        </div>
                        {state.sites && state.sites.map((u, k) => {
                            return (
                                <div onClick={self.viewSite.bind(null, u, k)} ref={(el) => this[`site-ref-${k}`] = el} className={`tableRow tableRow--data ${((self.state.activeIndex == k) && self.state.siteOpen) ? 'tableRow--data-active' : ''}`} key={k}>
                                    <div
                                        className={`siteName siteName-header ${((self.state.activeIndex == k) && self.state.siteOpen) ? 'activeSite' : ''}`}
                                        >
                                        {u['site-name']}
                                    </div>
                                    <div>
                                        {u['rw-instances'] && u['rw-instances'].length}
                                    </div>

                                </div>
                            )
                        })}
                    </Panel>
                    <SkyquakeRBAC className="rbacButtonGroup">
                        <ButtonGroup  className="buttonGroup">
                            <Button label="Add Site" onClick={this.addSite} />
                        </ButtonGroup>
                    </SkyquakeRBAC>
                </PanelWrapper>
                <PanelWrapper onKeyUp={this.evaluateSubmit}
                    className={`SiteAdmin column`}>
                    <Panel
                        title={state.isEdit ? state.siteData['site-name'] : 'Create Site'}
                        style={{marginBottom: 0}}
                        hasCloseButton={this.closePanel}
                        no-corners>
                        <FormSection title="SITE INFO">
                            {
                                (state.isEditSite ||  state.isReadOnly) ?
                                    <Input readonly={state.isReadOnly || this.state.isEdit} required label="Name" value={state.siteData['site-name']} onChange={this.updateInput.bind(null, 'site-name')} />
                                    : null
                            }
                            <TextInput readonly={state.isReadOnly}
                                label='FQDN/IP Address'
                                pattern={state.siteIdPattern}
                                value={state.siteData['site-id']}
                                onChange={this.updateInput.bind(null, 'site-id')}
                            />
                        </FormSection>
                        {
                            <FormSection className="subSection" title="Service Endpoints">
                                <TextInput type="text" readonly={state.isReadOnly} onChange={self.updateServiceTargetInput.bind(self, 'ui-service', 'port')} label="UI Port" value={state.siteData['target-endpoint'] && state.siteData['target-endpoint'][ _.findIndex(state.siteData['target-endpoint'], function(o) { return o.name == 'ui-service' })] && state.siteData['target-endpoint'][ _.findIndex(state.siteData['target-endpoint'], function(o) { return o.name == 'ui-service' })].port} />
                                <TextInput type="text" readonly={state.isReadOnly} onChange={self.updateServiceTargetInput.bind(self, 'rest-service', 'port')} label="REST Port" value={state.siteData['target-endpoint'] && state.siteData['target-endpoint'][ _.findIndex(state.siteData['target-endpoint'], function(o) { return o.name == 'rest-service' })] && state.siteData['target-endpoint'][ _.findIndex(state.siteData['target-endpoint'], function(o) { return o.name == 'rest-service' })].port} />
                            </FormSection>
                        }
                        {
                            <FormSection title="RIFT.WARE INSTANCES">
                                        {
                                            state.siteData['rw-instances'] && state.siteData['rw-instances'].map(function(t, i) {
                                                return <div key={i} className="rwInstance">
                                                    <h3>
                                                        <span className="title">INSTANCE</span>
                                                        {
                                                            (state.isReadOnly) ? null :
                                                            <span
                                                                onClick={self.actions.handleRemoveInstance.bind(null, {index: i})}
                                                                className="removeInput">
                                                                    <img
                                                                        src={imgRemove}
                                                                        style={{marginBottom: '0px'}}/>
                                                                    Remove
                                                            </span>
                                                        }
                                                    </h3>
                                                    <TextInput type="text"
                                                            label="FQDN/IP Address"
                                                            required
                                                            pattern={state.siteIdPattern}
                                                            readonly={!(t.isNew && (!state.isReadOnly))}
                                                            onChange={self.updateInstanceInput.bind(self, i, 'rwinstance-id')}
                                                            value={state.siteData['rw-instances'][i]['rwinstance-id']} />
                                                    <TextInput type="text"
                                                        label="Floating IP"
                                                        readonly={state.isReadOnly}
                                                        onChange={self.updateInstanceInput.bind(self, i, 'floating-ip')}
                                                        value={state.siteData['rw-instances'][i]['floating-ip']} />
                                                    <FormSection className="subSection" title="Service Endpoints">
                                                        <TextInput type="text"
                                                            label="UI Port"
                                                            readonly={state.isReadOnly}
                                                            onChange={self.updateInstanceInputEndpoint.bind(self, i, 'ui-service', 'port')}
                                                            value={state.siteData['rw-instances'] && state.siteData['rw-instances'][i] && state.siteData['rw-instances'][i].endpoint && state.siteData['rw-instances'][i].endpoint[ _.findIndex(state.siteData['rw-instances'][i].endpoint, function(o) { return o.name == 'ui-service' })
                                                            ] && state.siteData['rw-instances'][i].endpoint[ _.findIndex(state.siteData['rw-instances'][i].endpoint, function(o) { return o.name == 'ui-service' })
                                                            ].port}
                                                            />
                                                        <TextInput type="text"
                                                            label="REST Port"
                                                            readonly={state.isReadOnly}
                                                            onChange={self.updateInstanceInputEndpoint.bind(self, i,'rest-service', 'port')}
                                                            value={state.siteData['rw-instances'] && state.siteData['rw-instances'][i] && state.siteData['rw-instances'][i].endpoint && state.siteData['rw-instances'][i].endpoint[
                                                             _.findIndex(state.siteData['rw-instances'][i].endpoint, function(o) { return o.name == 'rest-service' })
                                                            ] && state.siteData['rw-instances'][i].endpoint[ _.findIndex(state.siteData['rw-instances'][i].endpoint, function(o) { return o.name == 'rest-service' })
                                                            ].port}
                                                            />
                                                    </FormSection>
                                                </div>
                                            })
                                        }
                                        {
                                                (state.isReadOnly) ? null :
                                                <span onClick={self.actions.handleAddInstance} className="addInput"  ><img src={imgAdd} />Add Instance</span>
                                         }
                            </FormSection>
                        }


                    </Panel>
                     <SkyquakeRBAC allow={[PLATFORM.SUPER, PLATFORM.ADMIN]} site={this.state.name} className="rbacButtonGroup">
                        {formButtonsHTML}
                     </SkyquakeRBAC>
                </PanelWrapper>
            </PanelWrapper>
        </PanelWrapper>
        );
        return html;
    }
}
// onClick={this.Store.update.bind(null, Account)}
SiteManagementDashboard.contextTypes = {
    router: React.PropTypes.object,
    userProfile: React.PropTypes.object
};

SiteManagementDashboard.defaultProps = {
    siteList: [],
    selectedSite: {}
}

export default SkyquakeComponent(SiteManagementDashboard);


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


