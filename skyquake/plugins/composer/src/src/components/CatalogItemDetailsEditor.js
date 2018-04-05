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

import React from 'react'
import PureRenderMixin from 'react-addons-pure-render-mixin'
import EditDescriptorModelProperties from './EditDescriptorModelProperties'
import '../styles/CatalogItemDetailsEditor.scss'
import {SkyquakeRBAC, isRBACValid} from 'widgets/skyquake_rbac/skyquakeRBAC.jsx';
import ROLES from 'utils/roleConstants.js';
const PROJECT_ROLES = ROLES.PROJECT;
const PLATFORM = ROLES.PLATFORM;

const CatalogItemDetailsEditor = React.createClass({
	mixins: [PureRenderMixin],
	getInitialState() {
		return {};
	},
	getDefaultProps() {
		return {
			container: null,
			width: 0
		};
	},
	contextTypes: {
	    router: React.PropTypes.object,
	    userProfile: React.PropTypes.object
	},
	componentWillMount() {
	},
	componentDidMount() {
	},
	componentDidUpdate() {
	},
	componentWillUnmount() {
	},
	render() {
      	const User = this.context.userProfile;

		const container = this.props.container || { model: {}, uiState: {} };
		if (!(container && container.model && container.uiState)) {
			return null;
		}
		const height = this.props.height;
		const style = height > 0 ? { height: height + 'px' } : {};
		return (
			<div className="CatalogItemDetailsEditor" style={style}>
				<form name="details-descriptor-editor-form">
					<div className="properties-group">
					{
						isRBACValid(User, [PROJECT_ROLES.PROJECT_ADMIN, PROJECT_ROLES.CATALOG_ADMIN]) ?
						<EditDescriptorModelProperties
							container={this.props.container}
							idMaker={this.props.idMaker}
							showHelp={this.props.showHelp}
							collapsePanelsByDefault={this.props.collapsePanelsByDefault}
							openPanelsWithData={this.props.openPanelsWithData}
							width={this.props.width} />
						:<EditDescriptorModelProperties
							container={this.props.container}
							idMaker={this.props.idMaker}
							showHelp={this.props.showHelp}
							collapsePanelsByDefault={this.props.collapsePanelsByDefault}
							openPanelsWithData={this.props.openPanelsWithData}
							width={this.props.width}
							readOnly={true} />
                                        }
					</div>
				</form>
			</div>
		);

	}
});
export default CatalogItemDetailsEditor;
