import React from 'react'
import ColumnCard from './ColumnCard'
import { ExcerptIcon } from 'react-open-iconic-svg';

export default class extends React.Component {
    render() {
        try {
            const { model, path, isSelected, openElement } = this.props;
            const element = model.getElement(path)
            const name = element.name;
            let choiceName = "none";
            if (element.value) {
                const selectedCase = element.schema.properties.find(c =>
                    c.properties && c.properties.some(p => element.value[p.name]));
                if (selectedCase) {
                    choiceName = selectedCase.name;
                }
            }
            console.debug(`ChoiceCard: ${name}`);
            return (
                <ColumnCard path={path} isSelected={isSelected} className='chioce-card'>
                    <ExcerptIcon />
                    <div className='list-card' style={{ cursor: 'pointer' }} onClick={() => openElement({ path })}>
                        <span style={{ paddingRight: '8px' }} >{`${name}`}</span><span style={{ fontSize: 'small', verticalAlign: 'top' }}>{`(${choiceName})`}</span>
                    </div>
                </ColumnCard>
            )
        } catch (e) {
            console.error("component render", e);
        }
    }
}
