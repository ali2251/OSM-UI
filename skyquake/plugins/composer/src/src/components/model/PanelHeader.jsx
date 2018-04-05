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
import { CaretRightIcon } from 'react-open-iconic-svg';
import { CaretBottomIcon } from 'react-open-iconic-svg';

import '../../styles/EditDescriptorModelProperties.scss'

export default function PanelHeader(props) {
	const {
		name, info, action, helpText,
		showOpened, onChangeOpenState } = props;

	function onClickOpenClose(e) {
		onChangeOpenState();
	}
	function onClickAction(e) {
		e.preventDefault();
		action.invoke();
	}

	const isExpandCollapseButtonNeeded = !!onChangeOpenState;
	const isOpened = isExpandCollapseButtonNeeded ? showOpened : true;
	const actionButton = isOpened && action ?
		<Button className="inline-hint" onClick={onClickAction} label={action.title} src={action.icon} />
		: null;
	const expandoButtonStyle = { fill: '#586e75', cursor: 'pointer' };
	const expandoButton = !isExpandCollapseButtonNeeded ? null : isOpened ?
		<CaretBottomIcon style={expandoButtonStyle} onClick={onClickOpenClose} />
		: <CaretRightIcon style={expandoButtonStyle} onClick={onClickOpenClose} />;
	const help = isOpened && helpText ? <span className={'description'} >{helpText}</span> : null;
	return (
		<div>
			<h3 className='property-label'>
				{expandoButton}
				<span className={'name'} onClick={onClickOpenClose} style={{cursor: 'pointer'}} >{name}</span>
				<small>
					<span className={'info'}>{info}</span>
				</small>
				{actionButton}
			</h3>
			<div>{help}</div>
		</div>
	)
}

