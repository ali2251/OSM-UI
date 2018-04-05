import React from 'react'
import ColumnCard from './ColumnCard'
import { DocumentIcon } from 'react-open-iconic-svg';

export default class extends React.Component {

    render() {
        try {
            const { model, path, name, isSelected, openElement } = this.props;
            console.debug(`ListEntryCard: ${name}`);
            return (
                <ColumnCard path={path} isSelected={isSelected} >
                    <DocumentIcon />
                    <div className='list-entry-card' style={{cursor: 'pointer'}} onClick={() => openElement({ path })}>
                        <div>{`${name}`}</div>
                    </div>
                </ColumnCard>
            )
        } catch (e) {
            console.error("component render", e);
        }
    }
}
