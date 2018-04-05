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
import _isNumber from 'lodash/isNumber';
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
import PropertyNavigate from './model/PropertyNavigate'


import '../styles/EditDescriptorModelProperties.scss'

function selectModel(container, model) {
	const root = container.getRoot();
	if (SelectionManager.select(model)) {
		CatalogItemsActions.catalogItemMetaDataChanged(root.model);
	}
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

function makeOption(path, value) {
	let labelPath = path.map(node => _isNumber(node) ? node + 1: node);
	return {
		value: path,
		label: labelPath.join(' . ') + (value ? ' : ' + value : '')
	}
}

export default function NavigateDescriptorModel(props) {
	const { container, idMaker, style } = props;
	const uiState = container.uiState;

	function buildField(property, path, value) {
		return [makeOption(path, value)];
	}

	function buildLeafList(property, path, value) {
		const searchValue = Array.isArray(value) ? value.join(' ') : value;
		return [makeOption(path, searchValue)];
	}

	function buildChoice(property, path, value) {
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
			return selectedCase;
		}

		const selectedCase = determineSelectedChoice(container.model);
		return [makeOption(path)].concat(selectedCase ?
			buildComponentsForProperties(
				selectedCase.properties, path, path.length ? _get(container.model, path) : container.model) :
			[]);
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
		const children = value ? value.reduce((a, itemValue, i) => {
			const itemPath = path.concat([i]);
			return a.concat(buildComponentsForProperties(property.properties, itemPath, itemValue));
		}, [makeOption(path)])
			: [makeOption(path)];
		return children;
	}

	function buildSimpleList(property, path, value, uniqueId) {
		return [makeOption(path)];
	}

	function buildContainer(property, path, value, uniqueId, readOnly) {
		return buildComponentsForProperties(property.properties, path, value);
	}

	/**
	 * buiid and return an array of components representing an editor for each property.
	 * 
	 * @param {any} container the master document being edited
	 * @param {[property]} properties 
	 * @param {string} pathToProperties path within the container to the properties
	 * @param {Object} data source for each property
	 * which may be useful/necessary to a components rendering.
	 * @returns an array of react components
	 */
	function buildComponentsForProperties(properties, pathToProperties, data) {
		return properties.reduce((a, property) => {
			let value;
			let propertyPath = pathToProperties.slice();
			if (property.type != 'choice') {
				propertyPath.push(property.name);
			}
			if (data && typeof data === 'object') {
				value = _get(data, property.name);
			}
			let result = [];
			try {
				result = buildPropertyComponent(property, propertyPath, value);
			} catch (e) {
				console.error(e);
			}
			return a.concat(result);
		}, []);
	}

	function buildPropertyComponent(property, path, value) {

		const fields = [];
		const isObject = Property.isObject(property);
		const title = changeCase.titleCase(property.name);

		// create a unique Id for use as react component keys and html element ids
		// use uid (from ui info) instead of id property (which is not stable)
		let uniqueId = container.uid;
		let containerRef = container;
		while (containerRef.parent) {
			uniqueId = containerRef.parent.uid + ':' + uniqueId;
			containerRef = containerRef.parent;
		}
		uniqueId += ':' + path.join(':')

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
				buildSimpleList(property, path, value, uniqueId) :
				buildList(property, path, value, uniqueId);
		} else if (property.type === 'container') {
			return buildContainer(property, path, value, uniqueId);
		} else if (property.type === 'choice') {
			return buildChoice(property, path, value, uniqueId);
		} else {
			return ([]);
		}
	}


	if (!(DescriptorModelFactory.isContainer(container))) {
		return null;
	}

	const containerType = container.uiState['qualified-type'] || container.uiState.type;
	let properties = DescriptorModelMetaFactory.getModelMetaForType(containerType).properties;
	// bubble all data properties to top of list
	let twoLists = properties.reduce((o, property) => {
		const value = _get(container.model, [property.name]);
		if (isDataProperty(property)) {
			o.listOne.push(property);
		} else {
			o.listTwo.push(property);
		}
		return o;
	}, {
			listOne: [],
			listTwo: []
		});
	properties = twoLists.listOne.concat(twoLists.listTwo);
	const options = buildComponentsForProperties(properties, [], container.model);
	return options.length ?
		(<PropertyNavigate container={container} idMaker={idMaker} options={options} 
			style={style} placeholder="Select to navigate" />)
		: <div />;
};