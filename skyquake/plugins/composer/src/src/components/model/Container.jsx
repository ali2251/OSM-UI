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
import PropertyPanel from './PropertyPanel'
import changeCase from 'change-case'

import '../../styles/EditDescriptorModelProperties.scss'

export default function (props) {
	const { id, property, summary, showHelp, showOpened, onChangeOpenState, children } = props;
	const title = changeCase.titleCase(property.name);
	const helpText = showHelp ? property.description : null;
	const info = showOpened ? null : summary;
	return (
		<div id={id} className='-is-container'>
			<PropertyPanel title={title} info={info} helpText={helpText}
				showOpened={showOpened} onChangeOpenState={onChangeOpenState}>
				<div className={'property-content'} >
					{children}
				</div>
			</PropertyPanel>
		</div>
	);
}
