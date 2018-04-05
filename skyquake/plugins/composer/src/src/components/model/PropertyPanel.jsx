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
import { TextIcon } from 'react-open-iconic-svg';
import { CaretRightIcon } from 'react-open-iconic-svg';
import { CaretBottomIcon } from 'react-open-iconic-svg';
import PanelHeader from './PanelHeader'


import '../../styles/EditDescriptorModelProperties.scss'

export default function PropertyPanel(props) {
	const {
		title, children, info, action, helpText,
		readOnly, showOpened, onChangeOpenState } = props;
	const isExpandCollapseButtonNeeded = !!onChangeOpenState;
	const isOpened = isExpandCollapseButtonNeeded ? showOpened : true;

	const val = (isOpened && children && (Array.isArray(children) ? children.length : true)) ?
		<val className="property-value">
			{children}
		</val>
		: null;
	return (
		<div className={'property'}>
			<PanelHeader name={title} info={info} helpText={helpText}
				showOpened={showOpened} onChangeOpenState={onChangeOpenState}
				action={readOnly ? null : action} />
			{val}
		</div>
	);
}
