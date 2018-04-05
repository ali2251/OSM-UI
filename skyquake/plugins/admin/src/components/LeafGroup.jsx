import React from 'react'
import ColumnCard from './ColumnCard'
import yang from '../yang/leaf-utils.js'

export default class extends React.Component {

    render() {
        try {
            const { model, path, isReadonly, properties, editElement } = this.props;
            const element = model.getElement(path);
            console.debug(`LeafGroup: ${element.name}`);
            const container = element.value;
            const leaves = properties.reduce((leaves, property, index) => {
                const itemPath = path.slice();
                itemPath.push(property.name);
                const props = { model, 'path': itemPath };
                let value = (container && container[property.name]);
                let valueIsSet = yang.isValueSet(property, value);
                if (!valueIsSet) {
                    value = yang.getDefaultValue(property);
                    valueIsSet = yang.isValueSet(property, value);
                }
                if (valueIsSet) {
                    value = yang.getDisplayValue(property, value);
                }
                valueIsSet && leaves.push(
                    <div key={property.name} className='leaf-group-leaf' style={{ maxWidth: '400px' }} >
                        <div style={{ fontSize: 'small', color: 'gray' }} >{`${property.name}`}</div>
                        <div style={{paddingLeft: '4px'}} >{value}</div>
                    </div>
                );
                return leaves;
            }, [])
            return (
                <ColumnCard path={path}>
                    <div className='leaf-group'>
                        {leaves}
                    </div>
                </ColumnCard>
            )
        } catch (e) {
            console.error("component render", e);
        }
    }
}
