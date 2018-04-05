
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
import Button from './Button'
import DescriptorEditorActions from '../actions/DescriptorEditorActions'

import '../styles/DetailsPanelToolbar.scss'

import imgQuestionMark from '../../../node_modules/open-iconic/svg/question-mark.svg'
import imgExpandAll from '../../../node_modules/open-iconic/svg/caret-right.svg'
import imgCollapseAll from '../../../node_modules/open-iconic/svg/caret-bottom.svg'
import imgCollapseSome from '../../../node_modules/open-iconic/svg/elevator.svg'

export default function (props) {
	const { container, showHelp } = props;
	function onClickAction(action, event) {
		action({ descriptor: container });
	}
	return (
		<div className="DetailsPanelToolbar">
			<div className="btn-bar">
				<div className="btn-group" style={{ display: 'inline-block' }}>
					<Button type="image" title="Expand all" className="action-onboard-catalog-package"
						onClick={onClickAction.bind(null, DescriptorEditorActions.expandAllPanels)} src={imgExpandAll} />
					<Button type="image" title="Collapse all" className="action-update-catalog-package"
						onClick={onClickAction.bind(null, DescriptorEditorActions.collapseAllPanels)} src={imgCollapseAll} />
					<Button type="image" title="Collapse only data-less panels" className="action-update-catalog-package"
						onClick={onClickAction.bind(null, DescriptorEditorActions.showPanelsWithData)} src={imgCollapseSome} />
				</div>
				<div className="btn-group" style={{ display: 'inline-block' }}>
					<Button 
						type="image" 
						label={showHelp ? "Hide" : "Show"}
						title={showHelp ? "Hide descriptions" : "Show descriptions"} 
						className="action-onboard-catalog-package"
						src={imgQuestionMark} 
						onClick={onClickAction.bind(null, 
							showHelp ? DescriptorEditorActions.showHelpForNothing 
							: DescriptorEditorActions.showHelpForAll)} 
						/>
				</div>
			</div>
		</div>
	);
}

