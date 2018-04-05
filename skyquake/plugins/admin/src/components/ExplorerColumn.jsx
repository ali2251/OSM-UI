import React from 'react'
import ActionBar from './ActionBar'

export default ({ title, children, columnCloser, isLast, actions, handler }) => {
    let actionBar = null;
    if (isLast) {
        if (columnCloser) {
            actions = actions ? actions.slice() : [];
            actions.push('close');
        }
        actionBar = (<ActionBar actions={actions} handler={(operation) => operation === 'close' ? columnCloser() : handler(operation)} />);
    } else {
        actionBar = (<ActionBar />);
    }
    return (
        <div className='column' style={{ backgroundColor: 'gainsboro', height: '100%', display: 'flex', flexDirection: 'column', marginLeft: '4px', marginRight: '4px' }} >
            <h2 style={{ marginBottom: '4px' }} >{title}</h2>
            {actionBar}
            {children}
        </div>
    )
}

