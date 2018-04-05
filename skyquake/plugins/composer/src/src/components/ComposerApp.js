/*
 *
 *   Copyright 2016 RIFT.IO Inc
 *
 *   Licensed under the Apache License, Version 2.0 (the "License");
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 *
 */
'use strict';

window['RIFT_wareLaunchpadComposerVersion'] = `semver 0.0.79`;

import 'es5-shim'
import 'babel-polyfill'
import alt from '../alt'
import UID from '../libraries/UniqueId'
import utils from '../libraries/utils'
import React from 'react'
import ReactDOM from 'react-dom'
import Crouton from 'react-crouton'
import ClassNames from 'classnames'
import PureRenderMixin from 'react-addons-pure-render-mixin'
import DeletionManager from '../libraries/DeletionManager'
import SelectionManager from '../libraries/SelectionManager'
import ResizableManager from '../libraries/ResizableManager'
import DescriptorModelMetaFactory from '../libraries/model/DescriptorModelMetaFactory'
import DescriptorModelFactory from '../libraries/model/DescriptorModelFactory'
import RiftHeader from './RiftHeader'
import CanvasPanel from './CanvasPanel'
import CatalogPanel from './CatalogPanel'
import DetailsPanel from './DetailsPanel'
import ModalOverlay from './ModalOverlay'
import ComposerAppToolbar from './ComposerAppToolbar'
import PanelResizeAction from '../actions/PanelResizeAction'
import ComposerAppActions from '../actions/ComposerAppActions'
import ComposerAppStore from '../stores/ComposerAppStore'
import CatalogDataStore from '../stores/CatalogDataStore'
import TooltipManager from '../libraries/TooltipManager'
import CatalogItemsActions from '../actions/CatalogItemsActions'
import CommonUtils from 'utils/utils.js'
import FileManagerActions from './filemanager/FileManagerActions';
import { SkyquakeRBAC, isRBACValid } from 'widgets/skyquake_rbac/skyquakeRBAC.jsx';
import ROLES from 'utils/roleConstants.js';
import _isEmpty from 'lodash/isEmpty';
import _isEqual from 'lodash/isEqual';

import 'normalize.css'
import '../styles/AppRoot.scss'
import 'style/layout.scss'


const resizeManager = new ResizableManager(window);

const clearLocalStorage = utils.getSearchParams(window.location).hasOwnProperty('clearLocalStorage');

const preventDefault = e => e.preventDefault();
const clearDragState = () => ComposerAppActions.setDragState(null);

const PROJECT_ROLES = ROLES.PROJECT;
const PLATFORM = ROLES.PLATFORM;

const CATALOG_POLLING_INTERVAL = 2000;


