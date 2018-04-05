/*
 * STANDARD_RIFT_IO_COPYRIGHT
 */

import React from 'react';
import ReactDOM from 'react-dom';
import AppHeader from 'widgets/header/header.jsx';
import ProjectManagementStore from './projectMgmtStore.js';
import SkyquakeComponent from 'widgets/skyquake_container/skyquakeComponent.jsx';
import SkyquakeRBAC from 'widgets/skyquake_rbac/skyquakeRBAC.jsx';
import 'style/layout.scss';
import './projectMgmt.scss';
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
const PROJECT_ROLES = ROLES.PROJECT;
const PLATFORM = ROLES.PLATFORM;

class ProjectManagementDashboard extends React.Component {
    constructor(props) {
        super(props);
        this.Store = this.props.flux.stores.hasOwnProperty('ProjectManagementStore') ? this.props.flux.stores.ProjectManagementStore : this.props.flux.createStore(ProjectManagementStore);
        this.Store.getProjects();
        this.Store.getUsers();
        this.state = this.Store.getState();
        this.actions = this.state.actions;
    }
    componentDidUpdate() {
        let self = this;
        ReactDOM.findDOMNode(this.projectList).addEventListener('transitionend', this.onTransitionEnd, false);
        setTimeout(function() {
            let element = self[`project-ref-${self.state.activeIndex}`]
            element && !isElementInView(element) && element.scrollIntoView({block: 'end', behavior: 'smooth'});
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
            [property]:e.target.value
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
    addProject = () => {
        this.actions.handleAddProject();
    }
    viewProject = (un, index) => {
        this.actions.viewProject(un, index, true);
    }
    editProject = () => {
        this.actions.editProject(false);
    }
    cancelEditProject = () => {
        this.actions.editProject(true)
    }
    closePanel = () => {
        this.actions.handleCloseProjectPanel();
    }

    deleteProject = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this project?')) {
            this.Store.deleteProject({
                'name': this.state['name']
            });
        }
    }
    createProject = (e) => {
        let self = this;
        e.preventDefault();
        e.stopPropagation();
        let projectName = self.state['name'];
        let projectUsers = self.state.projectUsers;
        let cleanUsers = this.cleanUsers(projectUsers, projectName);


        this.Store.createProject({
            'name': projectName,
            'description': self.state.description,
            'project-config' : {
                'user': cleanUsers
            }
        });
    }
    updateProject = (e) => {
        let self = this;
        e.preventDefault();
        e.stopPropagation();
        let projectName = self.state['name'];
        let projectUsers = _.cloneDeep(self.state.projectUsers);
        let cleanUsers = this.cleanUsers(projectUsers, projectName);


        this.Store.updateProject({
            'name': projectName,
            'description': self.state.description,
            'project-config' : {
                'user': cleanUsers
            }
        });
    }
    cleanUsers(projectUsers, projectName) {
        let self = this;
        let cleanUsers = [];
        //Remove null values from role
        projectUsers.map((u) => {
            let cleanRoles = [];
            let cleanManoRoles = [];
           u.role && u.role.map((r,i) => {
             let role = {};
             //you may add a user without a role or a keys, but if one is present then the other must be as well.
            if(r.role) {
                delete r.keys;
                // r.keys = projectName;
                switch(ROLES.PROJECT.TYPE[r.role]) {
                    case 'rw-project-mano' : cleanManoRoles.push(r); break;
                    case 'rw-project' : cleanRoles.push(r); break;
                }
            }
           });
           u.role = cleanRoles;
           u["rw-project-mano:mano-role"] = u["rw-project-mano:mano-role"] || [];
           u["rw-project-mano:mano-role"] = u["rw-project-mano:mano-role"].concat(cleanManoRoles);
           //if (u['user-name'] != self.context.userProfile.userId) {
                cleanUsers.push(u);
           //}
        });
        return cleanUsers;
    }
     evaluateSubmit = (e) => {
        if (e.keyCode == 13) {
            if (this.props.isEdit) {
                this.updateProject(e);
            } else {
                this.createProject(e);
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
        let selectUserList = this.selectUserList;
        console.log(ReactDOM.findDOMNode(selectUserList))
        this.actions.handleAddUser(e);
    }
    removeUserFromProject = (userIndex, e) => {
        this.actions.handleRemoveUserFromProject(userIndex);
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
        let projectUsers = [];
        self.state.projectUsers.map((u) => {
            projectUsers.push(u);
        });
        let availableDomains = state.domains;
        let availableUsers = state.users && state.users.filter((u) => {
            return state.selectedDomain == u['user-domain'] && _.findIndex(projectUsers, (s) => {return (s['user-name'] == u['user-name']) && (u['user-domain'] == s['user-domain'])}) == -1
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
                                        <Button label="Update" type="submit" onClick={this.updateProject} />
                                        <Button label="Delete" onClick={this.deleteProject} />
                                        <Button label="Cancel" onClick={this.cancelEditProject} />
                                    </ButtonGroup>
                                )
                                : (
                                    <ButtonGroup className="buttonGroup">
                                        <Button label="Create" type="submit" onClick={this.createProject}  />
                                    </ButtonGroup>
                                )
                            )
        }

        html = (
            <PanelWrapper className={`row projectManagement ${!this.state.projectOpen ? 'projectList-open' : ''}`} style={{'alignContent': 'center', 'flexDirection': 'row'}} >
                <PanelWrapper ref={(div) => { this.projectList = div}} className={`column projectList expanded ${this.state.projectOpen ? 'collapsed ' : ' '} ${this.state.hideColumns ? 'hideColumns ' : ' '}`}>
                    <Panel title="Project List" style={{marginBottom: 0}} no-corners>
                        <div className="tableRow tableRow--header">
                            <div className="projectName">
                                Project Name
                            </div>
                            <div>
                                Description
                            </div>
                        </div>
                        {state.projects && state.projects.map((u, k) => {
                            let platformRoles = [];
                            for(let role in u.platformRoles) {
                                platformRoles.push(<div>{`${role}: ${u.platformRoles[role]}`}</div>)
                            }
                            return (
                                <div onClick={self.viewProject.bind(null, u, k)} ref={(el) => this[`project-ref-${k}`] = el} className={`tableRow tableRow--data ${((self.state.activeIndex == k) && self.state.projectOpen) ? 'tableRow--data-active' : ''}`} key={k}>
                                    <div
                                        className={`projectName projectName-header ${((self.state.activeIndex == k) && self.state.projectOpen) ? 'activeProject' : ''}`}
                                        >
                                        {u['name']}
                                    </div>
                                    <div>
                                        {u['description']}
                                    </div>


                                </div>
                            )
                        })}
                    </Panel>
                    <SkyquakeRBAC className="rbacButtonGroup">
                        <ButtonGroup  className="buttonGroup">
                            <Button label="Add Project" onClick={this.addProject} />
                        </ButtonGroup>
                    </SkyquakeRBAC>
                </PanelWrapper>
                <PanelWrapper onKeyUp={this.evaluateSubmit}
                    className={`ProjectAdmin column`}>
                    <Panel
                        title={state.isEdit ? state['name'] : 'Create Project'}
                        style={{marginBottom: 0}}
                        hasCloseButton={this.closePanel}
                        no-corners>
                        <FormSection title="PROJECT INFO">
                        {
                            (state.isEditProject ||  state.isReadOnly) ?
                                <Input readonly={state.isReadOnly || this.state.isEdit}  label="Name" value={state['name']} onChange={this.updateInput.bind(null, 'name')} />
                                : null
                            }
                            <Input readonly={state.isReadOnly} type="textarea" label="Description" value={state['description']}  onChange={this.updateInput.bind(null, 'description')}></Input>
                        </FormSection>
                        <FormSection title="USER ROLES"  className="userTable">

                        <table className="projectTable">
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
                            state.projectUsers.map((u,i)=> {
                                let userRoles = []
                                u.role && u.role.map((r) => {
                                    userRoles.push(r.role);
                                });
                                u["rw-project-mano:mano-role"] && u["rw-project-mano:mano-role"].map((r) => {
                                    userRoles.push(r.role);
                                });
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
                                        {
                                            !state.isReadOnly ? <td><span
                                                                    className="removeInput"
                                                                    onClick={self.removeUserFromProject.bind(self, i)}
                                                                >
                                                                    <img src={imgRemove} />

                                                                </span></td> : null
                                        }

                                    </tr>
                                )
                            })
                        }
                            </tbody>
                        </table>
                        <SkyquakeRBAC allow={[PLATFORM.ADMIN, PLATFORM.SUPER]} className="rbacButtonGroup" style={{marginLeft: 0}}>
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
                        </SkyquakeRBAC>
                        </FormSection>

                    </Panel>
                     <SkyquakeRBAC allow={[PROJECT_ROLES.PROJECT_ADMIN]} project={this.state.name} className="rbacButtonGroup">
                        {formButtonsHTML}
                     </SkyquakeRBAC>
                </PanelWrapper>


            </PanelWrapper>
        );
        return html;
    }
}
// onClick={this.Store.update.bind(null, Account)}
ProjectManagementDashboard.contextTypes = {
    router: React.PropTypes.object,
    userProfile: React.PropTypes.object
};

ProjectManagementDashboard.defaultProps = {
    projectList: [],
    selectedProject: {}
}

export default SkyquakeComponent(ProjectManagementDashboard);


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




