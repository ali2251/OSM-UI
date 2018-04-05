/*
 * STANDARD_RIFT_IO_COPYRIGHT
 */

import React from 'react';
import ReactDOM from 'react-dom';
import AppHeader from 'widgets/header/header.jsx';
import UserProfileStore from './userProfileStore.js';
import SkyquakeComponent from 'widgets/skyquake_container/skyquakeComponent.jsx';
import 'style/layout.scss';
import '../dashboard/userMgmt.scss';
import { Panel, PanelWrapper } from 'widgets/panel/panel';


import TextInput from 'widgets/form_controls/textInput.jsx';
import Input from 'widgets/form_controls/input.jsx';
import Button, { ButtonGroup } from 'widgets/button/sq-button.jsx';
import SelectOption from 'widgets/form_controls/selectOption.jsx';
import 'widgets/form_controls/formControls.scss';
import imgAdd from '../../node_modules/open-iconic/svg/plus.svg'
import imgRemove from '../../node_modules/open-iconic/svg/trash.svg';

class UserProfileDashboard extends React.Component {
    constructor(props) {
        super(props);
        this.Store = this.props.flux.stores.hasOwnProperty('UserProfileStore') ? this.props.flux.stores.UserProfileStore : this.props.flux.createStore(UserProfileStore);
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
    disabledChange = (e) => {
        this.actions.handleDisabledChange(e.target.checked);
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
    osePanel = () => {
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
        this.Store.deleteUser({
            'user-name': this.state['user-name'],
            'user-domain': this.state['user-domain']
        });
    }
    createUser = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.state['new-password'] != this.state['confirm-password']) {
            this.props.actions.showNotification('Passwords do not match')
        } else {
            this.Store.createUser({
                'user-name': this.state['user-name'],
                'user-domain': this.state['user-domain'],
                'password': this.state['new-password']
                // 'confirm-password': this.state['confirm-password']
            });
        }
    }
    updateUser = (e) => {
        let self = this;
        e.preventDefault();
        e.stopPropagation();
        let validatedPasswords = validatePasswordFields(this.state);
        if (validatedPasswords) {
            this.Store.updateUser(_.merge({
                'user-name': this.context.userProfile.userId,
                'user-domain': this.state['user-domain'],
                'password': this.state['new-password'],
                'ui-state': this.context.userProfile.data['ui-state']
            }));
        }
        function validatePasswordFields(state) {
            let newOne = state['new-password'];
            let confirmOne = state['confirm-password'];
            if (!newOne || !confirmOne) {
                self.props.actions.showNotification('Please fill in all fields.');
                return false;
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
        if (value == "TRUE") {
            value = true;
        } else {
            value = false;
        }
        console.log(value)
    }
    render() {

        let self = this;
        const User = this.context.userProfile || {};
        let html;
        let props = this.props;
        let state = this.state;
        let passwordSectionHTML = null;
        let formButtonsHTML = (
            <ButtonGroup className="buttonGroup">
                <Button label="EDIT" type="submit" onClick={this.editUser} />
            </ButtonGroup>
        );
        passwordSectionHTML = (
            (
                <FormSection title="PASSWORD CHANGE">
                    <Input label="NEW PASSWORD" type="password" value={state['new-password']} onChange={this.updateInput.bind(null, 'new-password')} />
                    <Input label="REPEAT NEW PASSWORD" type="password" value={state['confirm-password']} onChange={this.updateInput.bind(null, 'confirm-password')} />
                </FormSection>
            )
        );
        formButtonsHTML = (
            <ButtonGroup className="buttonGroup">
                <Button label="Update" type="submit" onClick={this.updateUser} />
            </ButtonGroup>
        )

        html = (
            <PanelWrapper column>
                <PanelWrapper className={`row userManagement ${!this.state.userOpen ? 'userList-open' : ''}`} style={{ 'flexDirection': 'row' }} >
                    <PanelWrapper ref={(div) => { this.UserList = div }} className={`column userList expanded hideColumns`}>
                        <Panel title={User.userId} style={{ marginBottom: 0 }} no-corners>
                            <FormSection title="USER INFO">
                                <table className="userProfile-table">
                                    <thead>
                                        <tr>
                                            <td>Project</td>
                                            <td>Role</td>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {
                                            User.data && User.data.projectId && User.data.projectId.map((p, i) => {
                                                let project = User.data.project[p];
                                                let projectConfig = project && project.data['project-config'];
                                                let userRoles = [];
                                                return (
                                                    <tr key={i}>
                                                        <td>
                                                            {p}
                                                        </td>
                                                        <td>
                                                            {
                                                                project && Object.keys(project.role).map(function (k, i) {
                                                                    return <div key={i}>{k}</div>
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
                            {passwordSectionHTML}

                        </Panel>
                        <div className="buttonSection">
                            {formButtonsHTML}
                        </div>
                    </PanelWrapper>

                </PanelWrapper>
            </PanelWrapper>
        );
        return html;
    }
}
// onClick={this.Store.update.bind(null, Account)}
UserProfileDashboard.contextTypes = {
    router: React.PropTypes.object,
    userProfile: React.PropTypes.object
};

UserProfileDashboard.defaultProps = {
    userList: [],
    selectedUser: {}
}

export default SkyquakeComponent(UserProfileDashboard);


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
