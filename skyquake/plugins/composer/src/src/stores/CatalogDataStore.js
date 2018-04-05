
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

import _pick from 'lodash/pick'
import _isEqual from 'lodash/isEqual'
import _cloneDeep from 'lodash/cloneDeep'
import _merge from 'lodash/merge'
import _debounce from 'lodash/debounce';
import cc from 'change-case'
import alt from '../alt'
import UID from '../libraries/UniqueId'
import guid from '../libraries/guid'
import React from 'react'
import DescriptorModel from '../libraries/model/DescriptorModel'
import DescriptorModelMetaFactory from '../libraries/model/DescriptorModelMetaFactory'
import DescriptorModelFactory from '../libraries/model/DescriptorModelFactory'
import CatalogPackageManagerActions from '../actions/CatalogPackageManagerActions'
import CatalogDataSourceActions from '../actions/CatalogDataSourceActions'
import CatalogItemsActions from '../actions/CatalogItemsActions'
import ModalOverlayActions from '../actions/ModalOverlayActions'
import ComposerAppActions from '../actions/ComposerAppActions'
import CatalogDataSource from '../sources/CatalogDataSource'
import ComposerAppStore from '../stores/ComposerAppStore'
import SelectionManager from '../libraries/SelectionManager'

const defaults = {
	catalogs: [],
	catalogItemExportFormats: ['mano', 'rift'],
	catalogItemExportGrammars: ['osm', 'tosca']
};

const areCatalogItemsMetaDataEqual = function (catItem, activeItem) {
	function getDefaultPositionMap() {
		if (!activeItem.uiState.containerPositionMap) {
			return activeItem.uiState.containerPositionMap;
		}
		let defaultPositionMap = {};
		defaultPositionMap[activeItem.id] = activeItem.uiState.defaultLayoutPosition;
		return defaultPositionMap;
	}
	const activeItemMetaData = activeItem.uiState.containerPositionMap;
	const catItemMetaData = catItem.uiState.containerPositionMap;
	return catItemMetaData === undefined || _isEqual(catItemMetaData, activeItemMetaData);
};

function createItem(type) {
	let newItem = DescriptorModelMetaFactory.createModelInstanceForType(type);
	if (newItem) {
		newItem.id = guid();
		UID.assignUniqueId(newItem);
		newItem.uiState.isNew = true;
		newItem.uiState.modified = true;
	}
	return newItem;
}

class CatalogDataStore {

	constructor() {
		this.catalogs = defaults.catalogs;
		this.isLoading = true;
		this.snapshots = {};
		this.selectedFormat = defaults.catalogItemExportFormats[0];
		this.selectedGrammar = defaults.catalogItemExportGrammars[0];
		this.registerAsync(CatalogDataSource);
		this.bindActions(CatalogDataSourceActions);
		this.bindActions(CatalogItemsActions);
		this.exportPublicMethods({
			getCatalogs: this.getCatalogs,
			getCatalogItemById: this.getCatalogItemById,
			getCatalogItemByUid: this.getCatalogItemByUid,
			getTransientCatalogs: this.getTransientCatalogs,
			getTransientCatalogItemById: this.getTransientCatalogItemById,
			getTransientCatalogItemByUid: this.getTransientCatalogItemByUid,
			setUserProfile: this.setUserProfile
		});
		this.queueDirtyCheck = _debounce(() => this.saveDirtyDescriptorsToSessionStorage(), 500);
	}

	resetSelectionState = () => {
		this.selectedFormat = defaults.catalogItemExportFormats[0];
		this.selectedGrammar = defaults.catalogItemExportGrammars[0];
	}

	getCatalogs() {
		return this.catalogs || (this.catalogs = []);
	}

	saveDirtyDescriptorsToSessionStorage() {
		const dirtyCatalogs = this.catalogs.reduce((result, catalog) => {
			const dirtyDescriptors = catalog.descriptors.reduce((result, descriptor) => {
				if (descriptor.uiState.modified && !descriptor.uiState.deleted) {
					result.push(descriptor);
				}
				return result;
			}, []);
			if (dirtyDescriptors.length) {
				let newCatalog = Object.assign({}, catalog);
				newCatalog.descriptors = dirtyDescriptors;
				result.push(newCatalog);
			}
			return result;
		}, []);
		window.sessionStorage.setItem(this.userProfile.userId + '@' + this.userProfile.domain, JSON.stringify({
			dirtyCatalogs
		}));
	}

