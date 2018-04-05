import React from 'react'
import ExplorerColumn from './ExplorerColumn'

export default class extends React.Component {

    render() {
        try {
            const { model, path, isLast, openElement } = this.props;
            console.debug(`LoadingColumn: ${path.join()}`);
            return (
                <ExplorerColumn title={name || path} isLast={isLast} >
                    <div className='loading-column'>
                        <h3>Loading</h3>
                    </div>
                </ExplorerColumn>
            )
        } catch (e) {
            console.error("component render", e);
        }
    }
}
