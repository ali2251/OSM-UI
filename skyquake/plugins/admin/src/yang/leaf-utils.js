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
 * Created by onvelocity on 1/27/16.
 *
 * This class provides utility methods for interrogating an instance of model uiState object.
 */

export default {
	isString(property = {}) {
		return (typeof(property['data-type']) == 'string') && (property['data-type'].toLowerCase() == 'string')
	},
	isBoolean(property = {}) {
		return (typeof(property['data-type']) == 'string') && (property['data-type'].toLowerCase() == 'boolean')
	},
	isLeafEmpty(property = {}) {
		return (typeof(property['data-type']) == 'string') && (property['data-type'].toLowerCase() == 'empty')
	},
	isLeaf(property = {}) {
        return property.type === 'leaf';
	},
	isLeafOrLeafList(property = {}) {
        return property.type === 'leaf' || property.type === 'leaf_list';
	},
	isLeafList(property = {}) {
        return property.type === 'leaf_list';
	},
	isList(property = {}) {
        return property.type === 'list';
	},
	isLeafRef(property = {}) {
		const type = property['data-type'] || {};
		return type.hasOwnProperty('leafref');
	},
	isEnumeration(property = {}) {
		const type = property['data-type'] || {};
		return type.hasOwnProperty('enumeration');
	},
	isRequired(property = {}) {
		return property.mandatory === 'true';
	},
	isKey(property = {}) {
		return property['is-key'] === 'true';
	},
	isJSON(property = {}) {
		property.name.match(/(vnfd|nsd):meta$/)
	},
	getDefaultValue(property = {}) {
		if (property['default-value']) {
			return property['default-value'];
		}
		return null;
	},
	getEnumeration(property = {}, value) {
		const enumeration = property['data-type'].enumeration.enum;
		if (typeof enumeration === 'string') {
			return [{name: enumeration, value: enumeration, isSelected: String(value) === enumeration}];
		}
		return Object.keys(enumeration).map(enumName => {
			let enumValue = enumName;
			// warn we only support named enums and systematically ignore enum values
			//const enumObj = enumeration[enumName];
			//if (enumObj) {
			//	enumValue = enumObj.value || enumName;
			//}
			return {name: enumName, value: enumValue, isSelected: String(enumValue) === String(value)};
		});
	},
	getDisplayValue(property = {}, rawValue) {
		if (this.isLeafEmpty(property) && rawValue !== undefined && rawValue !== null) {
			return "Enabled";
		} if (this.isLeafList(property) && Array.isArray(rawValue)) {
			return rawValue.join(", ");
		}
		return rawValue;
	},

	isValueSet(property = {}, rawValue) {
		return !(
			   (typeof rawValue === 'undefined')
			|| (rawValue == null)
			|| (typeof rawValue === 'string' && rawValue.length === 0)
		);
	}
}