	mergeDirtyDescriptorsFromSessionStorage(catalogs) {
		let userProfileDirtyCatalogs = window.sessionStorage.getItem(this.userProfile.userId + '@' + this.userProfile.domain);
		let dirtyCatalogs = [];
		if (userProfileDirtyCatalogs) {
			dirtyCatalogs = JSON.parse(userProfileDirtyCatalogs).dirtyCatalogs;
		}
		dirtyCatalogs.forEach((dirtyCatalog) => {
			let catalog = catalogs.find((c) => c.id === dirtyCatalog.id);
			dirtyCatalog.descriptors.forEach((dirtyDescriptor, index) => {
				let descriptor = catalog.descriptors.find((d) => d.id === dirtyDescriptor.id);
				if (descriptor) {
					this.addSnapshot(descriptor);
					_merge(descriptor, dirtyDescriptor);
				} else {
					dirtyCatalog.descriptors.splice(index, 1);
					this.queueDirtyCheck();
				}
			})
		});
		this.isNotMergedWithSessionStorage = false;
		return catalogs;
	}

	setUserProfile = (userProfile) => {
		if (!this.userProfile) {
			this.userProfile = userProfile;
			if (this.catalogs.length) {
				const catalogs = this.mergeDirtyDescriptorsFromSessionStorage(this.catalogs);
				this.setState({ catalogs });
			} else {
				this.isNotMergedWithSessionStorage = true;
			}
		}
	}

	getTransientCatalogs() {
		return this.state.catalogs || (this.state.catalogs = []);
	}

	getAllSelectedCatalogItems() {
		return this.getCatalogs().reduce((r, d) => {
			d.descriptors.forEach(d => {
				if (SelectionManager.isSelected(d) /*d.uiState.selected*/) {
					r.push(d);
				}
			});
			return r;
		}, []);
	}

	getFirstSelectedCatalogItem() {
		return this.getCatalogs().reduce((r, catalog) => {
			return r.concat(catalog.descriptors.filter(d => SelectionManager.isSelected(d) /*d.uiState.selected*/));
		}, [])[0];
	}

	getCatalogItemById(id) {
		return this.getCatalogs().reduce((r, catalog) => {
			return r.concat(catalog.descriptors.filter(d => d.id === id));
		}, [])[0];
	}

	getTransientCatalogItemById(id) {
		return this.getTransientCatalogs().reduce((r, catalog) => {
			return r.concat(catalog.descriptors.filter(d => d.id === id));
		}, [])[0];
	}

	getCatalogItemByUid(uid) {
		return this.getCatalogs().reduce((r, catalog) => {
			return r.concat(catalog.descriptors.filter(d => UID.from(d) === uid));
		}, [])[0];
	}

	getTransientCatalogItemByUid(uid) {
		return this.getTransientCatalogs().reduce((r, catalog) => {
			return r.concat(catalog.descriptors.filter(d => UID.from(d) === uid));
		}, [])[0];
	}

	removeCatalogItem(deleteItem = {}) {
		this.getCatalogs().map(catalog => {
			catalog.descriptors = catalog.descriptors.filter(d => d.id !== deleteItem.id);
			return catalog;
		});
	}

	addNewItemToCatalog(newItem) {
		const type = newItem.uiState.type;
		this.getCatalogs().filter(d => d.type === type).forEach(catalog => {
			catalog.descriptors.push(newItem);
		});
		// update indexes and integrate new model into catalog
		this.updateCatalogIndexes(this.getCatalogs());
		return this.getCatalogItemById(newItem.id);
	}

