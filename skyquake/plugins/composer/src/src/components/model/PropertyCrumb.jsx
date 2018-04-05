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
import DescriptorEditorActions from '../../actions/DescriptorEditorActions'
import SelectionManager from '../../libraries/SelectionManager'

import '../../styles/EditDescriptorModelProperties.scss'

function makeId(container, path) {
    let idParts = [path];
    idParts.push(container.uid);
    while (container.parent) {
        container = container.parent;
        idParts.push(container.uid);
    }
    return idParts.reverse().join(':');
}

export default function PropertyCrumb(props) {
    const { container, errors } = props;
    const errorPaths = _keys(errors).reduce((a, k) => {
        function pieceOfPath(obj, key) {
            if (_isObject(obj[key])) {
                const node = obj[key];
                return _keys(node).reduce((a,k) => {
                    const paths = pieceOfPath(node, k).map(e => key + '.' + e)
                    return a.concat(paths);
                }, []);
            } else {
                return obj[key] ? [key] : [];
            }
        }
        const paths = pieceOfPath(errors, k);
        return a.concat(paths);
    }, []);

    function onClickSelectItem(path, event) {
        event.preventDefault();
        // DescriptorEditorActions.setFocus({descriptor: container, path})
        const element = document.getElementById(makeId(container, path));
        element && element.scrollIntoView() && setTimeout(() => element.focus(), 1);

        // const root = node.getRoot();
        // if (SelectionManager.select(node)) {
        //     DescriptorEditorActions.catalogItemMetaDataChanged(root.model);
        // }
    }
    const crumbs = errorPaths.map((path, i) => 
        <span key={path}>
            <a href="#select-item" onClick={onClickSelectItem.bind(null, path)}>{path}</a>
        </span>
    );
    return (
        <div style={{ margin: '3px 6px' }} >
            <h3>{crumbs}</h3>
        </div>
    );
}
