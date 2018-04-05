/*
 * STANDARD_RIFT_IO_COPYRIGHT
 */

import React from 'react';
import ReactDOM from 'react-dom';
import AppHeader from 'widgets/header/header.jsx';
import PlatformRoleManagementStore from './platformRoleManagementStore.js';
import SkyquakeComponent from 'widgets/skyquake_container/skyquakeComponent.jsx';
import 'style/layout.scss';
import './platformRoleManagement.scss';
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

class PlatformRoleManagement extends React.Component {
    constructor(props) {
        super(props);
        this.Store = this.props.flux.stores.hasOwnProperty('PlatformRoleManagementStore') ? this.props.flux.stores.PlatformRoleManagementStore : this.props.flux.createStore(PlatformRoleManagementStore,'PlatformRoleManagementStore');
        this.state = this.Store.getState();
        this.actions = this.state.actions;
        this.Store.getPlatform();
        this.Store.getUsers();
    }
    componentDidUpdate() {

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
            [property]:e.target.value
        })
    }
    disabledChange = (e) => {
        this.actions.handleDisabledChange(e.target.checked);
    }
    platformChange = (platformRole, e) => {
        this.actions.handlePlatformRoleUpdate(platformRole, e.currentTarget.checked);
    }
    editProject = () => {
        this.actions.editPlatform(false);
    }
    cancelEditPlatform = () => {
        this.actions.editPlatform(true)
    }
    closePanel = () => {
        this.actions.handleCloseProjectPanel();
    }
    updatePlatform = (e) => {
        let self = this;
        e.preventDefault();
        e.stopPropagation();
        let platformUsers = self.state.platformUsers;
        let cleanUsers = this.cleanUsers(platformUsers);
        this.Store.updatePlatform({
                'user': JSON.stringify(cleanUsers)
            }
        );
    }
     cleanUsers(platformUsers) {
        let self = this;
        let cleanUsers = [];
        //Remove null values from role
        platformUsers.map((u) => {
            let cleanRoles = [];
            u.role && u.role.map((r,i) => {
                let role = {};
                //Platform user can not change role of itself.
                if(r.role){
                    //removing key for rbac-platform
                    delete r.keys;
                    cleanRoles.push(r)
                }
            });
           u.role = cleanRoles;
           // if (u['user-name'] != self.context.userProfile.userId) {
                cleanUsers.push(u);
           // }
        });
        return cleanUsers;
    }
     evaluateSubmit = (e) => {
        if (e.keyCode == 13) {
            if (this.props.isEdit) {
                this.updatePlatform(e);
            }
            e.preventDefault();
            e.stopPropagation();
        }
    }
    updateSelectedUser = (e) => {
        this.setState({
            selected
        })
    }
    addUserToProject = (e) => {
        this.actions.handleAddUser();
    }
    removeUserFromProject = (userIndex, e) => {
        this.actions.handleRemoveUserFromProject(userIndex);
    }
    updateUserRoleInProject = (userIndex, roleIndex, e) => {
        this.actions.handleUpdateUserRoleInProject({
            userIndex,
            roleIndex,
            value: JSON.parse(e.target.value)
        })
    }
    toggleUserRoleInProject = (userIndex, roleIndex, e) => {
        this.actions.handleToggleUserRoleInProject({
            userIndex,
            roleIndex,
            checked: JSON.parse(e.currentTarget.checked)
        })
    }
    removeRoleFromUserInProject = (userIndex, roleIndex, e) => {
        this.actions.handleRemoveRoleFromUserInProject({
            userIndex,
            roleIndex
        })
    }
    addRoleToUserInProject = (userIndex, e) => {
        this.actions.addRoleToUserInProject(userIndex);
    }
    onTransitionEnd = (e) => {
        this.actions.handleHideColumns(e);
        console.log('transition end')
    }
    disableChange = (e) => {
        let value = e.target.value;
        value = value.toUpperCase();
        if (value=="TRUE") {
            value = true;
        } else {
            value = false;
        }
        console.log(value)
    }
    render() {
        let self = this;
        let html;
        let props = this.props;
        let state = this.state;
        let passwordSectionHTML = null;
        let formButtonsHTML = (
            <ButtonGroup className="buttonGroup">
                <Button label="EDIT" type="submit" onClick={this.editProject} />
            </ButtonGroup>
        );
        let platformUsers = self.state.platformUsers;
        let availableDomains = state.domains;
        let availableUsers = state.users && state.users.filter((u) => {
            return state.selectedDomain == u['user-domain'] && _.findIndex(platformUsers, (s) => {return (s['user-name'] == u['user-name']) && (u['user-domain'] == s['user-domain'])}) == -1
        }).map((u) => {
            return {
                label: `${u['user-name']}`,
                value: u
            }
        });


        if(!this.state.isReadOnly) {
            formButtonsHTML = (
                                state.isEdit ?
                                (
                                    <ButtonGroup className="buttonGroup">
                                        <Button label="Update" type="submit" onClick={this.updatePlatform} />
                                        <Button label="Cancel" onClick={this.cancelEditPlatform} />
                                    </ButtonGroup>
                                )
                                : (
                                    <ButtonGroup className="buttonGroup">
                                        <Button label="Edit" type="submit" onClick={this.updatePlatform}  />
                                    </ButtonGroup>
                                )
                            )
        }

        html = (
            <PanelWrapper column>
                <AppHeader nav={[{name: 'USER MANAGEMENT', onClick: this.context.router.push.bind(this, {pathname: '/'})}, {name: 'PLATFORM ROLE MANAGEMENT'}]}/>
                <PanelWrapper className={`row projectManagement ${false ? 'projectList-open' : ''}`} style={{'alignContent': 'center', 'flexDirection': 'row'}} >
                    <PanelWrapper onKeyUp={this.evaluateSubmit}
                        className={`ProjectAdmin column`}>
                        <Panel
                            title="Manage Roles"
                            style={{marginBottom: 0}}
                            no-corners>
                            <FormSection title="USER ROLES">

                            <table>
                                <thead>
                                    <tr>
                                        <td>Domain</td>
                                        <td>User Name</td>
                                        {
                                            state.roles.map((r,i) => {
                                                return <td key={i}>{r}</td>
                                            })
                                        }
                                    </tr>
                                </thead>
                                <tbody>
                                    {
                                state.platformUsers.map((u,i)=> {
                                    let userRoles = u.role && u.role.map((r) => {
                                        return r.role;
                                    }) || [];
                                    return (
                                        <tr key={i}>
                                            <td>
                                                {u['user-domain']}
                                            </td>
                                            <td>
                                                {u['user-name']}
                                            </td>
                                            {
                                                state.roles.map((r,j) => {
                                                    return <td key={j}><Input readonly={state.isReadOnly} type="checkbox" onChange={self.toggleUserRoleInProject.bind(self, i, j)} checked={(userRoles.indexOf(r) > -1)} /></td>
                                                })
                                            }
                                             {!state.isReadOnly ? <td><span
                                                                        className="removeInput"
                                                                        onClick={self.removeUserFromProject.bind(self, i)}
                                                                    >
                                                                        <img src={imgRemove} />

                                                                    </span></td> : null}
                                        </tr>
                                    )
                                })
                            }
                                </tbody>
                            </table>
                                {
                                    !state.isReadOnly ?
                                        <div className="tableRow tableRow--header">
                                            <div>
                                                <div className="addUser">
                                                    {
                                                        availableDomains.length == 1 ?
                                                            <SelectOption
                                                                label="Domain"
                                                                onChange={this.actions.handleSelectedDomain}
                                                                defaultValue={state.selectedDomain || availableDomains[0]}
                                                                initial={false}
                                                                readonly={true}
                                                                options={availableDomains}
                                                                ref={(el) => self.selectUserList = el}
                                                            /> :
                                                            <SelectOption
                                                                label="Domain"
                                                                onChange={this.actions.handleSelectedDomain}
                                                                value={state.selectedDomain || availableDomains[0]}
                                                                initial={false}
                                                                options={availableDomains}
                                                                ref={(el) => self.selectUserList = el}
                                                            />
                                                    }
                                                    {
                                                        availableUsers.length ?
                                                            <SelectOption
                                                                label="Username"
                                                                onChange={this.actions.handleSelectedUser}
                                                                value={state.selectedUser}
                                                                initial={true}
                                                                options={availableUsers}
                                                                ref={(el) => self.selectUserList = el}
                                                            /> :
                                                            <label className="noUsersAvailable">
                                                            <span>Username</span>
                                                            <span style={{display: 'block',
        marginTop: '0.8rem', color: '#666'}}>No Available Users for this Domain</span></label>
                                                    }
                                                    {
                                                        availableUsers.length ?
                                                            <span className="addInput" onClick={this.addUserToProject}><img src={imgAdd} />
                                                                Add User
                                                            </span> :
                                                            null
                                                    }

                                                </div>
                                            </div>
                                        </div> : null
                                }

                            </FormSection>
                        </Panel>
                        {formButtonsHTML}
                    </PanelWrapper>
                </PanelWrapper>
            </PanelWrapper>
        );
        return html;
    }
}
// onClick={this.Store.update.bind(null, Account)}
PlatformRoleManagement.contextTypes = {
    router: React.PropTypes.object,
    userProfile: React.PropTypes.object
};

PlatformRoleManagement.defaultProps = {
    projectList: [],
    selectedProject: {}
}

export default SkyquakeComponent(PlatformRoleManagement);


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




