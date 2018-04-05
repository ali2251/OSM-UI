/*
 *
 *   Copyright 2016-2017 RIFT.IO Inc
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

import _debounce from 'lodash/debounce';
import React from 'react'
import ClassNames from 'classnames'
import changeCase from 'change-case'
import Property from '../../libraries/model/DescriptorModelMetaProperty'
import CatalogDataStore from '../../stores/CatalogDataStore'
import _isInt from 'validator/lib/isInt'
import _toInt from 'validator/lib/toInt'
import _isFloat from 'validator/lib/isFloat'
import _toFloat from 'validator/lib/toFloat'
import _trim from 'validator/lib/trim'
import _isIP from 'validator/lib/isIP'

import { startEditing, endEditing, onFocusPropertyFormInputElement } from './EditDescriptorUtils'
import Select from './Select'

function validateRequired(isRequired, value) {
	value = value.trim();
	return isRequired && !value ? { success: false, message: "A value is required." } : { success: true, value: null };
}

function editorExitHandler(isValueRequired, onExit, onError, event) {
	const value = event.target.value;
	const result = validateRequired(isValueRequired, value);
	onExit && onExit(result);
	endEditing();
}

function Enumeration(props) {
	const { id, property, title, readOnly, onChange, onError, onExit } = props;
	let value = props.value;
	const enumeration = Property.getEnumeration(property, value);
	const hasDefaultValue = !!property['default-value'];
	const required = property.mandatory || hasDefaultValue;
	if (!value && hasDefaultValue) {
		value = property['default-value'];
	}
	return (
		<Select
			id={id}
			value={value}
			options={enumeration}
			title={title}
			placeholder={property.name}
			onChange={onChange}
			onExit={editorExitHandler.bind(null, required, onExit, onError)}
			required={required} r
			readOnly={readOnly} />
	);
}

function Reference(props) {
	const { id, property, title, path, container, readOnly, onChange, onError, onExit } = props;
	let value = props.value;
	const catalogs = props.catalogs || CatalogDataStore.getTransientCatalogs();
	let fullPathString = container.key + ':' + path.join(':');
	let containerRef = container;
	while (containerRef.parent) {
		fullPathString = containerRef.parent.key + ':' + fullPathString;
		containerRef = containerRef.parent;
	}
	const leafRefPathValues = Property.getLeafRef(property, path, value, fullPathString, catalogs, container);
	const required = property.mandatory;
	if (value && !leafRefPathValues.find(option => option.isSelected)) {
		value = null;
	}

	return (
		<Select
			id={id}
			value={value}
			options={leafRefPathValues}
			title={title}
			placeholder={property.name}
			onChange={onChange}
			onExit={editorExitHandler.bind(null, required, onExit, onError)}
			required={required}
			readOnly={readOnly} />
	);
}

function Boolean(props) {
	const { id, property, title, readOnly, onChange, onError, onExit } = props;
	let value = props.value;
	const hasDefaultValue = !!property['default-value'];
	const required = property.mandatory || hasDefaultValue;
	const typeOfValue = typeof value;
	if (typeOfValue === 'number' || typeOfValue === 'boolean') {
		value = value ? 'TRUE' : 'FALSE';
	} else if (value) {
		value = value.toUpperCase();
	} else {
		if (hasDefaultValue) {
			value = ('' + property['default-value']).toUpperCase();
		}
	}
	const options = [
		{ name: "TRUE", value: 'TRUE' },
		{ name: "FALSE", value: 'FALSE' }
	]
	return (
		<Select
			id={id}
			value={value}
			options={options}
			title={title}
			placeholder={property.name}
			onChange={onChange}
			onExit={editorExitHandler.bind(null, required, onExit, onError)}
			required={required}
			readOnly={readOnly} />
	);
}

function Empty(props) {
	// A null value indicates the leaf exists (as opposed to undefined).
	// We stick in a string when the user actually sets it to simplify things
	// but the correct thing happens when we serialize to user data
	const EMPTY_LEAF_PRESENT = '--empty-leaf-set--';
	const { id, property, value, title, readOnly, onChange } = props;
	let isEmptyLeafPresent = !!value;
	let present = isEmptyLeafPresent ? EMPTY_LEAF_PRESENT : "";
	const options = [
		{ name: "Enabled", value: EMPTY_LEAF_PRESENT }
	]

	return (
		<Select
			id={id}
			value={present}
			placeholder={"Not Enabled"}
			options={options}
			title={title}
			onChange={onChange}
			readOnly={readOnly} />
	);
}

function getValidator(property) {
	function validateInteger(constraints, value) {
		return _isInt(value, constraints) ? { success: true, value: _toInt(value) } :
			{ success: false, value, message: "The value is not an integer or does not meet the property constraints." };
	}
	function validateDecimal(constraints, value) {
		return _isFloat(value, constraints) ? { success: true, value: _toFloat(value) } :
			{ success: false, value, message: "The value is not a decimal number or does not meet the property constraints." };
	}
	function validateProperty(validator, errorMessage, value) {
		return validator(value) ? { success: true, value } :
			{ success: false, value, message: errorMessage };
	}
	const name = property.name;
	if (name === 'ip-address' || name.endsWith('-ip-address')) {
		return validateProperty.bind(null, _isIP, "The value is not a valid ip address.")
	}
	switch (property['data-type']) {
		case 'int8':
			return validateInteger.bind(null, { min: -128, max: 127 });
		case 'int16':
			return validateInteger.bind(null, { min: -32768, max: 32767 });
		case 'int32':
			return validateInteger.bind(null, { min: -2147483648, max: 2147483647 });
		case 'int64':
			return validateInteger.bind(null, null);
		case 'uint8':
			return validateInteger.bind(null, { min: 0, max: 255 });
		case 'uint16':
			return validateInteger.bind(null, { min: 0, max: 65535 });
		case 'uint32':
			return validateInteger.bind(null, { min: 0, max: 4294967295 });
		case 'uint64':
			return validateInteger.bind(null, { min: 0 });
		case 'decimal64':
			return validateDecimal.bind(null, null)
		case 'string':
		default:
			return function (value) { return { success: true, value } };
	}
}

function messageTemplate(strings, ...keys) {
	return (function (...vars) {
		let helpInfo = vars.reduce((o, info) => Object.assign(o, info), {});
		return keys.reduce((s, key, i) => {
			return s + helpInfo[key] + strings[i + 1];
		}, strings[0]);
	});
}

const errorMessage = messageTemplate`"${'value'}" is ${'error'}. ${'message'}`;

class Input extends React.Component {
	constructor(props) {
		super(props);
		let originalValue = props.value ? props.value : null; // normalize empty value
		this.state = { originalValue };
	}

	componentWillReceiveProps(nextProps) {
		const { value } = nextProps
		if (value !== this.state.originalValue) {
			let originalValue = value ? value : null; // normalize empty value
			this.setState({ originalValue })
		}
	}

	render() {
		const { id, property, value, title, readOnly, onChange, onError, onExit } = this.props;
		const { originalValue } = this.state;
		const isGuid = Property.isGuid(property);
		const className = ClassNames(property.name + '-input', { '-is-guid': isGuid, '-is-required': required });
		const placeholder = property.name;
		const required = property.mandatory;

		const validator = getValidator(property);
		function handleValueChanged(newValue) {
			newValue = newValue.trim();
			const result = !newValue ? validateRequired(required, newValue) : validator(newValue);
			result.success ? (originalValue !== result.value) && onChange(result.value) : onError(result.message);
		}
		const changeHandler = _debounce(handleValueChanged, 2000);
		function onInputChange(e) {
			e.preventDefault();
			changeHandler(_trim(e.target.value));
		}
		function onBlur(e) {
			changeHandler.cancel();
			const value = _trim(e.target.value);
			const result = !value ? validateRequired(required, value) : validator(value);
			if (result.success) {
				// just in case we missed it by cancelling the debouncer
				(originalValue !== result.value) && onChange(result.value);
			}
			onExit(result);
		}
		if (property['preserve-line-breaks']) {
			return (
				<textarea
					cols="5"
					id={id}
					defaultValue={value}
					placeholder={placeholder}
					className={className}
					onChange={readOnly ? null : onInputChange}
					onFocus={onFocusPropertyFormInputElement}
					onBlur={readOnly ? null : editorExitHandler.bind(null, required, onExit, onError)}
					onMouseDown={startEditing}
					onMouseOver={startEditing}
					onMouseOut={endEditing}
					onMouseLeave={endEditing}
					required={required} readOnly={readOnly} />
			);
		}
		return (
			<input
				id={id}
				type="text"
				defaultValue={value}
				className={className}
				placeholder={placeholder}
				onChange={readOnly ? null : onInputChange}
				onFocus={onFocusPropertyFormInputElement}
				onBlur={readOnly ? null : onBlur}
				onMouseDown={startEditing}
				onMouseOver={startEditing}
				onMouseOut={endEditing}
				onMouseLeave={endEditing}
				required={required} readOnly={readOnly}
			/>
		);
	}
}

export {
	Input,
	Empty,
	Boolean,
	Reference,
	Enumeration
};