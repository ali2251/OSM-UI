/*
 * STANDARD_RIFT_IO_COPYRIGHT
 */

import React from 'react';
import ReactDOM from 'react-dom';
import AppHeader from 'widgets/header/header.jsx';
import UserManagementStore from './userMgmtStore.js';
import SkyquakeComponent from 'widgets/skyquake_container/skyquakeComponent.jsx';
import 'style/layout.scss';
import './userMgmt.scss';
import { Panel, PanelWrapper } from 'widgets/panel/panel';
import SkyquakeRBAC from 'widgets/skyquake_rbac/skyquakeRBAC.jsx';

import TextInput from 'widgets/form_controls/textInput.jsx';
import Input from 'widgets/form_controls/input.jsx';
import Button, { ButtonGroup } from 'widgets/button/sq-button.jsx';
import SelectOption from 'widgets/form_controls/selectOption.jsx';
import 'widgets/form_controls/formControls.scss';
import imgAdd from '../../node_modules/open-iconic/svg/plus.svg'
import imgRemove from '../../node_modules/open-iconic/svg/trash.svg';
import { merge } from 'lodash';

import ROLES from 'utils/roleConstants.js';
const PLATFORM = ROLES.PLATFORM;

class UserManagementDashboard extends React.Component {
    constructor(props) {
        super(props);
        this.Store = this.props.flux.stores.hasOwnProperty('UserManagementStore') ? this.props.flux.stores.UserManagementStore : this.props.flux.createStore(UserManagementStore, 'UserManagementStore');
        this.state = this.Store.getState();
        this.actions = this.state.actions;
    }
    componentDidUpdate() {
        let self = this;
        ReactDOM.findDOMNode(this.UserList).addEventListener('transitionend', this.onTransitionEnd, false);
        setTimeout(function () {
            let element = self[`user-ref-${self.state.activeIndex}`]
            element && !isElementInView(element) && element.scrollIntoView({ block: 'end', behavior: 'smooth' });
        })
    }
    componentWillMount() {
        this.Store.listen(this.updateState);
        this.Store.getUsers();
    }
    componentWillUnmount() {
        this.Store.unlisten(this.updateState);
    }
    updateState = (state) => {
        this.setState(state);
    }
    updateInput = (key, e) => {
        let property = key;
        this.actions.handleUpdateInput({
            [property]: e.target.value
        })
    }
    platformChange = (platformRole, e) => {
        this.actions.handlePlatformRoleUpdate(platformRole, e.currentTarget.checked);
    }
    addProjectRole = (e) => {
        this.actions.handleAddProjectItem();
    }
    removeProjectRole = (i, e) => {
        this.actions.handleRemoveProjectItem(i);
    }
    updateProjectRole = (i, e) => {
        this.actions.handleUpdateProjectRole(i, e)
    }
    addUser = () => {
        this.actions.handleAddUser();
    }
    viewUser = (un, index) => {
        this.actions.viewUser(un, index);
    }
    editUser = () => {
        this.actions.editUser(false);
    }
    cancelEditUser = () => {
        this.actions.editUser(true)
    }
    closePanel = () => {
        this.actions.handleCloseUserPanel();
    }
    // updateUser = (e) => {
    //     e.preventDefault();
    //     e.stopPropagation();

