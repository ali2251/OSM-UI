/*
 * STANDARD_RIFT_IO_COPYRIGHT
 */
module.exports = function(Alt) {
   return Alt.generateActions(
                                       'handleUpdateInput',
                                       'handleAddProjectItem',
                                       'handleRemoveProjectItem',
                                       'handleUpdateProjectRole',
                                       'viewProject',
                                       'editProject',
                                       'handleCloseProjectPanel',
                                       'handleHideColumns',
                                       'handleSelectedUser',
                                       'handleSelectedRole',
                                       'handleAddUser',
                                       'handleRemoveUserFromProject',
                                       'getProjectsSuccess',
                                       'getUsersSuccess',
                                       'getProjectsNotification',
                                       'handleDisabledChange',
                                       'handlePlatformRoleUpdate',
                                       'handleAddProject',
                                       'handleCreateProject',
                                       'handleUpdateProject',
                                       'handleUpdateSelectedUser',
                                       'handleSelectedDomain',
                                       'handleUpdateUserRoleInProject',
                                       'handleToggleUserRoleInProject',
                                       'addRoleToUserInProject',
                                       'handleRemoveRoleFromUserInProject',
                                       'updateProjectSuccess',
                                       'createProjectSuccess',
                                       'deleteProjectSuccess'
                                       );
}
