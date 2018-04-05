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
                                       'editPlatform',
                                       'handleCancelEdit',
                                       'handleCloseProjectPanel',
                                       'handleHideColumns',
                                       'handleSelectedUser',
                                       'handleSelectedDomain',
                                       'handleSelectedRole',
                                       'handleAddUser',
                                       'handleRemoveUserFromProject',
                                       'getProjectsSuccess',
                                       'getPlatformSuccess',
                                       'getPlatformRoleUsersSuccess',
                                       'getProjectsNotification',
                                       'handleDisabledChange',
                                       'handlePlatformRoleUpdate',
                                       'handleAddProject',
                                       'handleCreateProject',
                                       'handleUpdateProject',
                                       'handleUpdateSelectedUser',
                                       'handleUpdateUserRoleInProject',
                                       'handleToggleUserRoleInProject',
                                       'addRoleToUserInProject',
                                       'handleRemoveRoleFromUserInProject',
                                       'updatePlatformSuccess',
                                       'createProjectSuccess',
                                       'deleteProjectSuccess'
                                       );
}
