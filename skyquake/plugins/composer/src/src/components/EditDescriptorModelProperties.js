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
/**
 * Created by onvelocity on 1/18/16.
 *
 * This class generates the form fields used to edit the CONFD JSON model.
 */

import _uniqueId from 'lodash/uniqueId';
import _set from 'lodash/set';
import _get from 'lodash/get';
import _has from 'lodash/has';
import _keys from 'lodash/keys';
import _isObject from 'lodash/isObject';
import _isArray from 'lodash/isArray';
import utils from '../libraries/utils'
import React from 'react'
import changeCase from 'change-case'
import toggle from '../libraries/ToggleElementHandler'
import Property from '../libraries/model/DescriptorModelMetaProperty'
import SelectionManager from '../libraries/SelectionManager'
import ComposerAppActions from '../actions/ComposerAppActions'
import CatalogItemsActions from '../actions/CatalogItemsActions'
import DescriptorEditorActions from '../actions/DescriptorEditorActions'
import DescriptorModelFactory from '../libraries/model/DescriptorModelFactory'
import DescriptorModelMetaFactory from '../libraries/model/DescriptorModelMetaFactory'

import ModelBreadcrumb from './model/ModelBreadcrumb'
import ListItemAsLink from './model/ListItemAsLink'
import LeafField from './model/LeafField'
import { List, ListItem } from './model/List'
import ContainerWrapper from './model/Container'
import Choice from './model/Choice'

import '../styles/EditDescriptorModelProperties.scss'


function resolveReactKey(value) {
	const keyPath = ['uiState', 'fieldKey'];
	if (!_has(value, keyPath)) {
		_set(value, keyPath, _uniqueId());
	}
	return _get(value, keyPath);
}

function getTipForProperty(property) {
	return property.name === 'constituent-vnfd' ? "Drag a VNFD from the Catalog to add more." : null
}

function selectModel(container, model, property) {
	ComposerAppActions.selectModel(container.findChildByUid(model));
}

function removeListEntry(container, property, path) {
	DescriptorEditorActions.removeListItem({ descriptor: container, property, path });
}

function createAndAddItemToPath(container, property, path) {
	DescriptorEditorActions.addListItem({ descriptor: container, property, path });
}

function notifyPropertyFocused(container, path) {
	container.getRoot().uiState.focusedPropertyPath = path.join('.');
	console.debug('property selected', path.join('.'));
	ComposerAppActions.propertySelected([path.join('.')]);
}

function setPropertyOpenState(container, path, property, isOpen) {
	DescriptorEditorActions.setOpenState({ descriptor: container, property, path, isOpen });
}

function isDataProperty(property) {
	return property.type === 'leaf' || property.type === 'leaf_list' || property.type === 'choice';
}

function checkIfValueEmpty(value) {
	if (value === null || typeof value === 'undefined') {
		return true;
	} else if (_isArray(value) && !value.length) {
		return true;
	} else if (_isObject(value)) {
		const keys = _keys(value);
		if (keys.length < 2) {
			return !keys.length || (keys[0] === 'uiState')
		}
	}
	return false;
}