    //     this.Store.updateUser();
    // }
    deleteUser = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this user?')) {
            this.Store.deleteUser({
                'user-name': this.state['user-name'],
                'user-domain': this.state['user-domain']
            });
        }

    }
    createUser = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!this.state['user-name'] || (this.state['user-name'].trim() == "")) {
            this.props.actions.showNotification('Please enter a valid username');
            return;
        }

        if((this.state['user-domain'].toLowerCase() == 'system') && !this.state['new-password'] || (this.state['new-password'].trim == "")) {
            this.props.actions.showNotification('You must enter a password');
            return;
        }
        if((this.state['user-domain'].toLowerCase() == 'system') && this.state['new-password'] != this.state['confirm-password']) {
            this.props.actions.showNotification('Passwords do not match');
            return;
        } else {
            let isDisabled = {};
            if (this.state.disabled == "TRUE") {
                isDisabled = {
                    disabled: [null]
                }
            }
            this.Store.createUser(_.merge({
                'user-name': this.state['user-name'],
                'user-domain': this.state['user-domain'],
                'password': this.state['new-password'],
                // 'confirm-password': this.state['confirm-password']
            }, isDisabled));
        }
    }
    updateUser = (e) => {
        let self = this;
        e.preventDefault();
        e.stopPropagation();
        let validatedPasswords = validatePasswordFields(this.state);
        if (validatedPasswords) {
            let isDisabled = {};
            let password = {};
            if (self.state.disabled == "TRUE") {
                isDisabled = {
                    disabled: [null]
                }
            }
            if (this.state['new-password'] != '') {
                password = { 'password': this.state['new-password'] }
            } else {
                password = {
                    'password': this.state.currentPassword
                }
            }
            this.Store.updateUser(_.merge({
                'user-name': this.state['user-name'],
                'user-domain': this.state['user-domain'],
                'ui-state': this.context.userProfile.data['ui-state']
            }, _.merge(isDisabled, password)));
        }
        function validatePasswordFields(state) {
            let newOne = state['new-password'];
            let confirmOne = state['confirm-password'];
            if (!newOne && !confirmOne) {
                // self.props.actions.showNotification('Please fill in all fields.');
                return true;
            }
            if (newOne != confirmOne) {
                self.props.actions.showNotification('Passwords do not match');
                return false;
            }
            return {
                'new-password': newOne,
                'confirm-password': confirmOne
            }
        }
    }
    evaluateSubmit = (e) => {
        if (e.keyCode == 13) {
            if (this.state.isEdit) {
                this.updateUser(e);
            } else {
                this.createUser(e);
            }
            e.preventDefault();
            e.stopPropagation();
        }
    }
    onTransitionEnd = (e) => {
        this.actions.handleHideColumns(e);
        console.log('transition end')
    }
    disableChange = (e) => {
        let value = e.target.value;
        value = value.toUpperCase();
        this.actions.handleDisabledChange(value);
    }
    render() {
        let self = this;
        let html;
        let props = this.props;
        let state = this.state;
        let passwordSectionHTML = null;
        let formButtonsHTML = (
            <ButtonGroup className="buttonGroup">
                <Button label="EDIT" type="submit" onClick={this.editUser} />
            </ButtonGroup>
        );
        if(!this.state.isReadOnly) {
            passwordSectionHTML = (state['user-domain'].toLowerCase() == 'system') ?
                ( this.state.isEdit ?
                    (
                        <FormSection title="PASSWORD CHANGE">
                            <Input label="NEW PASSWORD" type="password" value={state['new-password']}  onChange={this.updateInput.bind(null, 'new-password')}/>
                            <Input label="REPEAT NEW PASSWORD" type="password"  value={state['confirm-password']}  onChange={this.updateInput.bind(null, 'confirm-password')}/>
                        </FormSection>
                    ) :
                    (
                        <FormSection title="CREATE PASSWORD">
                            <Input label="CREATE PASSWORD" type="password" value={state.newPassword}  onChange={this.updateInput.bind(null, 'new-password')}/>
                            <Input label="REPEAT PASSWORD" type="password"  value={state.repeatNewPassword}  onChange={this.updateInput.bind(null, 'confirm-password')}/>
                        </FormSection>
                    )
                )
                : null;
            formButtonsHTML = (
                state.isEdit ?
                    (
                        <ButtonGroup className="buttonGroup">
                            <Button label="Delete" onClick={this.deleteUser} />
                            <Button label="Cancel" onClick={this.cancelEditUser} />
                            <Button label="Update" type="submit" onClick={this.updateUser} />
                        </ButtonGroup>
                    )
                    : (
                        <ButtonGroup className="buttonGroup">
                            <Button label="Cancel" onClick={this.closePanel} />
                            <Button label="Create" type="submit" onClick={this.createUser} />
                        </ButtonGroup>
                    )
            )
        }
        html = (
            <PanelWrapper column>
                <SkyquakeRBAC allow={[PLATFORM.SUPER, PLATFORM.ADMIN]} >
                    <AppHeader nav={[{ name: 'USER MANAGEMENT' }, { name: 'PLATFORM ROLE MANAGEMENT', onClick: this.context.router.push.bind(this, { pathname: '/platform' }) }]} />
                </SkyquakeRBAC>
                <PanelWrapper className={`row userManagement ${!this.state.userOpen ? 'userList-open' : ''}`} style={{ 'flexDirection': 'row' }} >
                    <PanelWrapper ref={(div) => { this.UserList = div }} className={`column userList expanded ${this.state.userOpen ? 'collapsed ' : ' '} ${this.state.hideColumns ? 'hideColumns ' : ' '}`}>
                        <Panel title="User List" style={{ marginBottom: 0 }} no-corners>
                            <div className="tableRow tableRow--header">
                                <div className="userName">
                                    Username
                                </div>
                                <div>
                                    Domain
                                </div>
                                <div>
                                    Status
                                </div>
                            </div>
                            {state.users && state.users.map((u, k) => {
                                let platformRoles = [];
                                for (let role in u.platformRoles) {
                                    platformRoles.push(<div>{`${role}: ${u.platformRoles[role]}`}</div>)
                                }
                                return (
                                    <div ref={(el) => this[`user-ref-${k}`] = el} className={`tableRow tableRow--data ${((self.state.activeIndex == k) && self.state.userOpen) ? 'tableRow--data-active' : ''}`}
                                        key={k}
                                        onClick={self.viewUser.bind(null, u, k)}>
                                        <div
                                            className={`userName userName-header ${((self.state.activeIndex == k) && self.state.userOpen) ? 'activeUser' : ''}`}
                                        >
                                            {u['user-name']}
                                        </div>
                                        <div>
                                            {u['user-domain']}
                                        </div>
                                        <div>
                                            {u['disabled'] ? "DISABLED" : "ENABLED"}
                                        </div>
                                    </div>
                                )
                            })}
                        </Panel>
                        <SkyquakeRBAC allow={[PLATFORM.SUPER, PLATFORM.ADMIN]} className="rbacButtonGroup">
                            <ButtonGroup className="buttonGroup">
                                <Button label="Add User" onClick={this.addUser} />
                            </ButtonGroup>
                        </SkyquakeRBAC>
                    </PanelWrapper>
                    <PanelWrapper onKeyUp={this.evaluateSubmit}
                        className={`userAdmin column`}>
                        <Panel
                            title={state.isEdit ? state['user-name'] : 'Create User'}
                            style={{ marginBottom: 0 }}
                            hasCloseButton={this.closePanel}
                            no-corners>
                            <FormSection title="USER INFO" className="userInfo">
                            {
                                (!state.isEditUser ||  state.isReadOnly) ?
                                <Input className="userInfo-section" readonly={state.isReadOnly || this.state.isEdit}  label="Username" value={state['user-name']} onChange={this.updateInput.bind(null, 'user-name')} />
                                : null
                            }
                                <Input className="userInfo-section" readonly={state.isReadOnly || this.state.isEdit} label="Domain" value={state['user-domain']}  onChange={this.updateInput.bind(null, 'user-domain')}></Input>
                                <Input className="userInfo-section"
                                    type="radiogroup"
                                    onChange={this.disableChange}
                                    label="STATUS"
                                    value={this.state.disabled}
                                    options={[{ label: "DISABLED", value: "TRUE" }, { label: "ENABLED", value: "FALSE" }]}
                                    readonly={state.isReadOnly}
                                    readonlydisplay={this.state.disabled == "TRUE" ? "DISABLED" : "ENABLED"}
                                />
                            </FormSection>
                            <FormSection title="PLATFORM ROLES" style={{ display: 'none' }}>
                                <Input label="Super Admin" onChange={this.platformChange.bind(null, 'super_admin')} checked={state.platformRoles.super_admin} type="checkbox" />
                                <Input label="Platform Admin" onChange={this.platformChange.bind(null, 'platform_admin')} checked={state.platformRoles.platform_admin} type="checkbox" />
                                <Input label="Platform Oper" onChange={this.platformChange.bind(null, 'platform_oper')} checked={state.platformRoles.platform_oper} type="checkbox" />
                            </FormSection>
                            {
                                state.isEdit ?
                                    <FormSection title="PROJECT ROLES">
                                        <table className="userProfile-table">
                                            <thead>
                                                <tr>
                                                    <td>Project</td>
                                                    <td>Role</td>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {
                                                    this.state.projects && this.state.projects.ids && this.state.projects.ids.map((p, i) => {
                                                        let project = self.state.projects.data[p];
                                                        let userRoles = [];
                                                        return (
                                                            <tr key={i}>
                                                                <td>
                                                                    {p}
                                                                </td>
                                                                <td>
                                                                    {
                                                                        project.map(function (k) {
                                                                            return <div>{k}</div>
                                                                        })
                                                                    }
                                                                </td>
                                                            </tr>
                                                        )
                                                    })
                                                }
                                            </tbody>
                                        </table>
                                    </FormSection>
                                    : null
                            }

                            {passwordSectionHTML}

                        </Panel>
                        <SkyquakeRBAC allow={[PLATFORM.SUPER, PLATFORM.ADMIN]} className="rbacButtonGroup">
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
UserManagementDashboard.contextTypes = {
    router: React.PropTypes.object,
    userProfile: React.PropTypes.object
};

UserManagementDashboard.defaultProps = {
    userList: [],
    selectedUser: {}
}

export default SkyquakeComponent(UserManagementDashboard);


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
        return (<div />)
    }
}

