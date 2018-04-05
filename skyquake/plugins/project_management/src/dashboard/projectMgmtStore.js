/*
 * STANDARD_RIFT_IO_COPYRIGHT
 */
import ProjectManagementActions from './projectMgmtActions.js';
import ProjectManagementSource from './projectMgmtSource.js';
import ROLES from 'utils/roleConstants.js';
import _ from 'lodash';
export default class ProjectManagementStore {
    constructor() {
        this.actions = ProjectManagementActions(this.alt);
        this.bindActions(this.actions);
        this.registerAsync(ProjectManagementSource);
        this.projects = [];
        this['name'] = '';
        this['description'] = 'Some Description';
        this.projectUsers = [];
        this.selectedUser = null;
        this.selectedDomain = null;
        this.selectedRole = null;
        this.roles = Object.keys(ROLES.PROJECT).filter((p) => {
            return p != "TYPE";
        }).map((p) => {
            return ROLES.PROJECT[p];
        })
        // this.roles = ['rw-project:project-admin', 'rw-project:project-oper', 'rw-project:project-create'];
        this.users = [];
        this.domains = [];
        this.activeIndex = null;
        this.isReadOnly = true;
        this.projectOpen = false;
        this.hideColumns = false;
        this.isEdit = false;
        this.isEditProject = true;
        // this.exportPublicMethods({})
    }
    /**
     * [handleFieldUpdate description]
     * @param  {Object} data {
     *                       [store_property] : [value]
     * }
     * @return {[type]}      [description]
     */
    handleUpdateInput(data) {
        this.setState(data);
    }
    handleAddProjectItem(item) {
        let projectRoles = this.projectRoles;
        projectRoles.push('');
        this.setState({projectRoles});
    }
    handleRemoveProjectItem(i) {
        let projectRoles = this.projectRoles;
        projectRoles.splice(i, 1);
        console.log('Removing', projectRoles)
        this.setState({projectRoles});
    }
    handleUpdateProjectRole(data) {
        let i = data[0];
        let e = data[1];
        let projectRoles = this.projectRoles
        projectRoles[i] = JSON.parse(e.currentTarget.value);
        this.setState({
            projectRoles
        });
    }
    viewProject() {
        let data = arguments[0];
        let project = data[0];
        let projectIndex = data[1];
        let isReadOnly = data[2];

        let ProjectData = {
            'name': project['name'],
            'description': project['description'],
            'projectUsers': (project['project-config'] && project['project-config']['user'] || [])
        }
        let state = _.merge({
            activeIndex: projectIndex,
            projectOpen: true,
            isEdit: true,
            isReadOnly: isReadOnly,
            isEditProject: isReadOnly
        }, ProjectData);
        this.setState(state)
    }
    editProject(isReadOnly) {
        this.viewProject([this.projects[this.activeIndex], this.activeIndex, isReadOnly]);

    }
    handleCloseProjectPanel() {
        this.setState({
            projectOpen: false,
            isEdit: false,
            isReadOnly: true
        })
    }
    handleHideColumns(e) {
        if(this.projectOpen && e.currentTarget.classList.contains('hideColumns')) {
            this.setState({
                hideColumns: true
            })
        } else {
            this.setState({
                hideColumns: false
            })
        }
    }
    handleDisabledChange(isDisabled){
        this.setState({
            disabled: isDisabled
        })
    }
    handlePlatformRoleUpdate(data){
        let platform_role = data[0];
        let checked = data[1];
        let platformRoles = this.platformRoles;
        platformRoles[platform_role] = checked;
        this.setState({
            platformRoles
        })
    }
    handleSelectedUser(event) {
        this.setState({
            selectedUser: JSON.parse(event.currentTarget.value)
        })
    }

    handleSelectedRole(event) {
        this.setState({
            selectedRole: JSON.parse(event.currentTarget.value)
        })
    }
    resetProject() {
        let name = '';
        let description = '';
        return {
            'name' : name,
            'description' : description
        }
    }
    handleAddProject() {
        this.setState(_.merge( this.resetProject() ,
              {
                isEdit: false,
                projectOpen: true,
                activeIndex: null,
                isEditProject: true,
                isReadOnly: false,
                projectUsers: []
            }
        ))
    }

