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
import { Link } from 'react-router';
import Utils from 'utils/utils.js';
import Crouton from 'react-crouton';
import 'style/common.scss';

import './skyquakeNav.scss';
import SelectOption from '../form_controls/selectOption.jsx';
import { FormSection } from '../form_controls/formControls.jsx';
import { isRBACValid, SkyquakeRBAC } from 'widgets/skyquake_rbac/skyquakeRBAC.jsx';

//Temporary, until api server is on same port as webserver
import rw from 'utils/rw.js';

var API_SERVER = rw.getSearchParams(window.location).api_server;
var DOWNLOAD_SERVER = rw.getSearchParams(window.location).dev_download_server;

//
// Internal classes/functions
//

class SelectProject extends React.Component {
    constructor(props) {
        super(props);
    }
    selectProject(e) {
        let value = JSON.parse(e.currentTarget.value);
        // console.log('selected project', value)
    }
    render() {
        let props = this.props;
        let hasProjects = props.projects;
        let userAssignedProjects = hasProjects && (props.projects.length > 0)
        return (
            <div className="app">
                <h2>
                    <a style={{textTransform:'none'}}>
                        {
                            hasProjects ?
                            (userAssignedProjects ? 'PROJECT: ' + props.currentProject : 'No Projects Assigned')
                            : 'Projects Loading...'
                        }
                    </a>
                    {
                        userAssignedProjects ? <span className="oi" data-glyph="caret-bottom"></span> : null
                    }
                </h2>
                {
                    userAssignedProjects ?
                        <ul className="project menu">
                            {
                                props.projects.map(function (p, k) {
                                    return <li key={k} onClick={props.onSelectProject.bind(null, p.name)}><a>{p.name}</a></li>
                                })
                            }
                        </ul>
                        : null
                }
            </div>
        )
    }
}

/*

 <SelectOption
                        options={projects}
                        value={currentValue}
                        defaultValue={currentValue}
                        onChange={props.onSelectProject}
                        className="projectSelect" />

 */


class UserNav extends React.Component {
    constructor(props) {
        super(props);
    }
    handleLogout() {
        Utils.clearAuthentication();
    }
    selectProject(e) {
        let value = JSON.parse(e.currentTarget.value)
        // console.log('selected project', value)
    }
    render() {
        let props = this.props;
        let userProfileLink = null;
        this.props.nav['user_management'] && this.props.nav['user_management'].routes.map((r) => {
            if (r.unique) {
                userProfileLink = r;
            }
        })
        return !userProfileLink ? null : (
            <div className="app">
                <h2 className="username">
                    USERNAME: {returnLinkItem(userProfileLink, props.currentUser)}
                    <span className="oi" data-glyph="caret-bottom"></span>
                </h2>
                <ul className="menu">
                    <li>
                        {returnLinkItem(userProfileLink, "My Profile")}
                    </li>
                    <li>
                        <a onClick={this.handleLogout}>
                            Logout
                        </a>
                    </li>
                </ul>
            </div>
        )
    }
}

UserNav.defaultProps = {
    projects: [

    ]
}

//
// Exported classes and functions
//

//
/**
 * Skyquake Nav Component. Provides navigation functionality between all plugins
 */
export default class skyquakeNav extends React.Component {
    constructor(props) {
        super(props);
        this.state = {};
        this.state.validateErrorEvent = 0;
        this.state.validateErrorMsg = '';
    }
    componentDidMount() {
        this.props.store.openProjectSocket();
    }
    validateError = (msg) => {
        this.setState({
            validateErrorEvent: true,
            validateErrorMsg: msg
        });
    }
    validateReset = () => {
        this.setState({
            validateErrorEvent: false
        });
    }
    returnCrouton = () => {
        return <Crouton
            id={Date.now()}
            message={this.state.validateErrorMsg}
            type={"error"}
            hidden={!(this.state.validateErrorEvent && this.state.validateErrorMsg)}
            onDismiss={this.validateReset}
        />;
    }
    render() {
        let html;
        html = (
            <div>
                {this.returnCrouton()}
                <nav className="skyquakeNav">
                    {buildNav.call(this, this.props.nav, this.props.currentPlugin, this.props)}
                </nav>

            </div>
        )
        return html;
    }
}
skyquakeNav.defaultProps = {
    nav: {}
}
skyquakeNav.contextTypes = {
    userProfile: React.PropTypes.object
};
/**
 * Returns a React Component
 * @param  {object} link  Information about the nav link
 * @param  {string} link.route Hash route that the SPA should resolve
 * @param  {string} link.name Link name to be displayed
 * @param  {number} index index of current array item
 * @return {object} component A React LI Component
 */
//This should be extended to also make use of internal/external links and determine if the link should refer to an outside plugin or itself.
export function buildNavListItem(k, link, index) {
    let html = false;
    if (link.type == 'external') {
        this.hasSubNav[k] = true;
        html = (
            <li key={index}>
                {returnLinkItem(link)}
            </li>
        );
    }
    return html;
}

