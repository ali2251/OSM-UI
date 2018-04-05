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

import React from 'react'
import Property from '../../libraries/model/DescriptorModelMetaProperty'
import utils from '../../libraries/utils'
import Button from '../Button'
import CatalogItemsActions from '../../actions/CatalogItemsActions'

import imgRemove from '../../../../node_modules/open-iconic/svg/trash.svg'

export default function RemoveItemButton(props) {
    const { removeItemHandler } = props;
    function onClickRemoveProperty(event) {
        event.preventDefault();
        removeItemHandler();
    }
    return (
        <Button 
            className="remove-property-action inline-hint" 
            title="Remove" 
            onClick={onClickRemoveProperty} 
            label="Remove" 
            src={imgRemove} 
        />
    );
}
