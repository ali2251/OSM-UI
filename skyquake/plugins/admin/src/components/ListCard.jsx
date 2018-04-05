import React from 'react'
import ColumnCard from './ColumnCard'
import { ListIcon } from 'react-open-iconic-svg';

export default class extends React.Component {
    render() {
        try {
            const { model, path, isSelected, openElement } = this.props;
            const element = model.getElement(path);
            const name = element.name;
            const numItems = element.value ? Array.isArray(element.value) ? element.value.length : 1 : 0;
            console.debug(`ListCard: ${name}`);
            return (
                <ColumnCard path={path} isSelected={isSelected} >
                    <ListIcon />
                    <div className='list-card' style={{cursor: 'pointer'}} onClick={() => openElement({ path })}>
                        <span style={{ paddingRight: '8px' }} >{`${name}`}</span><span style={{ fontSize: 'small', verticalAlign: 'top' }}>{`(${numItems})`}</span>
                    </div>
                </ColumnCard>
            )
        } catch (e) {
            console.error("component render", e);
        }
    }
}
