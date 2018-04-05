import React from 'react';
import Crouton from 'react-crouton';
import NETCONF_ERRORS from './netConfErrors.js';

class SkyquakeNotification extends React.Component {
    constructor(props) {
        super(props);
        this.state = {};
        this.state.displayNotification = props.visible;
        this.state.notificationMessage = '';
        this.state.notificationType = 'error';
    }
    componentWillReceiveProps(props) {
        if(props.visible) {
            this.processMessage(props.data);
        } else {
            this.setState({displayNotification: props.visible});
        }
    }
    buildNetconfError(data) {
        let error = data;
        try {
            let info = JSON.parse(data);
            let rpcError = info.body || info.errorMessage.body || info.errorMessage.error;
            if (rpcError && typeof rpcError === 'string') {
                const index = rpcError.indexOf('{');
                if (index >= 0) {
                    rpcError = JSON.parse(rpcError.substr(index));
                } else {
                    return rpcError;
                }
            }
            if (!rpcError) {
                return error;
            }
            info = rpcError["rpc-reply"]["rpc-error"];
            let errorTag = info['error-tag']
            error = `
                ${NETCONF_ERRORS[errorTag] && NETCONF_ERRORS[errorTag].description || 'Unknown NETCONF Error'}
                PATH: ${info['error-path']}
                INFO: ${JSON.stringify(info['error-info'])}
            `
        } catch (e) {
            console.log('Unexpected string sent to buildNetconfError: ', e);
        }
        return error;
    }
    processMessage(data) {
        let state = {
                displayNotification: true,
                notificationMessage: data,
                notificationType: 'error',
                displayScreenLoader: false
            }
        if(typeof(data) == 'string') {
            //netconf errors will be json strings
            state.notificationMessage = this.buildNetconfError(data);
        } else {
            let message = data.msg || '';
            if(data.type) {
                state.notificationType = data.type;
            }
            if(data.rpcError){
                message += " " + this.buildNetconfError(data.rpcError);
            }
            state.notificationMessage = message;
        }
        console.log('NOTIFICATION: ', state.notificationMessage)
        this.setState(state);
    }
    render() {
        const {displayNotification, notificationMessage, notificationType, ...state} = this.state;
        return (
            <Crouton
                id={Date.now()}
                message={notificationMessage}
                type={notificationType}
                hidden={!(displayNotification && notificationMessage)}
                onDismiss={this.props.onDismiss}
                timeout={10000}
            />
        )
    }
}
SkyquakeNotification.defaultProps = {
    data: {},
    onDismiss: function(){}
}
export default SkyquakeNotification;