    handleUpdateSelectedUser(user) {
        this.setState({
            selectedUser: JSON.parse(user)
        });
    }

    handleSelectedDomain(event) {
        let domain = JSON.parse(event.target.value);
        this.setState({
            selectedDomain: domain
        });
    }
    handleAddUser(e) {
        let self = this;
        let u = JSON.parse(this.selectedUser);
        let r = this.selectedRole;
        let projectUsers = this.projectUsers;
        console.log('adding user')
        projectUsers.push({
          'user-name': u['user-name'],
          'user-domain': u['user-domain'],
          "role":[{
                      "role": r,
                      "keys": self.name
            }
          ]
        })
        this.setState({projectUsers, selectedUser: JSON.stringify(null)})
    }
    handleToggleUserRoleInProject(data) {
        let self = this;
        let {userIndex, roleIndex, checked} = data;
        let projectUsers = this.projectUsers;
        let selectedRole = self.roles[roleIndex];
        let roleType = (ROLES.PROJECT.TYPE[selectedRole] == 'rw-project-mano') ? "rw-project-mano:mano-role" : "role";
        //
        if(checked) {
            if (!projectUsers[userIndex][roleType]) {
                projectUsers[userIndex][roleType] = [];
            }
            projectUsers[userIndex][roleType].push({
                role: self.roles[roleIndex]
            })
        } else {
            let role = projectUsers[userIndex][roleType];
            let roleIndex = _.findIndex(role, {role:selectedRole})
            projectUsers[userIndex][roleType].splice(roleIndex, 1)
        }
       self.setState({projectUsers});

    }
    handleUpdateUserRoleInProject(data) {
        let {userIndex, roleIndex, value} = data;
        let projectUsers = this.projectUsers;
        projectUsers[userIndex].role[roleIndex].role = value;

    }
    addRoleToUserInProject(userIndex) {
        let projectUsers = this.projectUsers;
        if(!projectUsers[userIndex].role) {
            projectUsers[userIndex].role = [];
        }
        projectUsers[userIndex].role.push({
              'role': null
            });
        this.setState({
            projectUsers
        })
    }
    handleRemoveRoleFromUserInProject (data) {
        let {userIndex, roleIndex} = data;
        let projectUsers = this.projectUsers;
        projectUsers[userIndex].role.splice(roleIndex, 1);
        this.setState({
            projectUsers
        })
    }
    handleRemoveUserFromProject (userIndex) {
        let projectUsers = this.projectUsers;
        projectUsers.splice(userIndex, 1);
        this.setState({
            projectUsers
        })
    }
    getProjectsSuccess(projects) {
        this.alt.actions.global.hideScreenLoader.defer();
        this.setState({projects: projects});
    }
    getUsersSuccess(users) {
        console.log(users)
        this.alt.actions.global.hideScreenLoader.defer();
        let domains =  users && users.reduce(function(arr, u) {
            if (arr.indexOf(u['user-domain']) == -1) {
                arr.push(u['user-domain']);
                return arr;
            } else {
                return arr
            }
        }, []);
        this.setState({users, domains, selectedDomain: domains[0]});
    }
    updateProjectSuccess() {
        this.alt.actions.global.hideScreenLoader.defer();
        let self = this;
        let projects = this.projects || [];
        projects[this.activeIndex] = {
            'name': this['name'],
            'description': this['description'],
            'project-config': {
                'user': self.projectUsers
            }
        }
        this.setState({
            projects,
            isEdit: true,
            isReadOnly: true
        });
    }
    deleteProjectSuccess() {
        this.alt.actions.global.hideScreenLoader.defer();
        let projects = this.projects;
        projects.splice(this.activeIndex, 1);
        this.setState({projects, projectOpen: false,isEdit: true,
            isReadOnly: false,})
    }
    createProjectSuccess() {
        let self = this;
        this.alt.actions.global.hideScreenLoader.defer();
        let projects = this.projects || [];
        projects.push({
            'name': self['name'],
            'description': self['description'],
            'project-config': {
                'user': self.projectUsers
            }
         });
        let newState = {
            projects,
            isEdit: true,
            isReadOnly: true,
            activeIndex: projects.length - 1
        };
        _.merge(newState)
        this.setState(newState);
    }
}
