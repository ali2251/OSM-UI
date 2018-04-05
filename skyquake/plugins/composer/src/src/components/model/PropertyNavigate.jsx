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
import _keys from 'lodash/keys'
import _isObject from 'lodash/isObject'

import Select from 'react-select';
import 'react-select/dist/react-select.css'

import DescriptorEditorActions from '../../actions/DescriptorEditorActions'
import CatalogItemsActions from '../../actions/CatalogItemsActions'
import Property from '../../libraries/model/DescriptorModelMetaProperty'
import SelectionManager from '../../libraries/SelectionManager'

export default function PropertyNavigate(props) {
    const { container, idMaker, options, placeholder, style } = props;

    function gotoProperty(descriptor, path) {
        DescriptorEditorActions.expandPanel({ descriptor, path });
        function bringIntoViewAndFocusOnProperty() {
            const element = document.getElementById(idMaker(container, path));
            if (element) {
                element.scrollIntoView();
                setTimeout(function () {
                    element.focus()
                }, 100);
            }
        }
        setTimeout(bringIntoViewAndFocusOnProperty, 100);
    }
    function onClickSelectItem(item) {
        // we don't support traversing into an 'external' model (e.g. vlds)
        // if we did then we would need to know when and then invoke something like
        // CatalogItemsActions.catalogItemMetaDataChanged(root.model);
        // and then after a delay fire the gotoProperty step
        gotoProperty(container, item.value);
    }
    return (
        <div style={style} >
            <Select
                placeholder={placeholder}
                options={options}
                onChange={onClickSelectItem}
                scrollMenuIntoView={true}
            />
        </div>
    );
}
