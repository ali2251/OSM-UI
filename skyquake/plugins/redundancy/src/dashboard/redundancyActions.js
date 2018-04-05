/*
 * STANDARD_RIFT_IO_COPYRIGHT
 */
module.exports = function(Alt) {
   return Alt.generateActions(
                                       'handleUpdateInput',
                                       'handleAddSiteItem',
                                       'handleRemoveSiteItem',
                                       'handleUpdateSiteRole',
                                       'handleUpdateConfigInput',
                                       'viewSite',
                                       'editSite',
                                       'handleCloseSitePanel',
                                       'handleHideColumns',
                                       'handleSelectedUser',
                                       'handleSelectedRole',
                                       'handleAddUser',
                                       'handleRemoveUserFromSite',
                                       'getSitesSuccess',
                                       'getRedundancySuccess',
                                       'getSitesNotification',
                                       'handleDisabledChange',
                                       'handlePlatformRoleUpdate',
                                       'handleAddSite',
                                       'handleCreateSite',
                                       'handleUpdateSite',
                                       'handleAddTargetEndpoint',
                                       'handleRemoveTargetEndpoint',
                                       'handleAddInstance',
                                       'handleRemoveInstance',
                                       'handleFailOverDecisionChange',
                                       'openRedundancyStateSocketSuccess',
                                       'updateSiteSuccess',
                                       'createSiteSuccess',
                                       'deleteSiteSuccess',
                                       'updateConfigSuccess'
                                       );
}
