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
import PanelHeader from './PanelHeader'
import RemoveItemButton from './RemoveItemButton'

import '../../styles/EditDescriptorModelProperties.scss'
import imgAdd from '../../../../node_modules/open-iconic/svg/plus.svg'
import imgRemove from '../../../../node_modules/open-iconic/svg/trash.svg'

function ListItemHeader(props) {
	const { 
		property, showOpened, onChangeOpenState, 
		info, summary, readOnly, removeItemHandler } = props;
	const className = ClassNames(property.name + '-property');
	const title = changeCase.title(property.name);
	const name = showOpened ? title : summary ? '' : title;
	const newInfo = showOpened ? info : summary || info;
	return (
		<div className={className}>
			<PanelHeader name={name} info={newInfo}
				showOpened={showOpened} onChangeOpenState={onChangeOpenState}
				action={readOnly ? null : { invoke: removeItemHandler, icon: imgRemove, title: "Remove" }} />
		</div>
	);
}
function ListItem(props) {
	const { 
		property, info, summary, readOnly, 
		showOpened, onChangeOpenState, children, removeItemHandler } = props;
	return (
		<div className={'property-content'}>
			<ListItemHeader property={property} info={info} summary={summary} 
				showOpened={showOpened} onChangeOpenState={onChangeOpenState}
				readOnly={readOnly} removeItemHandler={removeItemHandler} />
			{showOpened ? children : null}
		</div>
	);
}


class List extends React.Component {
	constructor(props) {
		super(props);
	}
	render() {
		const {
			property, value, readOnly, showHelp, tip, showOpened,
			onChangeOpenState, children, addItemHandler, id } = this.props;
		const title = changeCase.titleCase(property.name);
		const info = (children ? children.length : '0') + ' items';
		const description = property.description;
		const nodeType = property.type;
		const tipText = tip && !readOnly ?
			<span key="tip" className={nodeType + '-tip tip'}>{tip}</span>
			: null;

		let classNames = ['-is-array'];
		if (property.type === 'leaf_list') {
			classNames.push('-is-leaf');
		}

		return (
			<div id={id} className={ClassNames(classNames)}>
				<PropertyPanel title={title} info={info} helpText={showHelp ? description : null}
					showOpened={showOpened} onChangeOpenState={onChangeOpenState}
					action={readOnly ? null : { invoke: addItemHandler, icon: imgAdd, title: "Add" }}>
					{tipText ? [tipText].concat(children) : children}
				</PropertyPanel>
			</div >
		);
	}
}

List.defaultProps = {
}

export {
	List,
	ListItem
}