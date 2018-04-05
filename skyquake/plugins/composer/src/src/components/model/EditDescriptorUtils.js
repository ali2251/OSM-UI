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

import getEventPath from '../../libraries/getEventPath'
import DeletionManager from '../../libraries/DeletionManager'

function startEditing() {
	DeletionManager.removeEventListeners();
}

function endEditing() {
	DeletionManager.addEventListeners();
}

function onFocusPropertyFormInputElement(event) {

	console.debug('property focus ', event.target.id);
	event.preventDefault();
	startEditing();

	function removeIsFocusedClass(event) {
		event.target.removeEventListener('blur', removeIsFocusedClass);
		Array.from(document.querySelectorAll('.-is-focused')).forEach(d => d.classList.remove('-is-focused'));
	}

	removeIsFocusedClass(event);

	const propertyWrapper = getEventPath(event).reduce((parent, element) => {
		if (parent) {
			return parent;
		}
		if (!element.classList) {
			return false;
		}
		if (element.classList.contains('property')) {
			return element;
		}
	}, false);

	if (propertyWrapper) {
		propertyWrapper.classList.add('-is-focused');
		event.target.addEventListener('blur', removeIsFocusedClass);
	}
}

function getTitle(model = {}) {
	if (typeof model['short-name'] === 'string' && model['short-name']) {
		return model['short-name'];
	}
	if (typeof model.name === 'string' && model.name) {
		return model.name;
	}
	if (model.uiState && typeof model.uiState.displayName === 'string' && model.uiState.displayName) {
		return model.uiState.displayName
	}
	if (typeof model.id === 'string') {
		return model.id;
	}
}

export {
	startEditing,
	endEditing,
	onFocusPropertyFormInputElement,
	getTitle
}