	updateCatalogIndexes(catalogs) {
		// associate catalog identity with individual descriptors so we can
		// update the catalog when any given descriptor is updated also add
		// vnfd model to the nsd object to make it easier to render an nsd
		const vnfdLookup = {};
		const updatedCatalogs = catalogs.map(catalog => {
			catalog.descriptors.map(descriptor => {
				if (typeof descriptor.meta === 'string' && descriptor.meta.trim() !== '') {
					try {
						descriptor.uiState = JSON.parse(descriptor.meta);
					} catch (ignore) {
						console.warn('Unable to deserialize the uiState property.');
					}
				} else if (typeof descriptor.meta === 'object') {
					descriptor.uiState = descriptor.meta;
					descriptor.meta = JSON.stringify(descriptor.meta);
				}

				const uiState = descriptor.uiState || (descriptor.uiState = {});
				uiState.catalogId = catalog.id;
				uiState.catalogName = catalog.name;
				uiState.type = catalog.type;
				if (!UID.hasUniqueId(uiState)) {
					UID.assignUniqueId(uiState);
				}
				if (catalog.type === 'vnfd') {
					vnfdLookup[descriptor.id] = descriptor;
				}
				return descriptor;
			});
			return catalog;
		});
		updatedCatalogs.filter(d => d.type === 'nsd').forEach(catalog => {
			catalog.descriptors = catalog.descriptors.map(descriptor => {
				if (descriptor['constituent-vnfd']) {
					descriptor.vnfd = descriptor['constituent-vnfd'].map(d => {
						const vnfdId = d['vnfd-id-ref'];
						const vnfd = vnfdLookup[vnfdId];
						if (!vnfd) {
							throw new ReferenceError('no VNFD found in the VNFD Catalog for the constituent-vnfd: ' + d);
						}
						// create an instance of this vnfd to carry transient ui state properties
						const instance = _cloneDeep(vnfd);
						instance.uiState['member-vnf-index'] = d['member-vnf-index'];
						instance['vnf-configuration'] = d['vnf-configuration'];
						instance['start-by-default'] = d['start-by-default'];
						return instance;
					});
				}
				return descriptor;
			});
		});
		return updatedCatalogs;
	}

	updateCatalogItem(item) {
		// replace the given item in the catalog
		const catalogs = this.getCatalogs().map(catalog => {
			if (catalog.id === item.uiState.catalogId) {
				catalog.descriptors = catalog.descriptors.map(d => {
					if (d.id === item.id) {
						return item;
					}
					return d;
				});
			}
			return catalog;
		});
		this.setState({ catalogs: catalogs });
	}

	mergeEditsIntoLatestFromServer(catalogsFromServer = []) {

		// if the UI has modified items use them instead of the server items

		const currentData = this.getCatalogs();

		const modifiedItemsMap = currentData.reduce((result, catalog) => {
			return result.concat(catalog.descriptors.filter(d => d.uiState.modified));
		}, []).reduce((r, d) => {
			r[d.uiState.catalogId + '/' + d.id] = d;
			return r;
		}, {});

		const itemMetaMap = currentData.reduce((result, catalog) => {
			return result.concat(catalog.descriptors.filter(d => d.uiState));
		}, []).reduce((r, d) => {
			r[d.uiState.catalogId + '/' + d.id] = d.uiState;
			return r;
		}, {});

		const newItemsMap = currentData.reduce((result, catalog) => {
			result[catalog.id] = catalog.descriptors.filter(d => d.uiState.isNew);
			return result;
		}, {});

		catalogsFromServer.forEach(catalog => {
			catalog.descriptors = catalog.descriptors.map(d => {
				const key = d.uiState.catalogId + '/' + d.id;
				if (modifiedItemsMap[key]) {
					// use local modified item instead of the server item
					return modifiedItemsMap[key];
				}
				if (itemMetaMap[key]) {
					Object.assign(d.uiState, itemMetaMap[key]);
				}
				return d;
			});
			if (newItemsMap[catalog.id]) {
				catalog.descriptors = catalog.descriptors.concat(newItemsMap[catalog.id]);
			}
		});

		return catalogsFromServer;

	}

	loadCatalogsSuccess(context) {
		const fromServer = this.updateCatalogIndexes(context.data);
		let catalogs = this.mergeEditsIntoLatestFromServer(fromServer);
		if (this.isNotMergedWithSessionStorage) {
			catalogs = this.mergeDirtyDescriptorsFromSessionStorage(catalogs);
		}
		this.setState({
			catalogs: catalogs,
			isLoading: false
		});
	}

