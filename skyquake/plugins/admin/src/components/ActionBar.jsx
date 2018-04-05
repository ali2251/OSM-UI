import React from 'react'
import { TrashIcon } from 'react-open-iconic-svg';
import { PencilIcon } from 'react-open-iconic-svg';
import { PlusIcon } from 'react-open-iconic-svg';
import { CircleXIcon } from 'react-open-iconic-svg';

const actionIcon = {
    'create': {icon: PlusIcon, title: "Add"},
    'update': {icon: PencilIcon, title: "Edit"},
    'delete': {icon: TrashIcon, title: "Delete"},
    'close': {icon: CircleXIcon, title: "Close Panel"}
}

export default (props) => {
    const { isHidden, actions, handler } = props;
    const buttons = [];
    actions && actions.forEach((action => buttons.push(
        <div key={action} style={{ visibility: isHidden ? 'hidden' : 'visible', display: 'inline-block', padding: '.15rem .5rem' }}>
            <div title={actionIcon[action].title} style={{ display: 'inline-block', cursor: 'pointer' }}>
                {React.createElement(actionIcon[action].icon, {width: '12', height: '12', onClick: () => handler(action)})}
            </div>
        </div>
    )));
    return (
        <div className='button-bar' style={{ height: '17px', width: '100%', textAlign: 'right' }} >
            {buttons}
        </div>
    )
}

