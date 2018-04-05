import React from 'react'
import ModalDialog from 'react-modal'
import _set from 'lodash/set';
import _get from 'lodash/get';
import ContainerColumn from './ContainerColumn'
import ChoiceColumn from './ChoiceColumn'
import ListColumn from './ListColumn'
import LoadingColumn from './LoadingColumn'
import ListEntryColumn from './ListEntryColumn'
import LoadingCard from './LoadingCard'
import ListCard from './ListCard'
import ContainerCard from './ContainerCard'
import EditorDialog from './EditorDialog'

function findItemInList(list, key, keyValue) {
    const keyPath = Array.isArray(keyValue) ? keyValue : key.length > 1 ? JSON.parse(keyValue) : [keyValue];
    if (key.length > 1) {
        return list.find(item => {
            return key.every((k, i) => item[k] === keyPath[i]);
        });
    } else {
        const leaf = key[0];
        const match = keyPath[0];
        return list.find(item => {
            return item[leaf] === match;
        });
    }
}
function getItemInfoFunction(schema) {
    return function (item) {
        return ModelExplorer.getItemInfo(schema.key, item);
    }
}

function makeNameFromKeyPath(key, path, name) {
    return path.length > 1 ? `${path[0]} (${path.slice(1).join(" ,")})` : name || path[0];
}

class ExplorerModel {
    constructor(dataModel) {
        this.dataModel = dataModel;
        this.topNode = dataModel.path.split('/').pop();
    }
    getElement(path) {
        const dataModel = this.dataModel;
        if (dataModel.isLoading) {
            return null;
        }
        if (dataModel.updatingPath && dataModel.updatingPath.every((p, i) => path[i] === p)) {
            return { type: 'loading' }
        }
        return path.reduce((parent, node, index) => {
            const element = Object.assign({}, parent);
            element.path.push(node);
            if (parent.type === 'list') {
                element.type = 'list-entry'
                element.value = findItemInList(parent.value, parent.schema.key, node);
                element.keyValue = parent.schema.key.map(leaf => element.value[leaf]);
                element.name = makeNameFromKeyPath(parent.schema.key, element.keyValue, element.value['name']);
                element.getItemInfo = getItemInfoFunction(parent.schema);
            } else {
                element.schema = parent.schema.properties.find(property => property.name === node)
                element.type = element.schema.type;
                element.value = element.type === 'choice' ? parent.value : parent.value && parent.value[node];
                element.name = node.split(':').pop();
                if (element.type === 'list') {
                    element.getItemInfo = getItemInfoFunction(element.schema);
                }
            }
            return element;
        }, {
                schema: dataModel.schema[this.topNode],
                getItemInfo: getItemInfoFunction(this.schema),
                value: dataModel.data,
                type: dataModel.schema[this.topNode].type,
                path: dataModel.path.split('/')
            }
        )
    }
}

const columnComponent = {
    'list': ListColumn,
    'container': ContainerColumn,
    'list-entry': ListEntryColumn,
    'choice': ChoiceColumn,
    'loading': LoadingColumn
}

class ModelExplorer extends React.Component {
    static getExplorerModel(dataModel) {
        return new ExplorerModel(dataModel);
    }
    static getItemInfo(keyDef, item) {
        const path = keyDef.map(leaf => item[leaf]);
        const name = makeNameFromKeyPath(keyDef, path, item.name);
        return {
            path,
            name
        };
    }

    constructor(props) {
        super(props);
        const columns = props.columns || [['/']];
        this.state = { columns };
    }

    componentWillReceiveProps(nextProps) {
        if (!this.state.columns && nextProps.model) {
            this.setState({ columns: [[Array.isArray(nextProps.model) ? '' : '/']] })
        }
    }

    render() {
        const { model, onUpdate } = this.props;
        let { columns, isEditMode, editPath, editOperation } = this.state;

        const openElement = (col, path) => {
            columns = columns.slice(0, col + 1);
            columns.push(path);
            this.setState({ columns })
        }

        const closeLastColumn = () => {
            columns = columns.slice();
            columns.pop();
            this.setState({ columns })
        }

        const lastCol = columns.length - 1;
        const modelColumns = columns && columns.map((path, col) => {
            const open = openElement.bind(this, col);
            const props = {
                key: path.join('/'),
                model,
                path,
                selected: col < lastCol ? columns[col + 1][path.length] : null,
                isLast: col === lastCol,
                openElement: openElement.bind(this, col),
                columnCloser: col === lastCol && col && closeLastColumn,
                editElement: (path, op) => this.setState({
                    isEditMode: true,
                    editOperation: op || 'update',
                    editPath: path
                })
            }
            return React.createElement(columnComponent[model.getElement(path).type], props)
        })

        const updateModel = (data) => {
            let { columns, isEditMode, editPath, editOperation } = this.state;
            onUpdate(editPath, editOperation, data) && columns.pop();
            this.setState({
                columns,
                isEditMode: false,
                editOperation: null,
                editPath: null
            });
        }

        return (
            <div className='model-explorer'>
                <div style={{ width: '100%', display: 'flex', flexDirection: 'row', overflow: 'scroll' }}>
                    {modelColumns}
                </div>
                <EditorDialog
                    isOpen={isEditMode}
                    operation={{
                        isCreate: editOperation === 'create',
                        isDelete: editOperation === 'delete'}}
                    model={model}
                    path={editPath}
                    onCancel={() => this.setState({ isEditMode: false })}
                    onSave={updateModel} />
            </div>
        )
    }
}

export default ModelExplorer 