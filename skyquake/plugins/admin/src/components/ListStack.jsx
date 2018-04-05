import React from 'react'
import ListCard from './ListCard'
import ContainerCard from './ContainerCard'
import ChoiceCard from './ChoiceCard'
import LoadingCard from './LoadingCard'

const cardComponent = {
    list: ListCard,
    container: ContainerCard,
    choice: ChoiceCard,
    loading: LoadingCard
}
export default class extends React.Component {

    render() {
        try {
            const { model, path, properties, selected, openElement } = this.props;
            const element = model.getElement(path);
            const container = element.value;
            console.debug(`PropertiesStack: ${properties.length}`);            
            const cards = properties.map((property, index) => {
                const isSelected = selected ? selected === property.name : false;
                const itemPath = path.slice();
                itemPath.push(property.name);
                const props = { model, 'path': itemPath, isSelected, 'openElement': openElement.bind(this, itemPath) };
                return (
                    <div key={property.name}>
                        {React.createElement(cardComponent[property.type], props)}
                    </div>
                )
            })
            return (
                <div>
                    {cards}
                </div>
            )
        } catch (e) {
            console.error("component render", e);
        }
    }
}