const ComposerApp = React.createClass({
    getInitialState() {
        return ComposerAppStore.getState();
    },
    getDefaultProps() {
        return {};
    },
    contextTypes: {
        router: React.PropTypes.object,
        userProfile: React.PropTypes.object
    },
    componentWillUpdate(nextProps, nextState, nextContext) {
        if (!_isEmpty(nextContext.userProfile)) {
            CatalogDataStore.setUserProfile(nextContext.userProfile);
        }
    },
    shouldComponentUpdate: function (nextProps, nextState, nextContext) {
        if (!this.userProfile && !_isEmpty(nextContext.userProfile)) {
            this.userProfile = nextContext.userProfile;
            CatalogDataStore.setUserProfile(nextContext.userProfile);
            return true;
        }
        return !_isEqual(this.props, nextProps) ||
            !_isEqual(this.state, nextState);
    },
    componentWillMount() {
        if (clearLocalStorage) {
            window.localStorage.clear();
        }
        if (this.item) {
            FileManagerActions.openFileManagerSockets();
        }
        this.state.isLoading = CatalogDataStore.getState().isLoading;
        ComposerAppStore.listen(this.onChange);
        CatalogDataStore.listen(this.onCatalogDataChanged);
        window.addEventListener('resize', this.resize);
        // prevent browser from downloading any drop outside of our specific drop zones
        window.addEventListener('dragover', preventDefault);
        window.addEventListener('drop', preventDefault);
        // ensure drags initiated in the app clear the state on drop
        window.addEventListener('drop', clearDragState);
        DeletionManager.addEventListeners();
    },
    componentWillUnmount() {
        window.removeEventListener('resize', this.resize);
        window.removeEventListener('dragover', preventDefault);
        window.removeEventListener('drop', preventDefault);
        window.removeEventListener('drop', clearDragState);
        FileManagerActions.closeFileManagerSockets();
        // resizeManager automatically registered its event handlers
        resizeManager.removeAllEventListeners();
        ComposerAppStore.unlisten(this.onChange);
        CatalogDataStore.unlisten(this.onCatalogDataChanged);
        DeletionManager.removeEventListeners();
        TooltipManager.removeEventListeners();
        if (this.catalogMonitorId) {
            clearTimeout(this.catalogMonitorId);
        }
    },
    componentDidMount() {
        resizeManager.addAllEventListeners();
        const snapshot = window.localStorage.getItem('composer');
        if (snapshot) {
            alt.bootstrap(snapshot);
        }
        document.body.addEventListener('keydown', (event) => {
            // prevent details editor form from blowing up the app
            const ENTER_KEY = 13;
            if (event.which === ENTER_KEY) {
                event.preventDefault();
                return false;
            }
        });
        const loadCatalogs = () => {
            CatalogDataStore.loadCatalogs();
            if (CATALOG_POLLING_INTERVAL) {
                this.catalogMonitorId = setTimeout(loadCatalogs, CATALOG_POLLING_INTERVAL);
            }
        };
        loadCatalogs();
        DescriptorModelMetaFactory.init().then(() => this.setState({ hasModel: true }));
    },
    componentDidUpdate() {
        if (this.state.fullScreenMode) {
            document.body.classList.add('-is-full-screen');
        } else {
            document.body.classList.remove('-is-full-screen');
        }
        SelectionManager.refreshOutline();
    },
    resize(e) {
        PanelResizeAction.resize(e);
    },
    render() {
        let html = null;
        let self = this;
        const User = this.userProfile || {};
        const rbacDisabled = !isRBACValid(User, [PROJECT_ROLES.PROJECT_ADMIN, PROJECT_ROLES.CATALOG_ADMIN]);
        if (this.state.hasModel) {

            function onClickUpdateSelection(event) {
                if (event.defaultPrevented) {
                    return
                }
                const element = SelectionManager.getClosestElementWithUID(event.target);
                if (element) {
                    SelectionManager.select(element);
                    SelectionManager.refreshOutline();
                    event.preventDefault();
                } else {
                    if (event.target.offsetParent && !event.target.offsetParent.classList.contains("tray-body")) {
                        SelectionManager.clearSelectionAndRemoveOutline();
                    }
                }
            }

            let cpNumber = 0;
            let AppHeader = (<div className="AppHeader">
                <RiftHeader />
            </div>);
            // AppHeader = null;
            const classNames = ClassNames('ComposerApp');
            const isNew = self.state.item && self.state.item.uiState.isNew;
            const hasItem = self.state.item && self.state.item.uiState;
            const isModified = self.state.item && self.state.item.uiState.modified;
            const isEditingNSD = self.state.item && self.state.item.uiState && /nsd/.test(self.state.item.uiState.type);
            const isEditingVNFD = self.state.item && self.state.item.uiState && /vnfd/.test(self.state.item.uiState.type);
            const containers = [self.state.item].reduce(DescriptorModelFactory.buildCatalogItemFactory(CatalogDataStore.getState().catalogs), []);

            containers.filter(d => DescriptorModelFactory.isConnectionPoint(d)).forEach(d => {
                d.cpNumber = ++cpNumber;
                containers.filter(d => DescriptorModelFactory.isVnfdConnectionPointRef(d)).filter(ref => ref.key === d.key).forEach(ref => ref.cpNumber = d.cpNumber);
            });
            const canvasTitle = containers.length ? containers[0].model.name : '';
            const hasNoCatalogs = CatalogDataStore.getState().catalogs.length === 0;
            const isLoading = self.state.isLoading;

            //Bridge element for Crouton fix. Should eventually put Composer on same flux context
            const Bridge = this.state.ComponentBridgeElement;

            html = (
                <div ref={element => TooltipManager.addEventListeners(element)} id="RIFT_wareLaunchpadComposerAppRoot" className="AppRoot" onClick={onClickUpdateSelection}>
                    <Bridge />
                    <i className="corner-accent top left" />
                    <i className="corner-accent top right" />
                    <i className="corner-accent bottom left" />
                    <i className="corner-accent bottom right" />
                    {AppHeader}
                    <div className="AppBody">
                        <div className={classNames}>
                            <CatalogPanel layout={self.state.layout}
                                isLoading={isLoading}
                                hasNoCatalogs={hasNoCatalogs}
                                filterByType={self.state.filterCatalogByTypeValue}
                                rbacDisabled={rbacDisabled} />
                            <CanvasPanel layout={self.state.layout}
                                hasNoCatalogs={hasNoCatalogs}
                                showMore={self.state.showMore}
                                containers={containers}
                                title={canvasTitle}
                                zoom={self.state.zoom}
                                panelTabShown={self.state.panelTabShown}
                                files={self.state.files}
                                filesState={self.state.filesState}
                                newPathName={self.state.newPathName}
                                item={self.state.item}
                                type={self.state.filterCatalogByTypeValue}
                                rbacDisabled={rbacDisabled}
                                User={User}
                            />
                            {
                                (self.state.panelTabShown == 'descriptor') ?
                                    <DetailsPanel layout={self.state.layout}
                                        hasNoCatalogs={hasNoCatalogs}
                                        showMore={self.state.showMore}
                                        containers={containers}
                                        showHelp={self.state.showHelp}
                                        collapsePanelsByDefault={self.state.collapsePanelsByDefault}
                                        openPanelsWithData={self.state.openPanelsWithData}
                                        showJSONViewer={self.state.showJSONViewer} />
                                    : null
                            }

                            <ComposerAppToolbar layout={self.state.layout}
                                showMore={self.state.showMore}
                                isEditingNSD={isEditingNSD}
                                isEditingVNFD={isEditingVNFD}
                                isModified={isModified}
                                isNew={isNew}
                                disabled={!hasItem || rbacDisabled}
                                onClick={event => event.stopPropagation()}
                                panelTabShown={self.state.panelTabShown} />
                        </div>
                    </div>
                    <ModalOverlay />
                </div>
            );
        }
        return html;
    },
    onChange(state) {
        this.setState(state);
    },
    onCatalogDataChanged(catalogDataState) {
        this.setState({
            isLoading: catalogDataState.isLoading
        });
    }
});


export default ComposerApp;
