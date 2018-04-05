/*
 * STANDARD_RIFT_IO_COPYRIGHT
 */
import RedundancyActions from './redundancyActions.js';
import RedundancySource from './redundancySource.js';
var Utils = require('utils/utils.js');
import ROLES from 'utils/roleConstants.js';
import _ from 'lodash';
export default class RedundancyStore {
    constructor() {
        this.actions = RedundancyActions(this.alt);
        this.bindActions(this.actions);
        this.registerAsync(RedundancySource);
        this.sites = [];
        this.failoverDecision = "INDIRECT";
        this.siteData = {
            'target-endpoint': [],
            'rw-instances':[{
                endpoint:[{},{}]
            }]

        };
        this.configData = {
                'polling-config' : {},
                'revertive-preference': {},
                'geographic-failover-decision': 'INDIRECT',
                'user-credentials': {
                    'username': '',
                    'password': ''
                }
        }
        this.siteIdPattern = /^((((:|[0-9a-fA-F]{0,4}):)([0-9a-fA-F]{0,4}:){0,5}((([0-9a-fA-F]{0,4}:)?(:|[0-9a-fA-F]{0,4}))|(((25[0-5]|2[0-4][0-9]|[01]?[0-9]?[0-9])\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9]?[0-9])))(%[\p{N}\p{L}]+)?)|(^([0-9]{1,3}\.){3}[0-9]{1,3}(\/([0-9]|[1-2][0-9]|3[0-2]))?$))|(((([a-zA-Z0-9_]([a-zA-Z0-9\-_]){0,61})?[a-zA-Z0-9]\.)*([a-zA-Z0-9_]([a-zA-Z0-9\-_]){0,61})?[a-zA-Z0-9]\.?)|\.)$/;
        this.siteIdValidation = [ "^([0-9]{1,3}\.){3}[0-9]{1,3}(\/([0-9]|[1-2][0-9]|3[0-2]))?$"
        , "((:|[0-9a-fA-F]{0,4}):)([0-9a-fA-F]{0,4}:){0,5}((([0-9a-fA-F]{0,4}:)?(:|[0-9a-fA-F]{0,4}))|(((25[0-5]|2[0-4][0-9]|[01]?[0-9]?[0-9])\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9]?[0-9])))(%[\p{N}\p{L}]+)?"
        , '((([a-zA-Z0-9_]([a-zA-Z0-9\-_]){0,61})?[a-zA-Z0-9]\.)*([a-zA-Z0-9_]([a-zA-Z0-9\-_]){0,61})?[a-zA-Z0-9]\.?)|\.'
        ];
        this.failOverDecisionOptions = [{ label: "INDIRECT", value: "INDIRECT" }, { label: "DIRECT", value: "DIRECT" }];
        this.status = {};
        this.activeIndex = null;
        this.isReadOnly = true;
        this.siteOpen = false;
        this.hideColumns = false;
        this.isEdit = false;
        this.isEditSite = true;
        this.exportPublicMethods({
            closeSocket: this.closeSocket
        })
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
    handleUpdateConfigInput(data) {
        let configData = this.configData;
        configData = _.merge(configData, data);
        this.setState(configData);
    }
    handleFailOverDecisionChange(failoverDecision) {
        let configData = this.configData;
        configData['geographic-failover-decision'] = failoverDecision
        delete configData['dns-ip-fqdn'];
        this.setState({configData});
    }

