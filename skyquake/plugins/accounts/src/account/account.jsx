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
import Button from 'widgets/button/rw.button.js';
import _cloneDeep from 'lodash/cloneDeep';
import _isEmpty from 'lodash/isEmpty';
import SkyquakeComponent from 'widgets/skyquake_container/skyquakeComponent.jsx';
import Crouton from 'react-crouton';
import TextInput from 'widgets/form_controls/textInput.jsx';
import {AccountConnectivityStatus} from '../account_sidebar/accountSidebar.jsx';
import Utils from 'utils/utils.js';
import 'style/common.scss';
import './account.scss';

function isAccessDenied (error) {
    const rpcResult = Utils.rpcError(error);
    return rpcResult && rpcResult['rpc-reply']['rpc-error']['error-tag'] === 'access-denied';
}

class Account extends React.Component {
    constructor(props) {
        super(props);

        // console.log(this.state.account)
    }
    storeListener = (state) => {
        if(state.socket) {
            if((!state.account || _isEmpty(state.account)) && state.userProfile) {
                this.setUp(this.props, state.savedData)
            }
            state.account && state.account.params && this.setState({
                account: state.account,
                accountType: state.accountType,
                types: state.types,
                sdnOptions: state.sdnOptions,
                savedData: state.savedData,
                userProfile: state.userProfile
            })
        }
    }
    componentWillMount() {
        this.state = this.props.store.getState();
        this.props.store.listen(this.storeListener);
    }
    componentWillUpdate(nextProps, nextState, nextContext) {
        if(!_isEmpty(nextContext.userProfile) && !nextState.userProfile) {
            this.props.store.getTransientAccountForUser(nextContext.userProfile)
        }
    }
    componentWillReceiveProps(nextProps) {
        if(JSON.stringify(nextProps.params) != JSON.stringify(this.props.params)){
              this.setUp(nextProps);
        }
    }
    componentWillUnmount() {
        console.log('unmounting')
        // this.setState({account: null, accountType: null, types: []})
        this.props.store.unlisten(this.storeListener);
    }
    setUp(props, savedData){
        console.log('Setting up');
        var SD = savedData || this.state.savedData;
        if(props.params.name && props.params.name != 'create') {
            if (SD && SD == props.params.name) {
                this.props.store.viewAccount({type: props.params.type, name: props.params.name}, SD);
            } else {
                this.props.store.viewAccount({type: props.params.type, name: props.params.name});
            }

        } else {
            this.props.store.setAccountTemplate(props.params.type, null, SD);
        }
    }
    create(e) {
        e.preventDefault();
        var self = this;
        var Account = this.state.account;
        let AccountType = this.state.accountType;
        if (Account.name == "") {
            self.props.flux.actions.global.showNotification("Please give the account a name");
            return;
        } else {
            if(!wasAllDetailsFilled(Account)) {
                self.props.flux.actions.global.showNotification("Please fill all account details");
                return;
            }
        }

        let newAccount = _cloneDeep(removeTrailingWhitespace(Account));

        delete newAccount.params;

        newAccount.nestedParams &&
        newAccount.nestedParams['container-name'] &&
        delete newAccount[newAccount.nestedParams['container-name']];

        delete newAccount.nestedParams;

        if(AccountType == 'resource-orchestrator') {
            newAccount['ro-account-type'] = newAccount['account-type'] || newAccount['ro-account-type'];
            delete newAccount['account-type'];
        }
        if(AccountType == 'cloud' && self.props.vduInstanceTimeout != '') {
            newAccount['vdu-instance-timeout'] = self.props.vduInstanceTimeout;
        }
        this.props.flux.actions.global.showScreenLoader();
        this.props.store.create(newAccount, AccountType).then(
            function() {
                self.props.router.push({pathname:'accounts'});
                self.props.flux.actions.global.hideScreenLoader.defer();
            },
            function(error) {
                self.props.flux.actions.global.showNotification(error);
                self.props.flux.actions.global.hideScreenLoader.defer();
            }
        );
    }
    update(e) {
        e.preventDefault();
        var self = this;
        var Account = this.state.account;
        let AccountType = this.state.accountType;

        if(!wasAllDetailsFilled(Account)) {
            self.props.flux.actions.global.showNotification("Please fill all account details");
            return;
        }

        if(AccountType == 'cloud' && self.props.vduInstanceTimeout != '') {
            Account['vdu-instance-timeout'] = self.props.vduInstanceTimeout;
        }
        this.props.flux.actions.global.showScreenLoader();
        this.props.store.update(Account, AccountType).then(
            function() {
                self.props.router.push({pathname:'accounts'});
                self.props.flux.actions.global.hideScreenLoader();
            },
            function(error){
                let msg = isAccessDenied(error) ?
                    "Update of account failed. No authorization to modify accounts."
                    : "Update of account failed. This could be because the account is in use or no longer exists.";
                self.props.flux.actions.global.hideScreenLoader.defer();
                self.props.flux.actions.global.showNotification.defer(msg);
            }
        );
    }
    cancel = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.props.flux.actions.global.handleCancelAccount();
        this.props.router.push({pathname:'accounts'});
    }
    handleDelete = () => {
        let self = this;
        let msg = 'Preparing to delete "' + self.state.account.name + '"' +
        ' Are you sure you want to delete this ' + self.state.accountType + ' account?"';
        if (window.confirm(msg)) {
            this.props.flux.actions.global.showScreenLoader();
            this.props.store.delete(self.state.accountType, self.state.account.name).then(
                function() {
                    self.props.flux.actions.global.hideScreenLoader();
                    self.props.router.push({pathname:'accounts'});
                },
                function(error){
                    let msg = isAccessDenied(error) ?
                        "Deletion of account failed. No authorization to delete accounts."
                        : "Deletion of account failed. This could be because the account is in use or has already been deleted.";
                    self.props.flux.actions.global.hideScreenLoader.defer();
                    self.props.flux.actions.global.showNotification.defer(msg);
                }
            );
        }
    }
    handleNameChange(event) {
       this.props.store.handleNameChange(event);
    }
    handleAccountTypeChange(node, isRo, event) {
        this.props.store.handleAccountTypeChange(node, isRo, event);
    }
    handleSelectSdnAccount = (e) => {
        var tmp = this.state.account;
        if(e) {
            tmp['sdn-account'] = e;
        } else {
            if(tmp['sdn-account']) {
                delete tmp['sdn-account'];
            }
        }
        console.log(e, tmp)
    }
    updateVduInstanceTimeout(event) {
        this.props.store.updateVduTimeout(event)
    }
    preventDefault = (e) => {
        e.preventDefault();
        e.stopPropagation();
    }
    evaluateSubmit = (e) => {
        if (e.keyCode == 13) {
            if (this.props.params.name != 'create') {
                this.update(e);
            } else {
                this.create(e);
            }
            e.preventDefault();
            e.stopPropagation();
        }
    }

    render() {
        let self = this;
        let {store, ...props} = this.props;
        // This section builds elements that only show up on the create page.
        // var name = <label>Name <input type="text" onChange={this.handleNameChange.bind(this)} style={{'textAlign':'left'}} /></label>;
        let Account = this.state.account || {};
        var name = <TextInput label="Name"  onChange={this.handleNameChange.bind(this)} required={true} value={Account &&Account.name || ''} />;
        let params = null;
        let selectAccount = null;
        let resfreshStatus = null;
        // AccountType is for the view, not the data account-type value;
        let AccountType = this.state.accountType;
        let Types = this.state.types;
        let isEdit = this.props.params.name != 'create';
        var buttons;
        let cloudResources = Account['cloud-resources-state'] && Account['cloud-resources-state'][Account['account-type']];
        let cloudResourcesStateHTML = null;
        // Account Type Radio
        var selectAccountStack = [];
        let setVduTimeout = null;
        if (!isEdit) {
            buttons = [
                <Button key="0" onClick={this.cancel} className="cancel light" label="Cancel"></Button>,
                <Button key="1" role="button" onClick={this.create.bind(this)} className="save dark" label="Save" />
            ]
            for (var i = 0; i < Types.length; i++) {
                var node = Types[i];
                const isRo = node.hasOwnProperty('ro-account-type');
                var isSelected = (Account['account-type'] || Account['ro-account-type']) == (node['account-type'] || node['ro-account-type']);
                selectAccountStack.push(
                  <label key={i} className={"accountSelection " + (isSelected ? "accountSelection--isSelected" : "")}>
                    <div className={"accountSelection-overlay" + (isSelected ? "accountSelection-overlay--isSelected" : "")}></div>
                    <div className="accountSelection-imageWrapper">
                        <img src={store.getImage(node['account-type'] || node['ro-account-type'])}/>
                    </div>
                    <input type="radio" name="account" onChange={this.handleAccountTypeChange.bind(this, node, isRo)} defaultChecked={node.name == Types[0].name} value={node['account-type'] || node['ro-account-type']} />{node.name}
                  </label>
                )
            }
            selectAccount = (
                <div className="accountForm">
                    <h3 className="accountForm-title">Select Account Type</h3>
                    <div className="select-type accountForm-content" >
                        {selectAccountStack}
                    </div>
                </div>
            );
        } else {
            selectAccount = null
        }

        //Cloud Account: SDN Account Option
        let sdnAccounts = null;
        if( (AccountType == 'cloud') ) {
            if ( !isEdit && (this.state.sdnOptions.length > 1 )) {
                sdnAccounts = (
                    <div className="associateSdnAccount accountForm">
                        <h3 className="accountForm-title">Associate SDN Account</h3>
                        <div className="accountForm-content">
                            <SelectOption  options={this.state.sdnOptions} onChange={this.handleSelectSdnAccount} />
                        </div>

                    </div>
                );
            }
            if(isEdit && Account['sdn-account']) {
                sdnAccounts = ( <div className="associateSdnAccount">SDN Account: {Account['sdn-account']} </div>)
            }
        }
         //END Cloud Account: SDN Account Option

         setVduTimeout = <TextInput
                        className="accountForm-input"
                        label="VIM Instantiation Timeout (Seconds)"
                        onChange={this.updateVduInstanceTimeout.bind(this)}
                        value={this.props.vduInstanceTimeout}
                        readonly={self.props.readonly}
                        placeholder={300}
                        />

         //
        // This sections builds the parameters for the account details.
        if (Account.params) {
            var paramsStack = [];
            var optionalField = '';
            var isRo = Account.hasOwnProperty('ro-account-type');
            for (var i = 0; i < Account.params.length; i++) {
                var node = Account.params[i];
                var value = ""
                if(isRo) {
                    if (Account[Account['ro-account-type']] && Account[Account['ro-account-type']][node.ref]) {
                        value = Account[Account['ro-account-type']][node.ref]
                    }
                } else  {
                    if (Account[Account['account-type']] && Account[Account['account-type']][node.ref]) {
                        value = Account[Account['account-type']][node.ref]
                    }
                }
                if (this.props.edit && Account.params) {
                    value = Account.params[node.ref];
                }
                if(node.ref == "password" || node.ref == "secret") {
                    let displayValue = value;
                    if (self.props.readonly) {
                        displayValue = new Array(value.length + 1).join( '*' );
                    }
                    paramsStack.push(
                        <TextInput
                            key={node.label}
                            className="accountForm-input"
                            label={node.label}
                            required={!node.optional}
                            onChange={this.props.store.handleParamChange(node, isRo)}
                            value={displayValue}
                            readonly={self.props.readonly}
                            type="password"
                        />
                    );
                } else {
                    paramsStack.push(
                        <TextInput
                            key={node.label}
                            className="accountForm-input"
                            label={node.label}
                            required={!node.optional}
                            onChange={this.props.store.handleParamChange(node, isRo)}
                            value={value}
                            readonly={self.props.readonly}
                        />
                    );
                }
            }

            let nestedParamsStack = null;
            if (Account.nestedParams) {
                nestedParamsStack = [];
                var optionalField = '';
                for (var i = 0; i < Account.nestedParams.params.length; i++) {
                    var node = Account.nestedParams.params[i];
                    var value = ""
                    if (Account[Account['account-type']] && Account.nestedParams && Account[Account['account-type']][Account.nestedParams['container-name']] && Account[Account['account-type']][Account.nestedParams['container-name']][node.ref]) {
                        value = Account[Account['account-type']][Account.nestedParams['container-name']][node.ref];
                    }
                    if (node.optional) {
                        optionalField = <span className="optional">Optional</span>;
                    }
                    // nestedParamsStack.push(
                    //     <label key={node.label}>
                    //       <label className="create-fleet-pool-params">{node.label} {optionalField}</label>
                    //       <input className="create-fleet-pool-input" type="text" onChange={this.props.store.handleNestedParamChange(Account.nestedParams['container-name'], node)} value={value}/>
                    //     </label>
                    // );
                    if(node.ref == "password" || node.ref == "secret") {
                        let displayValue = value;
                        if (self.props.readonly) {
                            displayValue = new Array(value.length + 1).join( '*' );
                        }
                        nestedParamsStack.push(
                              <TextInput
                                key={node.label}
                                label={node.label}
                                required={!node.optional}
                                className="create-fleet-pool-input"
                                type="password"
                                onChange={this.props.store.handleNestedParamChange(Account.nestedParams['container-name'], node)}
                                value={displayValue}
                                readonly={self.props.readonly}
                                />
                        );
                    } else {
                            nestedParamsStack.push(
                              <TextInput
                                key={node.label}
                                label={node.label}
                                required={!node.optional}
                                className="create-fleet-pool-input"
                                type="text"
                                onChange={this.props.store.handleNestedParamChange(Account.nestedParams['container-name'], node)}
                                value={value}
                                readonly={self.props.readonly}
                                />
                        );
                    }
                }
            }

            params = (
                <li className="create-fleet-pool accountForm">
                    <h3  className="accountForm-title"> {isEdit ? 'Update' : 'Enter'} Account Details</h3>
                    <div className="accountForm-content">
                        {paramsStack}
                        <div className="accountForm-nestedParams">
                        {nestedParamsStack}
                        </div>
                    </div>
                </li>
            )
        } else {
            params = (
                <li className="create-fleet-pool accountForm">
                    <h3 className="accountForm-title"> {isEdit ? 'Update' : 'Enter'}</h3>
                    <label style={{'marginLeft':'17px', color:'#888'}}>No Details Required</label>
                </li>
            )
        }

        // This section builds elements that only show up in the edit page.
        if (isEdit) {
            name = <label>{Account.name}</label>;
            buttons = [
                <Button key="2" onClick={this.handleDelete} className="light" label="Remove Account" />,
                <Button key="3" onClick={this.cancel} className="light" label="Cancel" />,
                <Button key="4" role="button" onClick={this.update.bind(this)} className="update dark" label="Update" />
            ];
            resfreshStatus = Account['connection-status'] ? (
                <div className="accountForm">
                    <div className="accountForm-title accountForm-title--edit">
                        Connection Status
                    </div>
                    <div className="accountForm-content" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                            <AccountConnectivityStatus status={Account['connection-status'].status} />
                            {Account['connection-status'] && Account['connection-status'].status &&  Account['connection-status'].status.toUpperCase()}
                        </div>
                        { self.props.readonly ? null :
                            <Button is-disabled={self.props.readonly} className="refreshList light" onClick={this.props.store.refreshAccount.bind(this, Account.name, AccountType)} label="REFRESH STATUS" />
                        }
                    </div>
                    {
                        (Account['connection-status'] && Account['connection-status'].status && Account['connection-status'].status.toUpperCase()) === 'FAILURE' ?
                        displayFailureMessage(Account['connection-status'].details) : null
                    }
                </div>
            ) : null;

        }

        var html = (

              <form className="app-body create Accounts"  onSubmit={this.preventDefault} onKeyDown={this.evaluateSubmit}>
                <div className="noticeSubText noticeSubText_right">
                    * required
                </div>
                <div className="associateSdnAccount accountForm">
                    <h3 className="accountForm-title">Account</h3>
                    <div className="accountForm-content" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                        {name}
                        { isEdit ?
                            (
                                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                    <img src={store.getImage(Account['account-type'] || Account['ro-account-type'])}/> {props.AccountMeta.labelByType[Account['account-type'] || Account['ro-account-type']]}
                                </div>)
                            : null
                        }
                    </div>
                     {
                        AccountType == 'cloud' ? (
                                <div className="accountForm-content">
                                    {setVduTimeout}
                                </div>
                            )
                        : null
                    }
                </div>

                  {selectAccount}
                  {sdnAccounts}
                  {resfreshStatus}
                  {cloudResourcesStateHTML}
                  <ol className="flex-row">
                      {params}
                  </ol>
                  <div className="form-actions">
                      {!self.props.readonly ? buttons : null}
                  </div>
              </form>
        )
        return Types.length ? html : null;
    }
}

