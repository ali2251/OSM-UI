import React from 'react'
import LeafGroup from './LeafGroup'
import ListStack from './ListStack'
import ExplorerColumn from './ExplorerColumn'
import yang from '../yang/leaf-utils'

export default class extends React.Component {
    constructor(props){
        super(props);
        this.state = {actions: [], properties: null};
    }

    render() {
        try {
            const { model, path, isLast, selected, isReadonly, openElement, editElement, columnCloser } = this.props;
            const element = model.getElement(path)
            const name = element.name;
            console.debug(`ContainerColumn: ${name}`);
            const data = element.value;
            const leaves = [];
            const choices = [];
            const containers = [];
            const lists = [];
            const loading = [];
            const dataDivided = {
                leaf: leaves,
                leaf_list: leaves,
                container: containers,
                list: lists,
                choice: choices,
                loading: loading
            };
            const properties = this.state.properties || element.schema.properties;
            properties.forEach((property, index) => {
                const list = dataDivided[property.type]
                list && list.push(property)
                !list && console.debug(`ContainerColumn - unhandled property : ${path}/${property.name} - ${property.type}`)
            });
            choices.forEach(choice => choice.properties.forEach(c => c.properties.forEach(p => leaves.push(p))));
            const items = [];
            leaves.length && items.push(<LeafGroup key='leaves' model={model} path={path} isReadonly={!isLast} properties={leaves} editElement={editElement} />);
            containers.length && items.push(<ListStack key='containers' model={model} path={path} properties={containers} selected={selected} openElement={openElement} />);
            lists.length && items.push(<ListStack key='list' model={model} path={path} properties={lists} selected={selected} openElement={openElement} />);
            loading.length && items.push(<ListStack key='loading' model={model} path={path} properties={loading} openElement={openElement} />);
            const actions = this.state.actions.slice();
            !isLast || isReadonly || !leaves.length || leaves.every(p => yang.isKey(p)) || actions.push('update');
            function invokeAction(action) {
                editElement(path, action);
            }
            return (
                <ExplorerColumn title={name || path} isLast={isLast} actions={actions} handler={invokeAction} columnCloser={columnCloser} >
                    <div className='container-column' >
                        <div>
                            {items}
                        </div>
                    </div>
                </ExplorerColumn>
            )
        } catch (e) {
            console.error("component render", e);
        }
    }
}
