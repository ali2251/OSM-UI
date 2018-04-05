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
import './accountSidebar.scss';
import DashboardCard from 'widgets/dashboard_card/dashboard_card.jsx';
import AccountStore from '../account/accountStore.js';
import { Link } from 'react-router';
import SkyquakeComponent from 'widgets/skyquake_container/skyquakeComponent.jsx';
import Button from 'widgets/button/rw.button'
class AccountSidebar extends React.Component{
    constructor(props) {
        super(props);
        // this.props.store = this.props.flux.props.stores.hasOwnProperty('AccountStore') ? this.props.flux.props.stores.AccountStore : this.props.flux.createStore(AccountStore);
        var self = this;
        // this.props = this.props.store.getState();
    }
    listenerHandler = (state) => {
        this.setState(state);
    }
    componentWillMount() {
        // this.props.store.listen(this.listenerHandler);
        // this.props.store.openAccountsSocket();
    }
    componentWillUnmount() {
        // this.props.store.closeSocket();
        // this.props.store.unlisten(this.listenerHandler);
    }
    render() {
        let html;
        let self = this;
        let {store, ...props} = this.props;
        //[this.props.cloud,this.props.sdn,this.props['config-agent']]
        let AccountData = [
            {
                type: 'cloud',
                data: this.props.cloud
            },
            {
                type: 'sdn',
                data: this.props.sdn
            },
            {
                type: 'config-agent',
                data: this.props['config-agent']
            },
            {
                type: 'resource-orchestrator',
                data: this.props['resource-orchestrator']
            }
        ];
        let refreshStatus = (<div>Check All Connectivity Status</div>)
        let resourceOrchestrators = (this.props['resource-orchestrator'].length > 0) ? this.props['resource-orchestrator'].map(function(orchestrator, index) {
            let status = null;
            if (orchestrator) {
                if (orchestrator['connection-status']) {
                    status = orchestrator['connection-status'].status;
                }
                return (
                    <DashboardCard  key={index} className='pool-card accountSidebarCard'>
                    <header>
                    <Link to={'accounts/resource-orchestrator/' + encodeURIComponent(orchestrator.name)}>
                            <div className="accountSidebarCard--content">
                                <img className="accountSidebarCard--logo" src={store.getImage(orchestrator['ro-account-type'])} />
                                <h3 title="Edit Resource Orchestrator(RO) Account">
                                    <span className="accountSidebarCard--name" title={orchestrator.name}>{orchestrator.name}</span>
                                    <AccountConnectivityStatus status={status}/>
                                </h3>
                            </div>
                    </Link>
                    </header>
                    </DashboardCard>
                );
            }
        }) : null;
        let cloudAccounts = (this.props.cloud.length > 0) ? this.props.cloud.map(function(account, index) {
            let status = null;
            if (account) {
                if (account['connection-status']) {
                    status = account['connection-status'].status;
                }
                return (
                    <DashboardCard  key={index} className='pool-card accountSidebarCard'>
                    <header>
                    <Link to={'accounts/cloud/' + encodeURIComponent(account.name)} onClick={self.props.actions.handleCancelAccount}>
                            <div className="accountSidebarCard--content">
                                <img className="accountSidebarCard--logo" src={store.getImage(account['account-type'])} />
                                <h3 title="Edit Account">
                                    <span className="accountSidebarCard--name" title={account.name}>{account.name}</span>
                                    <AccountConnectivityStatus status={status}/>
                                </h3>
                            </div>
                    </Link>
                    </header>
                    </DashboardCard>
                );
            }
        }) : null;
        let sdnAccounts = (this.props.sdn && this.props.sdn.length > 0) ? this.props.sdn.map(function(account, index) {
            let status = null;
            if (account['connection-status']) {
                status = account['connection-status'].status;
            }
            return (
                <DashboardCard key={index} className='pool-card accountSidebarCard'>
                     <header>
                        <Link to={'accounts/sdn/' + encodeURIComponent(account.name)} title="Edit Account">
                         <div className="accountSidebarCard--content">
                            <img className="accountSidebarCard--logo" src={store.getImage(account['account-type'])} />
                            <h3><span className="accountSidebarCard--name" title={account.name}>{account.name}</span><AccountConnectivityStatus status={status}/></h3>
                        </div>
                </Link>
                    </header>
                </DashboardCard>
            )
        }) : null;
        let configAgentAccounts = (this.props['config-agent'].length > 0) ? this.props['config-agent'].map(function(account, index) {
            let status = null;
            if (account['connection-status']) {
                status = account['connection-status'].status;
            }
            return (
                <DashboardCard key={index} className='pool-card accountSidebarCard'>
                <header>
                    <Link to={'accounts/config-agent/' + encodeURIComponent(account.name)} title="Edit Account">
                        <div className="accountSidebarCard--content">
                            <img className="accountSidebarCard--logo" src={store.getImage(account['account-type'])} />
                            <h3 title="Edit Account">
                                <span className="accountSidebarCard--name" title={account.name}>{account.name}</span>
                                <AccountConnectivityStatus status={status}/>
                            </h3>
                        </div>
                    </Link>
                </header>
                </DashboardCard>
            )
        }) : null;
        html = (
            <div className='accountSidebar'>
                {
                    self.props.readonly ? null :
                        <Button className="refreshList light" onClick={this.props.store.refreshAll.bind(this, AccountData)} label={this.props.refreshingAll ? 'Checking Connectivity Status...' : refreshStatus}/>
                }
                 <div>
                        <h1>RO Accounts</h1>
                        {resourceOrchestrators}
                        {
                            !self.props.readonly ?
                                <DashboardCard className="accountSidebarCard">
                                    <Link
                                        to={{pathname: '/accounts/resource-orchestrator/create'}}
                                        title="Create Resource Orchestrator(RO) Account"
                                        className={'accountSidebarCard_create'}
                                        onClick={self.props.actions.handleCancelAccount} >
                                            Add RO Account
                                            <img src={require("style/img/launchpad-add-fleet-icon.png")}/>
                                    </Link>
                                </DashboardCard>
                            :  <div style={{margin:'1rem'}}></div>
                        }
                    </div>
                {props.showVIM ? (
                    <div>
                        <h1>VIM Accounts</h1>
                        {cloudAccounts}
                        {
                            !self.props.readonly ?
                                <DashboardCard className="accountSidebarCard">
                                    <Link
                                        to={{pathname: '/accounts/cloud/create'}}
                                        title="Create Cloud Account"
                                        className={'accountSidebarCard_create'}
                                        onClick={self.props.actions.handleCancelAccount} >
                                            Add VIM Account
                                            <img src={require("style/img/launchpad-add-fleet-icon.png")}/>
                                    </Link>
                                </DashboardCard>
                            :  <div style={{margin:'1rem'}}></div>
                        }
                    </div>)
                : null}
                <h1>SDN Accounts</h1>
                {sdnAccounts}
                {
                    !self.props.readonly ?
                        <DashboardCard className="accountSidebarCard">
                            <Link
                            to={{pathname: '/accounts/sdn/create'}}
                            title="Create Sdn Account"
                            className={'accountSidebarCard_create'}
                            onClick={self.props.actions.handleCancelAccount}>
                                Add SDN Account
                                <img src={require("style/img/launchpad-add-fleet-icon.png")}/>
                            </Link>

                        </DashboardCard>
                    : <div style={{margin:'1rem'}}></div>
                }
                <h1>Config Agent Accounts</h1>
                {configAgentAccounts}
                {
                    !self.props.readonly ?
                        <DashboardCard className="accountSidebarCard">
                            <Link
                                to={{pathname: '/accounts/config-agent/create'}}
                                title="Create Config Agent Account"
                                className={'accountSidebarCard_create'}
                                onClick={self.props.actions.handleCancelAccount}
                            >
                                Add Config Agent Account
                                <img src={require("style/img/launchpad-add-fleet-icon.png")}/>
                            </Link>
                        </DashboardCard>
                    :  <div style={{margin:'1rem'}}></div>
                }
            </div>
                );
        return html;
    }
}

AccountSidebar.defaultProps = {
    cloud: [],
    sdn: [],
    'config-agent': [],
    ro: []
}


export class AccountConnectivityStatus extends React.Component {
    render(){
        return <span className={'connectivityStatus ' + 'connectivityStatus--' + this.props.status + ' ' + this.props.className} title={this.props.status}></span>
    }
}
AccountConnectivityStatus.defaultProps = {
    status: 'failed'
}

export default SkyquakeComponent(AccountSidebar);
