
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

import _cloneDeep from 'lodash/cloneDeep'
import _isArray from 'lodash/isArray'
import _isObject from 'lodash/isObject'
import _keys from 'lodash/keys'
import React from 'react';
import PureRenderMixin from 'react-addons-pure-render-mixin'
import messages from './messages'
import serializers from '../libraries/model/DescriptorModelSerializer'
import JSONViewer from 'widgets/JSONViewer/JSONViewer';
import PopupWindow from './PopupWindow'
import DetailsPanelToolbar from './DetailsPanelToolbar'
import NavigateDescriptorModel from './NavigateDescriptorModel'
import NavigateDescriptorErrors from './NavigateDescriptorErrors'
import CatalogItemDetailsEditor from './CatalogItemDetailsEditor'
import SelectionManager from '../libraries/SelectionManager'

import '../styles/DetailsPanel.scss'

function checkForErrors(errors) {
	return _keys(errors).reduce((inError, k) => {
		function traverseObject(obj, key) {
			const node = obj[key];
			if (_isArray(node)) {
				return node.reduce((inError, v, i) => {
					if (!inError && v) {
						return _keys(v).reduce((inError, k) => {
							return inError || traverseObject(v, k);
						}, false);
					}
					return inError;
				}, false);
			} else if (_isObject(node)) {
				return _keys(node).reduce((inError, k) => {
					return inError || traverseObject(node, k);
				}, false);
			} else {
				return !! node;
			}
		}
		return inError || traverseObject(errors, k);
	}, false);
}

const DetailsPanel = React.createClass({
	mixins: [PureRenderMixin, SelectionManager.reactPauseResumeMixin],
	getInitialState() {
		return {};
	},
	getDefaultProps() {
		return {
			containers: [],
			showJSONViewer: false
		};
	},
	componentWillMount() {
		setTimeout(() => {
			const height = this.panel && this.panel.offsetHeight;
			this.setState({ height });
		}, 100);
	},
	componentDidMount() {
	},
	componentDidUpdate() {
		SelectionManager.refreshOutline();
	},
	componentWillUnmount() {
	},
	contextTypes: {
	    router: React.PropTypes.object,
	    userProfile: React.PropTypes.object
	},
	componentWillUpdate(nextProps) {
		if ((nextProps.layout != this.props.layout)
			&& (nextProps.layout.height != this.props.layout.height)) {
			this.componentWillMount();
		}
	},

	render() {
		let json = '{}';
		let bodyContent = this.props.hasNoCatalogs ? null : messages.detailsWelcome();
		const selected = this.props.containers.filter(d => SelectionManager.isSelected(d));
		const selectedContainer = selected[0];
		let workingHeight = this.state.height || 1;

		function makeId(container, path) {
			let idParts = [_isArray(path) ? path.join(':') : path];
			idParts.push(container.uid);
			while (container.parent) {
				container = container.parent;
				idParts.push(container.uid);
			}
			return idParts.reverse().join(':');
		}

		if (selectedContainer) {
			bodyContent = [];
			bodyContent.push(
				<DetailsPanelToolbar
					key='toolbar'
					container={selectedContainer}
					showHelp={this.props.showHelp.forAll}
					width={this.props.layout.right} />
			);
			workingHeight -= 32 + 35;
			bodyContent.push(
				<NavigateDescriptorModel key='navigate' container={selectedContainer} idMaker={makeId}
					style={{ margin: '8px 8px 15px' }} />
			)
			workingHeight -= 8 + 15 + 37;
			if (checkForErrors(selectedContainer.uiState.error)) {
				bodyContent.push(
					<NavigateDescriptorErrors key='errors' container={selectedContainer} idMaker={makeId}
						style={{ margin: '8px 8px 15px' }} />
				)
				workingHeight -= 8 + 15 + 37;
			}
			bodyContent.push(
				<div key='editor' className="DetailsPanelBody">
					<CatalogItemDetailsEditor
						container={selectedContainer}
						idMaker={makeId}
						showHelp={this.props.showHelp}
						collapsePanelsByDefault={this.props.collapsePanelsByDefault}
						openPanelsWithData={this.props.openPanelsWithData}
						width={this.props.layout.right}
						height={workingHeight} />
				</div>
			);
			const edit = _cloneDeep(selectedContainer.model);
			json = serializers.serialize(edit) || edit;
		}
		const jsonViewerTitle = selectedContainer ? selectedContainer.model.name : 'nothing selected';
		return (
			<div ref={el => this.panel = el} className="DetailsPanel" data-resizable="left" data-resizable-handle-offset="0 5" style={{ width: this.props.layout.right }} onClick={event => event.preventDefault()}>
				{bodyContent}
				<PopupWindow show={this.props.showJSONViewer} title={jsonViewerTitle}><JSONViewer json={json} /></PopupWindow>
			</div>
		);
	}
});

export default DetailsPanel;
