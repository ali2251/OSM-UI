import React from 'react'

export default class extends React.Component {
    render() {
        let { isSelected, path, children } = this.props;
        const bgColor = ((isSelected && '#00acee !important') || 'inherit');
        const className = ['card'];
        isSelected && className.push('--selected');
        const id = path.join('-') + className.join('-');
        if (isSelected) {
            children = (
                <div style={{ backgroundColor: '#00acee !important', width: '100%' }} >
                    {children}
                </div>
            )
        }
        return (
            <div className={className.join(' ')} style={{ margin: '1px', padding: '3px' }} >
                {children}
            </div>
        )
    }
}