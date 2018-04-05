import React from 'react'
import ContainerColumn from './ContainerColumn'

export default class extends ContainerColumn {
    constructor(props) {
        super(props);
        const element = props.model.getElement(props.path);
        const selectedCase = element.value ?
            element.schema.properties.find(c => c.properties && c.properties.some(p => element.value[p.name]))
            : null;
        if (selectedCase) {
            this.state.actions = ['delete'];
            this.state.properties = selectedCase.properties;
        } else {
            this.state.actions = ['create'];
        }
    }
    render() {
        return super.render();
    }
}

