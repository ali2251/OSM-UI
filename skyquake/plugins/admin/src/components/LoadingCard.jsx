import React from 'react'
import ColumnCard from './ColumnCard'

class LoadingCard extends React.Component {
    render() {
        try {
            const { model, path } = this.props;
            const name = model.getElement(path).name;
            console.debug(`LoadingCard: ${name}`);
            return (
                <ColumnCard path={path}>
                    <div>{`Loading ${name}`}</div>
                </ColumnCard>
            )
        } catch (e) {
            console.error("component render", e);
        }
    }
}

export default LoadingCard