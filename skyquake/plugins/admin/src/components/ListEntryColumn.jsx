import React from 'react'
import ContainerColumn from './ContainerColumn'

export default class extends ContainerColumn {
    constructor(props){
        super(props);
        this.state.actions = ['delete'];
    }
}
