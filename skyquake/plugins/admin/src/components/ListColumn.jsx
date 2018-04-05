import React from 'react'
import ListStack from './ListStack'
import ListEntryCard from './ListEntryCard'
import ExplorerColumn from './ExplorerColumn'
import changeCase from 'change-case'

export default class extends React.Component {

    render() {
        try {
            const { model, path, isLast, selected, openElement, editElement, columnCloser } = this.props;
            const element = model.getElement(path);
            const name = element.name;
            const shortName = changeCase.titleCase(name).split(' ').pop();
            const buttonName = `Add ${shortName}`;
            console.debug(`ListColumn: ${name}`);
            const list = element.value ? Array.isArray(element.value) ? element.value : [element.value] : null;
            const cards = list && list.map((item, index) => {
                const itemInfo = element.getItemInfo(item);
                const isSelected = selected ? selected.every((p,i) => p === itemInfo.path[i]) : false;
                const itemPath = path.slice();
                itemPath.push(itemInfo.path);
                const props = { model, 'path': itemPath, 'openElement': openElement.bind(this, itemPath) };
                return (
                    <ListEntryCard key={itemInfo.path}
                        model={model}
                        path={itemPath}
                        name={itemInfo.name}
                        isSelected={isSelected}
                        openElement={openElement.bind(this, itemPath)}
                        deleteElement={(path) => editElement(path, 'delete')} />
                )
            })
            return (
                <ExplorerColumn title={name || path} isLast={isLast} actions={['create']} handler={() => editElement(path, 'create')} columnCloser={columnCloser} >
                    <div className='list-column' >
                        {cards}
                    </div>
                </ExplorerColumn>
            )
        } catch (e) {
            console.error("component render", e);
        }
    }
}
