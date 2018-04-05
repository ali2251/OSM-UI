
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

import UID from '../libraries/UniqueId'
import React from 'react'
import messages from './messages'
import ClassNames from 'classnames'
import PureRenderMixin from 'react-addons-pure-render-mixin'
import CatalogDataStore from '../stores/CatalogDataStore'
import CatalogItemsActions from '../actions/CatalogItemsActions'
import ComposerAppActions from '../actions/ComposerAppActions'
import SelectionManager from '../libraries/SelectionManager'

import '../styles/CatalogItems.scss'
import imgFile from 'file!../images/vendor-riftio.png'

const DEFAULT_NSD_ICON = require('style/img/catalog-nsd-default.svg');
const DEFAULT_VNFD_ICON = require('style/img/catalog-vnfd-default.svg');
const DEFAULT_ICON = require('style/img/catalog-default.svg');

function renderVersion (version) {
	if (version) {
		return (<span className='version'>{version}</span>);
	} // else return null by default
};
function getImageErrorHandler (type) {
	return type === 'nsd' ? handleNsdImageError : type === 'vnfd' ? handleVnfdImageError : handleImageError;
}
function handleImageError (e, image) {
	console.log('Bad logo path, using default');
	e.target.src = image || DEFAULT_ICON;
};
function handleNsdImageError (e) {
	handleImageError(e, DEFAULT_NSD_ICON);
};
function handleVnfdImageError (e) {
	handleImageError(e, DEFAULT_VNFD_ICON);
};

const CatalogItems = React.createClass({
	mixins: [PureRenderMixin],
	getInitialState() {
		return CatalogDataStore.getState();
	},
	getDefaultProps() {
		return {
			filterByType: 'nsd'
		};
	},
	componentWillMount() {
		CatalogDataStore.listen(this.onChange);
	},
	componentDidMount() {
		// async actions creator will dispatch loadCatalogsSuccess and loadCatalogsError messages
		CatalogDataStore.loadCatalogs().catch(e => console.warn('unable to load catalogs', e));
	},
	componentWillUnmount() {
		CatalogDataStore.unlisten(this.onChange);
	},
	onChange(state) {
		this.setState(state);
	},
	render() {
		const onDragStart = function(event) {
			const data = {type: 'catalog-item', item: this};
			event.dataTransfer.effectAllowed = 'copy';
			event.dataTransfer.setData('text', JSON.stringify(data));
			ComposerAppActions.setDragState(data);
		};
		const onDblClickCatalogItem = function () {
			CatalogItemsActions.editCatalogItem(this);
		};
		const onClickCatalogItem = function () {
			// single clicking an item is handled by ComposerApp::onClick handler
			//CatalogItemsActions.selectCatalogItem(this);
		};
		const cleanDataURI = function (imageString, type, id) {
			if (/\bbase64\b/g.test(imageString)) {
				return imageString;
			} else if (/<\?xml\b/g.test(imageString)) {
				const imgStr = imageString.substring(imageString.indexOf('<?xml'));
				return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(imgStr);
			} else if (/\.(svg|png|gif|jpeg|jpg)$/.test(imageString)) {
				return 'assets/logos/' + type + '/' + id + '/' + imageString;
				// return require('../images/logos/' + imageString);
			}
			return type === 'nsd' ? DEFAULT_NSD_ICON : type === 'vnfd' ? DEFAULT_VNFD_ICON : DEFAULT_ICON;
		}
		const items = this.getCatalogItems().map(function (d) {
			const isNSD = d.uiState.type === 'nsd';
			const isVNFD = d.uiState.type === 'vnfd';
			const isDeleted = d.uiState.deleted;
			const isModified = d.uiState.modified;
			const isSelected = SelectionManager.isSelected(d);
			const isOpenForEdit = d.uiState.isOpenForEdit;
			const spanClassNames = ClassNames({'-is-selected': isSelected, '-is-open-for-edit': isOpenForEdit});
			const sectionClassNames = ClassNames('catalog-item', {'-is-modified': isModified, '-is-deleted': isDeleted});
			let type;
			if(isNSD) {
				type = 'nsd';
			}
			if(isVNFD) {
				type = 'vnfd';
			}
			return (
				<li key={d.id} data-uid={UID.from(d)} onClick={onClickCatalogItem.bind(d)} onDoubleClick={onDblClickCatalogItem.bind(d)}>
					<div className={spanClassNames + ' ' + type}>
						<div className={sectionClassNames} id={d.id} draggable="true" onDragStart={onDragStart.bind(d)}>
							{isModified ? <div className="-is-modified-indicator" title="This descriptor has changes."></div> : null}
							<div className="type-header">{type}</div>
							<dl>
								<dt className="name">{d.name}</dt>
								<dd className="logo">
								<img className="logo" src={cleanDataURI(d['logo'], type, d.id)} draggable="false"  onError={getImageErrorHandler(type)} />
								</dd>
								<dd className="short-name" title={d.name}>{d['short-name']}</dd>
								<dd className="description">{d.description}</dd>
								<dd className="vendor">{d.vendor || d.provider} {renderVersion(d.version)}</dd>
							</dl>
						</div>
					</div>
					{isOpenForEdit ? <div className="-is-open-for-edit-indicator" title="This descriptor is open in the canvas."></div> : null}
				</li>
			);
		});
		return (
			<div className="CatalogItems">
				<ul data-offset-parent="true">
					{items.length ? items : messages.catalogWelcome}
				</ul>
			</div>
		);
	},
	getCatalogItems() {
		const catalogFilter = (d) => {return d.type === this.props.filterByType};
		return this.state.catalogs.filter(catalogFilter).reduce((result, catalog) => {
			return result.concat(catalog.descriptors);
		}, []);
	}
});

export default CatalogItems;
