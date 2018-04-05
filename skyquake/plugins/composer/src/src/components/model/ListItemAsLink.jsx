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
import { getTitle } from './EditDescriptorUtils'
import DescriptorModelIconFactory from '../../libraries/model/IconFactory'
import RemoveItemButton from './RemoveItemButton'

export default function ListItemAsLink(props) {
    const { property, value, removeItemHandler, selectLinkHandler } = props;
    // todo need to abstract this better
    const title = getTitle(value);
    var req = require.context("../../", true, /\.svg/);

    function onClickSelectItem(event) {
        event.preventDefault();
        selectLinkHandler();
    }

    return (
        <div className='property-content simple-list'>
            <a href="#select-list-item" className={property.name + '-list-item simple-list-item '} onClick={onClickSelectItem}>
                <img src={req('./' + DescriptorModelIconFactory.getUrlForType(property.name))} width="20px" />
                <span>{title}</span>
            </a>
            <RemoveItemButton removeItemHandler={removeItemHandler} />
        </div>
    );
}