Account.contextTypes = {
    router: React.PropTypes.object,
    userProfile: React.PropTypes.object
}

function displayFailureMessage(msg) {
    return (
        <div className="accountForm-content" style={{maxWidth: '600px'}}>
            <div style={{paddingBottom: '1rem'}}>Details:</div>
            <div>
                {msg}
            </div>

        </div>
    )
}

class SelectOption extends React.Component {
  constructor(props){
    super(props);
  }
  handleOnChange = (e) => {
    this.props.onChange(JSON.parse(e.target.value));
  }
  render() {
    let html;
    html = (
      <select className={this.props.className} onChange={this.handleOnChange}>
        {
          this.props.options.map(function(op, i) {
            return <option key={i} value={JSON.stringify(op.value)}>{op.label}</option>
          })
        }
      </select>
    );
    return html;
  }
}
SelectOption.defaultProps = {
  options: [],
  onChange: function(e) {
    console.dir(e)
  }
}

function wasAllDetailsFilled(Account) {
    var type = Account['account-type'] || Account['ro-account-type'];
    var params = Account.params;

    if(params) {
        for (var i = 0; i < params.length; i++) {
            var param = params[i].ref;
            if (typeof(Account[type]) == 'undefined' || typeof(Account[type][param]) == 'undefined' || Account[type][param] == "") {
                if (!params[i].optional) {
                    return false;
                }
            }
        }
    }

    let nestedParams = Account.nestedParams && Account.nestedParams;
    if (nestedParams && nestedParams.params) {
        for (let i = 0; i < nestedParams.params.length; i++) {
            let nestedParam = nestedParams.params[i].ref;
            if (typeof(Account[type]) == 'undefined' || typeof(Account[type][nestedParams['container-name']][nestedParam]) == 'undefined' || Account[type][nestedParams['container-name']][nestedParam] == "") {
                if (!nestedParams.params[i].optional) {
                    return false;
                }
            }
        }
    }
    return true;
}

function removeTrailingWhitespace(Account) {
            var type = Account['account-type'] || Account['ro-account-type'];
            var params = Account.params;

            if(params) {
                for (var i = 0; i < params.length; i++) {
                    var param = params[i].ref;
                    if(typeof(Account[type][param]) == 'string') {
                        Account[type][param] = Account[type][param].trim();
                    }
                }
            }

            let nestedParams = Account.nestedParams;
            if (nestedParams && nestedParams.params) {
                for (let i = 0; i < nestedParams.params.length; i++) {
                    let nestedParam = nestedParams.params[i].ref;
                    let nestedParamValue = Account[type][nestedParams['container-name']][nestedParam];
                    if (typeof(nestedParamValue) == 'string') {
                        Account[type][nestedParams['container-name']][nestedParam] = nestedParamValue.trim();
                    }
                }
            }
            return Account;
}

export default SkyquakeComponent(Account)