export default function EditDescriptorModelProperties(props) {
	const { container, idMaker, showHelp, collapsePanelsByDefault, openPanelsWithData } = props;
	const readOnly = props.readOnly || container.isReadOnly;
	const showElementHelp = showHelp.forAll;
	const uiState = container.uiState;

	function getPanelOpenedCondition(value, path) {
		const showOpened = container.getUiState('opened', path);
		if (typeof showOpened === 'undefined') {
			return (openPanelsWithData && !checkIfValueEmpty(value)) ? true : !collapsePanelsByDefault;
		}
		return showOpened;
	}

	function buildField(property, path, value, fieldKey) {
		const pathToProperty = path.join('.');
		const fieldValue = value ? (value.constructor.name != "Object") ? value : '' : (isNaN(value) ? undefined : value);

		// process the named field value change
		function processFieldValueChange(name, value) {
			console.debug('processed change for -- ' + name + ' -- with value -- ' + value);
			if (DescriptorModelFactory.isContainer(container)) {
				DescriptorEditorActions.setValue({ descriptor: container, path, value });
			}
		}

		function onErrorHandler(message) {
			DescriptorEditorActions.setError({ descriptor: container, path, message });
		}

		// create an onChange event handler for a select field for the specified field path
		const onChangeHandler = processFieldValueChange.bind(null, pathToProperty);
		return (
			<LeafField
				key={fieldKey}
				container={container}
				property={property}
				path={path}
				value={value}
				id={fieldKey}
				showHelp={showElementHelp}
				onChange={onChangeHandler}
				onError={onErrorHandler}
				readOnly={readOnly}
				errorMessage={_get(container.uiState, ['error'].concat(path))}
			/>
		);
	}

	/**
	 * buiid and return an array of components representing an editor for each property.
	 * 
	 * @param {any} container the master document being edited
	 * @param {[property]} properties 
	 * @param {string} pathToProperties path within the container to the properties
	 * @param {Object} data source for each property
	 * @returns an array of react components
	 */
	function buildComponentsForProperties(properties, pathToProperties, data) {
		return properties.map((property) => {
			let value;
			let propertyPath = pathToProperties.slice();
			if (property.type != 'choice') {
				propertyPath.push(property.name);
			}
			if (data && typeof data === 'object') {
				value = _get(data, property.name);
			}
			let result = null;
			try {
				result = buildPropertyComponent(property, propertyPath, value);
			} catch (e) {
				console.error(e);
			}
			return result;
		});
	}

	function buildChoice(property, path, value, uniqueId) {
		const uiStatePath = path.concat(['uiState']);
		const choiceStatePath = ['choice', property.name];
		const fullChoiceStatePath = uiStatePath.concat(choiceStatePath);

		function determineSelectedChoice(model) {
			let choiceState = utils.resolvePath(container.model, fullChoiceStatePath.join('.'));
			if (choiceState) {
				return property.properties.find(c => c.name === choiceState.selected);
			}
			const selectedCase = property.properties.find(c =>
				c.properties && c.properties.find(p => _has(model, path.concat([p.name])))
			);
			// lets remember this
			let stateObject = utils.resolvePath(container.model, uiStatePath.join('.'));
			stateObject = _set(stateObject || {}, choiceStatePath, { selected: selectedCase ? selectedCase.name : "" });
			utils.assignPathValue(container.model, uiStatePath.join('.'), stateObject);
			return selectedCase;
		}

		function pullOutCaseModel(caseName) {
			const model = container.model;
			const properties = property.properties.find(c => c.name === caseName).properties;
			return properties.reduce((o, p) => {
				const valuePath = path.concat([p.name]).join('.');
				const value = utils.resolvePath(model, valuePath);
				if (value) {
					o[p.name] = value;
				}
				return o;
			}, {});
		}

		function processChoiceChange(value) {
			if (DescriptorModelFactory.isContainer(container)) {
				let uiState = utils.resolvePath(container.model, uiStatePath.join('.'));
				// const stateObject = utils.resolvePath(container.model, fullChoiceStatePath.join('.')) || {};
				let choiceState = _get(uiState, choiceStatePath);
				const previouslySelectedChoice = choiceState.selected;
				if (previouslySelectedChoice === value) {
					return;
				}
				if (previouslySelectedChoice) {
					choiceState[previouslySelectedChoice] = pullOutCaseModel(previouslySelectedChoice);
				}
				const modelUpdate = _keys(choiceState[previouslySelectedChoice]).reduce((o, k) => _set(o, k, null), {})
				choiceState.selected = value;
				_set(uiState, choiceStatePath, choiceState);
				_set(modelUpdate, 'uiState', uiState);
				if (choiceState.selected) {
					const previous = choiceState[choiceState.selected];
					if (previous) {
						Object.assign(modelUpdate, previous);
					} else {
						const newChoice = property.properties.find(p => p.name === choiceState.selected);
						if (newChoice.properties.length === 1) {
							const property = newChoice.properties[0];
							if (property.type === 'leaf' && property['data-type'] === 'empty') {
								let obj = {};
								obj[property.name] = [null];
								Object.assign(modelUpdate, obj);
							}
						}
					}
				}
				DescriptorEditorActions.assignValue({ descriptor: container, path, source: modelUpdate });
			}
		}

		const selectedCase = determineSelectedChoice(container.model);
		const children = selectedCase ?
			<ContainerWrapper property={selectedCase} readOnly={readOnly} showHelp={showElementHelp} showOpened={true}>
				{buildComponentsForProperties(selectedCase.properties, path, path.length ? _get(container.model, path) : container.model)}
			</ContainerWrapper>
			: null;

		return (
			<Choice key={uniqueId} id={uniqueId} onChange={processChoiceChange} readOnly={readOnly} showHelp={showElementHelp}
				property={property} value={selectedCase ? selectedCase.name : null}
			>
				{children}
			</Choice>
		);

	}

	function buildLeafList(property, path, value, uniqueId) {
		if (!Array.isArray(value)) {
			value = [value];
		}
		const children = value && value.map((v, i) => {
			let itemPath = path.concat([i]);
			const field = buildField(property, itemPath, v, uniqueId + i);
			return (
				<ListItem key={':' + i} index={i} property={property} readOnly={readOnly} showHelp={showElementHelp}
					showOpened={true} removeItemHandler={removeListEntry.bind(null, container, property, itemPath)} >
					{field}
				</ListItem>
			)
		});
		return (
			<List key={uniqueId} id={uniqueId} property={property} value={value} readOnly={readOnly} showHelp={showElementHelp}
				showOpened={true} addItemHandler={createAndAddItemToPath.bind(null, container, property, path)}>
				{children}
			</List>
		);
	}

	function buildList(property, path, value, uniqueId) {
		if (value && !Array.isArray(value)) {
			value = [value];
		}
		function getListItemSummary(index, value) {
			const keys = property.key.map((key) => value[key]);
			const summary = keys.join(' ');
			return summary.length > 1 ? summary : '' + (index + 1);
		}
		const children = value && value.map((itemValue, i) => {
			const itemPath = path.concat([i]);
			const key = resolveReactKey(itemValue);
			const children = buildComponentsForProperties(property.properties, itemPath, itemValue);
			const showOpened = getPanelOpenedCondition(value, itemPath);
			return (
				<ListItem key={key} property={property} readOnly={readOnly} showHelp={showElementHelp}
					summary={getListItemSummary(i, itemValue)} info={'' + (i + 1)}
					removeItemHandler={removeListEntry.bind(null, container, property, itemPath)}
					showOpened={showOpened} onChangeOpenState={setPropertyOpenState.bind(null, container, itemPath, property, !showOpened)}>
					{children}
				</ListItem>
			)
		});
		const showOpened = getPanelOpenedCondition(value, path);
		return (
			<List key={uniqueId} id={uniqueId} property={property} value={value} readOnly={readOnly} showHelp={showElementHelp}
				addItemHandler={createAndAddItemToPath.bind(null, container, property, path)}
				showOpened={showOpened} onChangeOpenState={setPropertyOpenState.bind(null, container, path, property, !showOpened)}>
				{children}
			</List>
		);
	}

	function buildSimpleList(property, path, value, uniqueId) {
		if (value && !Array.isArray(value)) {
			value = [value];
		}
		const children = value && value.map((v, i) => {
			let itemPath = path.concat([i]);
			return (
				<ListItemAsLink key={':' + i} property={property} value={v}
					removeItemHandler={removeListEntry.bind(null, container, property, itemPath)}
					selectLinkHandler={selectModel.bind(null, container, v, property)} />
			)
		});
		const tip = getTipForProperty(property);
		const showOpened = getPanelOpenedCondition(value, path);
		const changeOpenState = setPropertyOpenState.bind(null, container, path, property, !showOpened);
		return (
			<List name={uniqueId} id={uniqueId} key={uniqueId} tip={tip}
				property={property} value={value} readOnly={readOnly} showHelp={showElementHelp}
				addItemHandler={createAndAddItemToPath.bind(null, container, property, path)}
				showOpened={showOpened} onChangeOpenState={changeOpenState}>
				{children}
			</List>
		);
	}

	function buildContainer(property, path, value, uniqueId) {
		const children = buildComponentsForProperties(property.properties, path, value);
		const showOpened = getPanelOpenedCondition(value, path);
		const changeOpenState = setPropertyOpenState.bind(null, container, path, property, !showOpened);
		return (
			<ContainerWrapper key={uniqueId} id={uniqueId} property={property} readOnly={readOnly}
				showHelp={showElementHelp} summary={checkIfValueEmpty(value) ? null : '*'}
				showOpened={showOpened} onChangeOpenState={changeOpenState}>
				{children}
			</ContainerWrapper>
		);
	}

	function buildPropertyComponent(property, path, value) {

		const fields = [];
		const isArray = Property.isArray(property);
		const isObject = Property.isObject(property);
		const title = changeCase.titleCase(property.name);

		// create a unique Id for use as react component keys and html element ids
		// use uid (from ui info) instead of id property (which is not stable)
		let uniqueId = idMaker(container, path);

		if (!property.properties && isObject) {
			console.debug('no properties', property);
			const uiState = DescriptorModelMetaFactory.getModelMetaForType(property.name) || {};
			property.properties = uiState.properties;
		}

		if (property.type === 'leaf') {
			return buildField(property, path, value, uniqueId);
		} else if (property.type === 'leaf_list') {
			return buildLeafList(property, path, value, uniqueId);
		} else if (property.type === 'list') {
			return Property.isSimpleList(property) ?
				buildSimpleList(property, path, value, uniqueId)
				:
				buildList(property, path, value, uniqueId);
		} else if (property.type === 'container') {
			return buildContainer(property, path, value, uniqueId);
		} else if (property.type === 'choice') {
			return buildChoice(property, path, value, uniqueId);
		} else {
			return (
				<span key={fieldId} className="warning">No Descriptor Meta for {property.name}</span>
			);
		}
	}


	if (!(DescriptorModelFactory.isContainer(container))) {
		return
	}

	const containerType = container.uiState['qualified-type'] || container.uiState.type;
	let properties = DescriptorModelMetaFactory.getModelMetaForType(containerType).properties;
	const breadcrumb = [];
	if (container.parent) {
		breadcrumb.push(container.parent);
	}
	breadcrumb.push(container);
	// bubble all data properties to top of list
	let twoLists = properties.reduce((o, property) => {
		const value = _get(container.model, [property.name]);
		if (isDataProperty(property)) {
			o.listOne.push(property);
		} else {
			o.listTwo.push(property);
		}
		return o;
	}, { listOne: [], listTwo: [] });
	properties = twoLists.listOne.concat(twoLists.listTwo);
	const children = buildComponentsForProperties(properties, [], container.model);

	function onClick(event) {
		console.debug(event.target);
		if (event.isDefaultPrevented()) {
			return;
		}
		event.preventDefault();
		event.stopPropagation();
		// notifyFocusedHandler();
	}

	function onWrapperFocus(event) {
		console.debug(event.target);
		//notifyFocusedHandler();
	}

	return (
		<div className="EditDescriptorModelProperties -is-tree-view" onClick={onClick} onFocus={onWrapperFocus}>
			<ModelBreadcrumb path={breadcrumb} />
			{children}
		</div>
	);
};