/**
 * Builds a link to a React Router route or a new plugin route.
 * @param  {object} link Routing information from nav object.
 * @return {object}  component   returns a react component that links to a new route.
 */
export function returnLinkItem(link, label) {
    let ref;
    let route = link.route;
    if (link.isExternal) {
        ref = (
            <a href={route}>{label || link.label}</a>
        )
    } else {
        if (link.path && link.path.replace(' ', '') != '') {
            route = link.path;
        }
        if (link.query) {
            let query = {};
            query[link.query] = '';
            route = {
                pathname: route,
                query: query
            }
        }
        ref = (
            <Link to={route}>
                {label || link.label}
            </Link>
        )
    }
    return ref;
}




/**
 * Constructs nav for each plugin, along with available subnavs
 * @param  {array} nav List returned from /nav endpoint.
 * @return {array}     List of constructed nav element for each plugin
 */
export function buildNav(navData, currentPlugin, props) {
    let navList = [];
    let navListHTML = [];
    let secondaryNav = [];
    let adminNav = [];
    //For monitoring when admin panel is active
    let adminNavList = [];
    let self = this;
    const User = this.context.userProfile;
    //The way the nav is sorting needs to be refactored.
    let navArray = navData && Object.keys(navData).sort((a, b) => navData[a].order - navData[b].order)
    self.hasSubNav = {};
    for (let i = 0; i < navArray.length; i++) {
        let k = navArray[i];
        if (navData.hasOwnProperty(k)) {
            self.hasSubNav[k] = false;
            let header = null;
            let navClass = "app";
            let routes = navData[k].routes;
            let navItem = {};
            //Primary plugin title and link to dashboard.
            let route;
            let NavList;
            if (API_SERVER) {
                route = routes[0].isExternal ?
                    '/' + k + '/index.html?api_server=' + API_SERVER + '' + (DOWNLOAD_SERVER ? '&dev_download_server=' + DOWNLOAD_SERVER : '')
                    : '';
            } else {
                route = routes[0].isExternal ? '/' + k + '/' : '';
            }
            if(navData[k].route) {
                route = route + navData[k].route;
            }
            let dashboardLink = returnLinkItem({
                isExternal: routes[0].isExternal,
                pluginName: navData[k].pluginName,
                label: navData[k].label || k,
                route: route
            });
            let shouldAllow = navData[k].allow || ['*'];
            if (navData[k].pluginName == currentPlugin) {
                navClass += " active";
            }
            NavList = navData[k].routes.filter((r) => {
                const User = self.context.userProfile;
                const shouldAllow = r.allow || ['*'];
                return isRBACValid(User, shouldAllow);
            }).map(buildNavListItem.bind(self, k));
            navItem.priority = navData[k].priority;
            navItem.order = navData[k].order;
            if (navData[k].admin_link) {
                if (isRBACValid(User, shouldAllow)) {
                    adminNavList.push(navData[k].pluginName);
                    adminNav.push((
                        <li key={navData[k].pluginName}>
                            {dashboardLink}
                        </li>
                    ))
                }
            } else {
                if (isRBACValid(User, shouldAllow)) {
                    navItem.html = (
                        <div key={k} className={navClass}>
                            <h2>{dashboardLink} {self.hasSubNav[k] ? <span className="oi" data-glyph="caret-bottom"></span> : ''}</h2>
                            <ul className="menu">
                                {NavList}
                            </ul>
                        </div>
                    );
                }
                navList.push(navItem)
            }

        }
    }

    //Sorts nav items by order and returns only the markup
    navListHTML = navList.map(function (n) {
        if ((n.priority < 2)) {
            return n.html;
        } else {
            secondaryNav.push(n.html);
        }
    });
    if (adminNav.length) {
            navListHTML.push(
                <div key="Adminstration" className={"app " + (adminNavList.indexOf(currentPlugin) > -1 ? 'active' : '')}>
                    <h2>
                        <a>
                            ADMINISTRATION
                        </a>
                        <span className="oi" data-glyph="caret-bottom"></span>
                    </h2>
                    <ul className="menu">
                        {
                            adminNav
                        }
                    </ul>
                </div>
            );
    }
    let secondaryNavHTML = (
        <div className="secondaryNav" key="secondaryNav">
            {secondaryNav}
            <SelectProject
                onSelectProject={props.store.selectActiveProject}
                projects={props.projects}
                currentProject={props.currentProject} />
            <UserNav
                currentUser={props.currentUser}
                nav={navData} />
        </div>
    )
    // console.log("app admin " + (adminNavList.indexOf(currentPlugin) > -1 ? 'active' : ''))
    navListHTML.push(secondaryNavHTML);
    return navListHTML;
}
