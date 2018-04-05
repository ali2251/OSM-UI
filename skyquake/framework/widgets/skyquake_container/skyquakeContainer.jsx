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
import React from 'react';
import AltContainer from 'alt-container';
import Alt from './skyquakeAltInstance.js';
 import _cloneDeep from 'lodash/cloneDeep';
import SkyquakeNav from '../skyquake_nav/skyquakeNav.jsx';
import EventCenter from './eventCenter.jsx';
import SkyquakeContainerActions from './skyquakeContainerActions.js'
import SkyquakeContainerStore from './skyquakeContainerStore.js';
// import Breadcrumbs from 'react-breadcrumbs';
import Utils from 'utils/utils.js';
import Crouton from 'react-crouton';
import SkyquakeNotification from '../skyquake_notification/skyquakeNotification.jsx';
import ScreenLoader from 'widgets/screen-loader/screenLoader.jsx';
import {SkyquakeRBAC, isRBACValid} from 'widgets/skyquake_rbac/skyquakeRBAC.jsx';
import ROLES from 'utils/roleConstants.js';
import './skyquakeApp.scss';
// import 'style/reset.css';
import 'style/core.css';
const PROJECT_ROLES = ROLES.PROJECT;
const PLATFORM = ROLES.PLATFORM;
export default class skyquakeContainer extends React.Component {
    constructor(props) {
        super(props);
        let self = this;
        this.state = SkyquakeContainerStore.getState();
        //This will be populated via a store/source
        this.state.nav = this.props.nav || [];
        this.state.eventCenterIsOpen = false;
        this.state.currentPlugin = SkyquakeContainerStore.currentPlugin;
    }
    getChildContext() {
        return {
          userProfile: this.state.user
        };
    }
    getUserProfile() {
        return this.state.user;
    }
    componentWillMount() {
        let self = this;

        Utils.bootstrapApplication().then(function() {
            SkyquakeContainerStore.listen(self.listener);
            SkyquakeContainerStore.getNav();
            SkyquakeContainerStore.getUserProfile();
            SkyquakeContainerStore.getEventStreams();
        });

        // Load multiplex-client
        const script = document.createElement("script");

        script.src = "/multiplex-client";
        script.async = true;

        document.body.appendChild(script);

        Utils.setupMultiplexClient();
    }

    componentWillUnmount() {
        SkyquakeContainerStore.unlisten(this.listener);
    }
    listener = (state) => {
        this.setState(state);
    }
    matchesLoginUrl() {
        //console.log("window.location.hash=", window.location.hash);
        // First element in the results of match will be the part of the string
        // that matched the expression. this string should be true against
        // (window.location.hash.match(re)[0]).startsWith(Utils.loginHash)
        var re = /#\/login?(\?|\/|$)/i;
        //console.log("res=", window.location.hash.match(re));
        return (window.location.hash.match(re)) ? true : false;
    }
    onToggle = (isOpen) => {
        this.setState({
            eventCenterIsOpen: isOpen
        });
    }

    render() {
        const {displayNotification, notificationData, displayScreenLoader,...state} = this.state;
        const User = this.state.user || {};
        const rbacValid = isRBACValid(User, [PLATFORM.SUPER, PLATFORM.ADMIN, PLATFORM.OPER]);
        var html;
        let nav = _cloneDeep(this.state.nav);
        if (this.matchesLoginUrl()) {
            html = (
                <AltContainer flux={Alt}>
                    <div className="skyquakeApp">
                        {this.props.children}
                    </div>
                </AltContainer>
            );
        } else {
            let tag = this.props.routes[this.props.routes.length-1].name ? ': '
                + this.props.routes[this.props.routes.length-1].name : '';
            let routeName = this.props.location.pathname.split('/')[1];
            html = (
                <AltContainer flux={Alt}>
                    <div className="skyquakeApp wrap">
                        <SkyquakeNotification
                            data={this.state.notificationData}
                            visible={displayNotification}
                            onDismiss={SkyquakeContainerActions.hideNotification}
                        />
                        <ScreenLoader show={displayScreenLoader}/>
                        <SkyquakeNav nav={nav}
                            currentPlugin={this.state.currentPlugin}
                            currentUser={this.state.user.userId}
                            currentProject={this.state.user.projectId}
                            store={SkyquakeContainerStore}
                            projects={this.state.projects} />
                        <div className="titleBar">
                            <h1>{(this.state.nav.name ? this.state.nav.name.replace('_', ' ').replace('-', ' ') : this.state.currentPlugin && this.state.currentPlugin.replace('_', ' ').replace('-', ' ')) + tag}</h1>
                        </div>
                        <div className={"application " + routeName}>
                            {this.props.children}
                        </div>
                        {
                            rbacValid ?
                                <EventCenter className="eventCenter"
                                    notifications={this.state.notifications}
                                    newNotificationEvent={this.state.newNotificationEvent}
                                    newNotificationMsg={this.state.newNotificationMsg}
                                    onToggle={this.onToggle} />
                            : null
                        }
                    </div>
                </AltContainer>
            );
        }
        return html;
    }
}
skyquakeContainer.childContextTypes = {
  userProfile: React.PropTypes.object
};
skyquakeContainer.contextTypes = {
    router: React.PropTypes.object
  };

/*
<Breadcrumbs
                            routes={this.props.routes}
                            params={this.props.params}
                            separator=" | "
                        />
 */
