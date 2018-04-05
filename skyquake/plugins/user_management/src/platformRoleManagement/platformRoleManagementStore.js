/*
 * STANDARD_RIFT_IO_COPYRIGHT
 */
import PlatformRoleManagementActions from './platformRoleManagementActions.js';
import PlatformRoleManagementSource from './platformRoleManagementSource.js';
import _ from 'lodash';
export default class PlatformRoleManagementStore {
    constructor() {
        this.actions = PlatformRoleManagementActions(this.alt);
        this.bindActions(this.actions);
        this.registerAsync(PlatformRoleManagementSource);
        this.projects = [];
        this['name'] = '';
        this['description'] = 'Some Description';
        this.platformUsers = [];
        this.selectedUser = null;
        this.selectedRole = null;
        this.selectedDomain = null;
        this.roles = ['rw-rbac-platform:super-admin', 'rw-rbac-platform:platform-admin', 'rw-rbac-platform:platform-oper'
        // 'some_other_role', 'yet_another_role', 'operator_role', 'some_other_role', 'yet_another_role'
        ];
        this.users = [];
        this.domains = [];
        this.activeIndex = null;
        this.isReadOnly = true;
        this.projectOpen = false;
        this.hideColumns = false;
        this.isEdit = false;
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
    editPlatform(isReadOnly) {
        let state = _.merge({
            isEdit: true,
            isReadOnly: isReadOnly,
        }, {
            'platformUsers': this.cachedUsers
        });
        this.setState(state)
    }

    handleCancelEdit() {

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
                isReadOnly: false,
                platformUsers: []
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
    handleAddUser() {
        let u = JSON.parse(this.selectedUser);
        let r = this.selectedRole;
        let platformUsers = this.platformUsers;
        console.log('adding user')
        platformUsers.push({
          'user-name': u['user-name'],
          'user-domain': u['user-domain'],
          "role":[{
                      "role": r
            }
          ]
        })
        this.setState({platformUsers, selectedUser: null})
    }
    handleToggleUserRoleInProject(data) {
        let self = this;
        let {userIndex, roleIndex, checked} = data;
        let platformUsers = this.platformUsers;
        let selectedRole = self.roles[roleIndex];
        if(checked) {
            if(!platformUsers[userIndex].role) platformUsers[userIndex].role = [];
            platformUsers[userIndex].role.push({
                role: selectedRole
            })
        } else {
            let role = platformUsers[userIndex].role;
            platformUsers[userIndex].role.splice(_.findIndex(role, function(r) { return r.role == selectedRole; }), 1)
        }
       self.setState({platformUsers});

    }
    handleUpdateUserRoleInProject(data) {
        let {userIndex, roleIndex, value} = data;
        let platformUsers = this.platformUsers;
        platformUsers[userIndex].role[roleIndex].role = value;

    }
    addRoleToUserInProject(userIndex) {
        let platformUsers = this.platformUsers;
        if(!platformUsers[userIndex].role) {
            platformUsers[userIndex].role = [];
        }
        platformUsers[userIndex].role.push({
              'role': null
            });
        this.setState({
            platformUsers
        })
    }
    handleRemoveRoleFromUserInProject (data) {
        let {userIndex, roleIndex} = data;
        let platformUsers = this.platformUsers;
        platformUsers[userIndex].role.splice(roleIndex, 1);
        this.setState({
            platformUsers
        })
    }
    handleRemoveUserFromProject (userIndex) {
        let platformUsers = this.platformUsers;
        platformUsers.splice(userIndex, 1);
        this.setState({
            platformUsers
        })
    }
    getProjectsSuccess(projects) {
        this.alt.actions.global.hideScreenLoader.defer();
        this.setState({projects: projects});
    }
    getPlatformSuccess(platform) {
        this.alt.actions.global.hideScreenLoader.defer();
        let platformUsers = platform && platform.user || [];
        let state = _.merge({
            platform: platform,
            projectOpen: true,
            isEdit: true,
            isReadOnly: true,
            platformUsers: platformUsers,
            cachedUsers: platformUsers
        });
        this.setState(state)
    }
    getPlatformRoleUsersSuccess(users) {
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
    updatePlatformSuccess() {
        this.alt.actions.global.hideScreenLoader.defer();
        let platformUsers = this.platformUsers;
        this.setState({
            platformUsers,
            cachedUsers: platformUsers,
            isEdit: true,
            isReadOnly: true
        })
    }
    deleteProjectSuccess() {
        this.alt.actions.global.hideScreenLoader.defer();
        let projects = this.projects;
        projects.splice(this.activeIndex, 1);
        this.setState({projects, projectOpen: false})
    }
    createProjectSuccess() {
        this.alt.actions.global.hideScreenLoader.defer();
        let projects = this.projects || [];
        projects.push({
            'name': this['name'],
            'description': this['description']
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