    viewSite() {
        let self = this;
        let data = arguments[0];
        let SiteData = data[0];
        let siteIndex = data[1];
        let isReadOnly = data[2];

        let state = _.merge({
            activeIndex: siteIndex,
            siteOpen: true,
            isEdit: true,
            isReadOnly: isReadOnly,
            isEditSite: isReadOnly,
            siteData: SiteData
        });
        this.setState(state)
    }
    editSite(isReadOnly) {
        this.viewSite([this.sites[this.activeIndex], this.activeIndex, isReadOnly]);

    }
    handleCloseSitePanel() {
        this.setState({
            siteOpen: false,
            isEdit: false,
            isReadOnly: true
        })
    }
    handleHideColumns(e) {
        if(this.siteOpen && e.currentTarget.classList.contains('hideColumns')) {
            this.setState({
                hideColumns: true
            })
        } else {
            this.setState({
                hideColumns: false
            })
        }
    }
    resetSite() {
        let name = '';
        let description = '';
        return {
            siteData: {
                'target-endpoint': [{},{}],
                'rw-instances':[{
                    isNew: true,
                    endpoint:[{},{}]
                }]
            }
        }
    }
    handleAddSite() {
        this.setState(_.merge( this.resetSite() ,
              {
                isEdit: false,
                siteOpen: true,
                activeIndex: null,
                isEditSite: true,
                isReadOnly: false,
            }
        ))
    }
    handleAddTargetEndpoint() {
        let newSiteData = this.siteData;
        if(!newSiteData['target-endpoint']) {
            newSiteData['target-endpoint'] = [];
        }
        newSiteData['target-endpoint'].push({
            name: '',
            port: ''
        })
        this.setState({siteData: newSiteData})
    }
    handleRemoveTargetEndpoint(data) {
        let newSiteData = this.siteData;
        newSiteData['target-endpoint'].splice(
           data[0].index
            , 1
        );
        this.setState({siteData: newSiteData})
    }
    handleAddInstance() {
        let newSiteData = this.siteData;
        if(!newSiteData['rw-instances']) {
            newSiteData['rw-instances'] = [];
        }
        newSiteData['rw-instances'].push({
                isNew: true,
                endpoint:[{},{}]
            })
        this.setState({siteData: newSiteData})
    }
    handleRemoveInstance(data) {
        let newSiteData = this.siteData;
        newSiteData['rw-instances'].splice(
           data[0].index
            , 1
        );
        this.setState({siteData: newSiteData})
    }
    getSitesSuccess(sites) {
        this.alt.actions.global.hideScreenLoader.defer();
        this.setState({sites: sites});
    }
    getRedundancySuccess(data) {
        console.log(data)
        this.alt.actions.global.hideScreenLoader.defer();
        let sites =  data.site && data.site.map(function(site, i) {
            return site;
        });
        this.setState({
            sites,
            configData : {
                'polling-config' : data['polling-config'],
                'revertive-preference': data['revertive-preference'],
                'geographic-failover-decision': data['geographic-failover-decision'],
                'dns-ip-fqdn': data['dns-ip-fqdn'],
                'user-credentials': data['user-credentials'] || {
                    'username': '',
                    'password': ''
                }
            }
        });
    }
    updateConfigSuccess() {
        this.alt.actions.global.hideScreenLoader.defer();
        let self = this;
        this.setState({
            isEdit: true,
            isReadOnly: true
        });
    }
    updateSiteSuccess() {
        this.alt.actions.global.hideScreenLoader.defer();
        let self = this;
        let sites = this.sites || [];
        sites[this.activeIndex] = this.siteData
        this.setState({
            sites,
            isEdit: true,
            isReadOnly: true
        });
    }
    deleteSiteSuccess() {
        this.alt.actions.global.hideScreenLoader.defer();
        let sites = this.sites;
        sites.splice(this.activeIndex, 1);
        this.setState({sites, siteOpen: false,isEdit: true,
            isReadOnly: false,})
    }
    createSiteSuccess() {
        let self = this;
        this.alt.actions.global.hideScreenLoader.defer();
        let sites = this.sites || [];
        sites.push(self.siteData);
        let newState = {
            sites,
            isEdit: true,
            isReadOnly: true,
            activeIndex: sites.length - 1
        };
        _.merge(newState)
        this.setState(newState);
    }
    openRedundancyStateSocketSuccess(connection) {
        let self = this;
        let  ws = window.multiplexer.channel(connection);
        if (!connection) return;
        this.setState({
            socket: ws.ws,
            channelId: connection
        });
        ws.onmessage = (socket) => {
            try {
                var data = JSON.parse(socket.data);
                var newState = {status: data};
                Utils.checkAuthentication(data.statusCode, function() {
                    self.closeSocket();
                });

                self.setState(newState);
            } catch(error) {
                console.log('Hit at exception in openRedundancyStateSocketSuccess', error)
            }

        }
        ws.onclose = () => {
            self.closeSocket();
        }
    }
    closeSocket = () => {
        if (this.socket) {
            window.multiplexer.channel(this.channelId).close();
        }
        this.setState({
            socket: null
        })
    }
}
