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
import changeCase from 'change-case'
import Button from '../Button'
import ClassNames from 'classnames'
import CatalogItemsActions from '../../actions/CatalogItemsActions'
import DescriptorModelMetaFactory from '../../libraries/model/DescriptorModelMetaFactory'
import Property from '../../libraries/model/DescriptorModelMetaProperty'
import utils from '../../libraries/utils'

import PropertyPanel from './PropertyPanel'
import Select from './Select'

import '../../styles/EditDescriptorModelProperties.scss'
import imgAdd from '../../../../node_modules/open-iconic/svg/plus.svg'

export default function (props) {
	const { id, property, value, readOnly, onChange, showHelp, children } = props;

	const title = changeCase.titleCase(property.name);
	const helpText = showHelp ? property.description : null;
	const cases = property.properties.map(d => ({ name: d.name, value: d.name }));

	return (
		<div className='-is-leaf'>
			<PropertyPanel title={title} helpText={helpText}>
				<div className="choice">
					<Select
						id={id}
						value={value}
						options={cases}
						title={title}
						placeholder={property.name}
						onChange={onChange}
						readOnly={readOnly} />
					{children}
				</div>
			</PropertyPanel >
		</div >
	);
}
