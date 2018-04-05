import React from 'react'
import ColumnCard from './ColumnCard'
import { FolderIcon } from 'react-open-iconic-svg';

export default class extends React.Component {
    render() {
        try {
            const { model, path, isSelected, openElement } = this.props;
            const element = model.getElement(path)
            const name = element.name;
            console.debug(`ContainerCard: ${name}`);
            return (
                <ColumnCard path={path} isSelected={isSelected} className='container-card'>
                    <FolderIcon/>
                    <div style={{cursor: 'pointer'}} onClick={() => openElement({ path })}>{name}</div>
                </ColumnCard>
            )
        } catch (e) {
            console.error("component render", e);
        }
    }
}