	deleteCatalogItemSuccess(response) {
		let catalogType = response.catalogType;
		let itemId = response.itemId;
		const catalogs = this.getCatalogs().map(catalog => {
			if (catalog.type === catalogType) {
				catalog.descriptors = catalog.descriptors.map(d => {
					// We are just going to mark it as deleted here so it will be hidden from view.
					// We will let the next catalog refresh actually remove it from the in memory store.
					// This is to avoid having it reappear because a timing issue with a catalog refresh.
					// The incoming refresh may still contain the item and it would then reappear till the next refresh.
					if (d.id === itemId) {
						d.uiState.deleted = true;
						const activeItem = ComposerAppStore.getState().item;
						if (activeItem && activeItem.id === itemId) {
							ComposerAppActions.showDescriptor.defer();
							CatalogItemsActions.editCatalogItem.defer(null);
						}
					}
					return d;
				});
			}
			return catalog;
		});
		this.setState({ catalogs: catalogs });
		this.queueDirtyCheck();
	}

	deleteCatalogItemError(data) {
		console.log('Unable to delete', data.catalogType, 'id:', data.itemId, 'Error:', data.error.responseText);
		ComposerAppActions.showError.defer({
			errorMessage: 'Unable to delete ' + data.catalogType + ' id: ' + data.itemId + '. Check to see if it is in use.'
		});
	}

	selectCatalogItem(item = {}) {
		SelectionManager.select(item);
	}

	catalogItemMetaDataChanged(item) {
		let requiresSave = false;
		let previousVersion = this.getLatestSnapshot(item);
		// compare just the catalog uiState data 
		const modified = !areCatalogItemsMetaDataEqual(previousVersion, item);
		if (modified) {
			item.uiState.modified = true;
			this.updateCatalogItem(item);
			this.addSnapshot(item);
			this.queueDirtyCheck();
		}
	}

	catalogItemDescriptorChanged(itemDescriptor) {
		// when a descriptor object is modified in the canvas we have to update the catalog
		const catalogId = itemDescriptor.uiState.catalogId;
		const catalogs = this.getCatalogs().map(catalog => {
			if (catalog.id === catalogId) {
				// find the catalog
				const descriptorId = itemDescriptor.id;
				// replace the old descriptor with the updated one
				catalog.descriptors = catalog.descriptors.map(d => {
					if (d.id === descriptorId) {
						itemDescriptor.model.uiState.modified = true;
						this.addSnapshot(itemDescriptor.model);
						return itemDescriptor.model;
					}
					return d;
				});
			}
			return catalog;
		});
		this.setState({ catalogs: catalogs })
		this.queueDirtyCheck();
	}

	deleteSelectedCatalogItem() {
		SelectionManager.getSelections().forEach(selectedId => {
			const item = this.getCatalogItemByUid(selectedId);
			if (item) {
				this.deleteCatalogItem(item);
			}
		});
		SelectionManager.clearSelectionAndRemoveOutline();
	}

	deleteCatalogItem(item) {
		if (item) {
			CatalogDataStore.confirmDelete(event => {
				event.preventDefault();
				ModalOverlayActions.showModalOverlay.defer();
				this.getInstance().deleteCatalogItem(item.uiState.type, item.id)
					.then(ModalOverlayActions.hideModalOverlay, ModalOverlayActions.hideModalOverlay)
					.catch(function () {
						console.log('overcoming ES6 unhandled rejection red herring');
					});
			}, );
		}
	}

	static confirmDelete(onClickYes, onClickCancel) {
		const cancelDelete = onClickCancel || (e => ModalOverlayActions.hideModalOverlay.defer());
		ModalOverlayActions.showModalOverlay.defer((
			<div className="actions panel">
				<div className="panel-header">
					<h1>Delete the selected catalog item?</h1>
				</div>
				<div className="panel-body">
					<a className="action confirm-yes primary-action Button" onClick={onClickYes}>Yes, delete selected catalog item</a>
					<a className="action cancel secondary-action Button" onClick={cancelDelete}>No, cancel</a>
				</div>
			</div>
		));
	}

	createCatalogItem(type = 'nsd') {
		const newItem = createItem(type);
		this.saveItem(newItem)
	}

	duplicateSelectedCatalogItem() {
		// make request to backend to duplicate an item
		const srcItem = this.getFirstSelectedCatalogItem();
		if (srcItem) {
			CatalogPackageManagerActions.copyCatalogPackage.defer(srcItem);
		}
	}

	addSnapshot(item) {
		if (item) {
			if (!this.snapshots[item.id]) {
				this.snapshots[item.id] = [];
			}
			// save the snapshot with a new id for an in memory instance
			let uid = UID.from(item);
			UID.assignUniqueId(item);
			this.snapshots[item.id].push(JSON.stringify(item));
			UID.assignUniqueId(item, uid);
		}
	}

