
/*
 * 
 *   Copyright 2017 RIFT.IO Inc
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

import React from 'react'
import _keys from 'lodash/keys'
import _get from 'lodash/get'
import _isObject from 'lodash/isObject'
import _isArray from 'lodash/isArray'
import Button from './Button'
import PropertyCrumb from './model/PropertyCrumb'
import PropertyNavigate from './model/PropertyNavigate'
import DescriptorEditorActions from '../actions/DescriptorEditorActions'
import Select from 'react-select';
import 'react-select/dist/react-select.css'
import '../styles/DetailsPanelErrors.scss'

export default function (props) {
	const { container, idMaker, style } = props;
	const errors = container.uiState.error;
	const errorOptions = _keys(errors).reduce((outer, k) => {
		function pieceOfPath(obj, key) {
			const node = obj[key];
			if (_isArray(node)) {
				const items = node.reduce((inner, v, i) => {
					if (v) {
						const paths = _keys(v).reduce((a, k) => {
							const paths = pieceOfPath(v, k);
							return a.concat(paths);
						}, []);
						// inner = paths.map(p => [i].concat(p));
						inner = paths.map(p => [i].concat(p));
					}
					return inner;
				}, []);
				return items.map(i => [key].concat(i));
			} else if (_isObject(node)) {
				return _keys(node).reduce((inner, k) => {
					const paths = pieceOfPath(node, k);
					return inner.concat(paths);
				}, []);
			} else {
				return [key];
			}
		}
		const paths = pieceOfPath(errors, k);
		return outer.concat(paths);
	}, []).reduce((a, path) => {
		// only add if there is an error message
		_get(errors, path) && a.push({ value: path, label: _isArray(path) ? path.join(' . ') : path})
		return a;
	}, []);
	return errorOptions.length ?
		(<PropertyNavigate container={container} idMaker={idMaker} options={errorOptions} 
			style={style} placeholder="Select error to correct" />)
		: <div />;
}

