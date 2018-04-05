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

import _includes from 'lodash/includes'
import _isArray from 'lodash/isArray'
import changeCase from 'change-case'
import utils from '../utils'

export default {
	isLeaf(property = {}) {
		return /leaf|leaf_list/.test(property.type);
	},
	isList(property = {}) {
		return property.type === 'list';
	},
	isContainer(property = {}) {
		return property.type === 'container';
	},
	isChoice(property = {}) {
		return property.type === 'choice';
	},
	isLeafList(property = {}) {
		return property.type === 'leaf_list';
	},
}