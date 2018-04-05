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
import React from 'react';
import Button from '../Button'
import ClassNames from 'classnames'
import changeCase from 'change-case'
import Property from '../../libraries/model/DescriptorModelMetaProperty'
import { Input, Empty, Boolean, Reference, Enumeration } from './LeafEditor'

import '../../styles/EditDescriptorModelProperties.scss'

function buildEditor(container, property, path, value, readOnly, id, onChange, onError, onExit) {
	const title = path.join('.');

	let editor = null;
	if (Property.isEnumeration(property)) {
		editor = <Enumeration
			property={property}
			id={id}
			value={value}
			title={title}
			onChange={onChange} onError={onError} onExit={onExit}
			readOnly={readOnly}
		/>
	} else if (Property.isLeafRef(property)) {
		editor = <Reference
			container={container}
			property={property}
			path={path}
			value={value}
			id={id}
			title={title}
			onChange={onChange} onError={onError} onExit={onExit}
			readOnly={readOnly}
		/>
	} else if (Property.isBoolean(property)) {
		editor = <Boolean
			property={property}
			id={id}
			value={value}
			title={title}
			onChange={onChange} onError={onError} onExit={onExit}
			readOnly={readOnly}
		/>
	} else if (Property.isLeafEmpty(property)) {
		editor = <Empty
			property={property}
			id={id}
			value={value}
			title={title}
			onChange={onChange} onError={onError} onExit={onExit}
			readOnly={readOnly}
		/>
	} else if (Property.name === 'meta') {
		if (typeof value === 'object') {
			value = JSON.stringify(value, undefined, 12);
		} else if (typeof value !== 'string') {
			value = '{}';
		}
	} else {
		editor = <Input
			property={property}
			id={id}
			value={value}
			title={title}
			onChange={onChange} onError={onError} onExit={onExit}
			readOnly={readOnly}
		/>
	}
	return editor;
}

export default class LeafField extends React.Component {
	constructor(props) {
		super(props);
		this.state = { showHelp: props.showHelp, isInError: props.errorMessage };
	}
	componentWillReceiveProps(nextProps) {
		const { showHelp, errorMessage } = nextProps
		if (showHelp !== this.state.showHelp && !this.state.isInError) {
			this.setState({ showHelp })
		}
		if (errorMessage !== this.state.errorMessage) {
			this.setState({ showHelp: !!errorMessage || showHelp, isInError: errorMessage })
		}
	}
	render() {
		const { container, property, path, value, id, readOnly, onChange, onError } = this.props;
		let title = changeCase.titleCase(property.name);
		const showHelp = this.state.showHelp;
		const description = property.description;
		const helpText = this.state.isInError ? this.state.isInError + " " + description : description;
		if (property.mandatory) {
			title = "* " + title;
		}
		const errorHandler = (message) => {
			this.setState({ showHelp: true, isInError: message });
		}
		const changeHandler = (value) => {
			this.setState({ showHelp: this.props.showHelp, isInError: false });
			onChange && onChange(value);
		}
		const exitHandler = (exitResult) => {
			if (!exitResult.success) {
				// errorHandler(exitResult.message);
				onError && onError(exitResult.message);
			}
		}

		const editor = buildEditor(
			container, property, path, value, readOnly, id,
			changeHandler, errorHandler, exitHandler);
		const helpStyle = {
			display: showHelp ? 'inline-block' : 'none',
			paddingTop: '2px',
			color: this.state.isInError ? 'red' : 'inherit'
		};
		return (
			<div className={ClassNames('leaf-property -is-leaf property')}>
				<h3 className="property-label">
					<label htmlFor={id}>
						<span className={'leaf-name name info'}>{title}</span>
					</label>
				</h3>
				<val className="property-value">
					<div className={ClassNames('property-content')}>
						{editor}
					</div>
				</val>
				<span className={'leaf-description description'}
					style={helpStyle}>{helpText}</span>
			</div>
		);
	}
}