	getLatestSnapshot(item) {
		if (this.snapshots[item.id]) {
			return JSON.parse(this.snapshots[item.id][this.snapshots[item.id].length - 1]);
		}
		this.getCatalogs().forEach(catalog => {
			if (catalog.id === item.uiState.catalogId) {
				catalog.descriptors.forEach(d => {
					if (d.id === item.id) {
						return d;
					}
				});
			}
		});
		return {};
	}

	resetSnapshots(item) {
		if (item) {
			this.snapshots[item.id] = [];
			this.addSnapshot(item);
		}
	}

	editCatalogItem(item) {
		if (item) {
			this.addSnapshot(item);
			// replace the given item in the catalog
			const catalogs = this.getCatalogs().map(catalog => {
				catalog.descriptors = catalog.descriptors.map(d => {
					// note only one item can be "open" at a time
					// so remove the flag from all the other items
					d.uiState.isOpenForEdit = (d.id === item.id);
					if (d.uiState.isOpenForEdit) {
						return item;
					}
					return d;
				});
				return catalog;
			});
			this.setState({ catalogs: catalogs });
			this.catalogItemMetaDataChanged(item);
		}
	}

	cancelCatalogItemChanges() {
		const activeItem = ComposerAppStore.getState().item;
		if (activeItem) {
			const snapshots = this.snapshots[activeItem.id];
			if (snapshots.length) {
				const revertTo = JSON.parse(snapshots[0]);
				this.updateCatalogItem(revertTo);
				// TODO should the cancel action clear the undo/redo stack back to the beginning?
				this.resetSnapshots(revertTo);
				CatalogItemsActions.editCatalogItem.defer(revertTo);
				this.queueDirtyCheck();
			}
		}
	}

	saveCatalogItem() {
		const activeItem = ComposerAppStore.getState().item;
		if (activeItem) {
			this.saveItem(activeItem);
		}
	}

	saveItem(item) {
		if (item) {
			const success = () => {
				delete item.uiState.modified;
				if (item.uiState.isNew) {
					this.addNewItemToCatalog(item);
					delete item.uiState.isNew;
				} else {
					this.updateCatalogItem(item);
				}
				// TODO should the save action clear the undo/redo stack back to the beginning?
				this.resetSnapshots(item);
				ModalOverlayActions.hideModalOverlay.defer();
				CatalogItemsActions.editCatalogItem.defer(item);
				this.queueDirtyCheck();
			};
			const failure = () => {
				ModalOverlayActions.hideModalOverlay.defer();
				CatalogItemsActions.editCatalogItem.defer(item);
			};
			const exception = () => {
				console.warn('unable to save catalog item', item);
				ModalOverlayActions.hideModalOverlay.defer();
				CatalogItemsActions.editCatalogItem.defer(item);
			};
			ModalOverlayActions.showModalOverlay.defer();
			this.getInstance().saveCatalogItem(item).then(success, failure).catch(exception);
		}
	}

	exportSelectedCatalogItems(draggedItem) {
		// collect the selected items and delegate to the catalog package manager action creator
		const selectedItems = this.getAllSelectedCatalogItems();
		if (selectedItems.length) {
			CatalogPackageManagerActions.downloadCatalogPackage.defer({
				selectedItems: selectedItems,
				selectedFormat: 'mano',
				selectedGrammar: 'osm'
			});
			this.resetSelectionState();
		}
	}
	saveCatalogItemError(data) {
		const descriptor = this.getCatalogs().reduce((gotIt, catalog) => {
			if (!gotIt && (catalog.type === data.catalogType)) {
				return catalog.descriptors.find(d => {
					if (d.id === data.itemId) {
						return d;
					}
				});
			}
			return gotIt;
		}, null);
		const container = data.catalogType === 'nsd' ?
			DescriptorModelFactory.newNetworkService(descriptor, null)
			: DescriptorModelFactory.newVirtualNetworkFunction(descriptor, null)
		ComposerAppActions.showError.defer({
			errorMessage: 'Unable to save the descriptor.',
			rpcError: data.error.responseText
		});
		ComposerAppActions.recordDescriptorError.defer({
			descriptor: container,
			type: data.catalogType,
			id: data.itemId,
			error: data.error.responseText
		})
	}
}

export default alt.createStore(CatalogDataStore, 'CatalogDataStore');