/**
 * AddItemFn:
 */
class InputCollection extends React.Component {
    constructor(props) {
        super(props);
        this.collection = props.collection;
    }
    buildTextInput(onChange, v, i) {
        return (
            <Input
                readonly={this.props.readonly}
                style={{ flex: '1 1' }}
                key={i}
                value={v}
                onChange={onChange.bind(null, i)}
            />
        )
    }
    buildSelectOption(initial, options, onChange, v, i) {
        return (
            <SelectOption
                readonly={this.props.readonly}
                key={`${i}-${v.replace(' ', '_')}`}
                intial={initial}
                defaultValue={v}
                options={options}
                onChange={onChange.bind(null, i)}
            />
        );
    }
    showInput() {

    }
    render() {
        const props = this.props;
        let inputType;
        let className = "InputCollection";
        if (props.className) {
            className = `${className} ${props.className}`;
        }
        if (props.type == 'select') {
            inputType = this.buildSelectOption.bind(this, props.initial, props.options, props.onChange);
        } else {
            inputType = this.buildTextInput.bind(this, props.onChange)
        }
        let html = (
            <div className="InputCollection-wrapper">
                {props.collection.map((v, i) => {
                    return (
                        <div key={i} className={className} >
                            {inputType(v, i)}
                            {
                                props.readonly ? null : <span onClick={props.RemoveItemFn.bind(null, i)} className="removeInput"><img src={imgRemove} />Remove</span>}
                        </div>
                    )
                })}
                {props.readonly ? null : <span onClick={props.AddItemFn} className="addInput"><img src={imgAdd} />Add</span>}
            </div>
        );
        return html;
    }
}

InputCollection.defaultProps = {
    input: Input,
    collection: [],
    onChange: function (i, e) {
        console.log(`
                        Updating with: ${e.target.value}
                        At index of: ${i}
                    `)
    },
    AddItemFn: function (e) {
        console.log(`Adding a new item to collection`)
    },
    RemoveItemFn: function (i, e) {
        console.log(`Removing item from collection at index of: ${i}`)
    }
}

class FormSection extends React.Component {
    render() {
        let className = 'FormSection ' + this.props.className;
        let html = (
            <div
                style={this.props.style}
                className={className}
            >
                <div className="FormSection-title">
                    {this.props.title}
                </div>
                <div className="FormSection-body">
                    {this.props.children}
                </div>
            </div>
        );
        return html;
    }
}

FormSection.defaultProps = {
    className: ''
}
