import React from 'react'
import Modal from 'react-modal'
import Dialog from 'react-dialog'
import LeafField from './editor/LeafField'
import yang from '../yang/leaf-utils.js'
import changeCase from 'change-case'

const Button = ({ name, onClick, disabled }) => (
    <button disabled={disabled}
        style={{ padding: '.25rem .5rem', margin: '0 0.25rem', boxShadow: '1px 1px rgba(0, 0, 0, 0.15)' }}
        onClick={onClick}>{name}</button>
);

const ButtonBar = ({ submitName, submitDisabled, onSubmit, onCancel }) => (
    <div className='button-bar' style={{ width: '100%', textAlign: 'right', marginTop: '18px' }} >
        <Button name="Cancel" onClick={onCancel} />
        <Button name={submitName} onClick={onSubmit} disabled={submitDisabled} />
    </div>
);

function initErrorInfo(leaves, container) {
    return leaves.reduce((errorInfo, p) => {
        const value = container && container[p.name];
        const readOnly = p.isKey && !operation.isCreate;
        if (!readOnly && p.mandatory && !value) {
            errorInfo[p.name] = 'required';
        }
        return errorInfo;
    }, {})
}

function buildChoiceProperty(choiceProperty) {
    let description = choiceProperty.description + ' ';
    const choices = choiceProperty.properties.reduce((o, p) => {
        o[p.name] = { value: p.name };
        description = `${description} ${p.name} - ${p.description}`;
        return o;
    }, {});
    const choicePicker = Object.assign({}, choiceProperty);
    choicePicker['type'] = 'leaf';
    choicePicker['description'] = description;
    choicePicker['data-type'] = {
        enumeration: {
            enum: choices
        }
    }
    return choicePicker;
}

function getIntialState(props) {
    const { isOpen, model, path, operation } = props;
    const baseLeaves = [];
    const choices = [];
    const dataSet = {};
    const errorInfo = {};
    let shadowErrorInfo = {};
    let leaves = baseLeaves;
    if (isOpen && path && !operation.isDelete) {
        const element = model.getElement(path);
        const dataDivided = {
            leaf: baseLeaves,
            leaf_list: baseLeaves,
            choice: choices,
        };
        element.schema.properties.forEach((property, index) => {
            const list = dataDivided[property.type]
            list && list.push(property)
        });
        if (!operation.isCreate) {
            // we are not going to prompt for choices so add in appropriate files now
            choices.forEach((choice) => {
                const caseSelected = choice.properties.find(c => c.properties && c.properties.some(p => element.value[p.name]));
                if (caseSelected) {
                    caseSelected.properties.forEach(p => yang.isLeafOrLeafList(p) && baseLeaves.push(p));
                }
            });
        } else {
            // on create we first propmt for "features"
            leaves = choices.map(choice => buildChoiceProperty(choice));
        }
        shadowErrorInfo = initErrorInfo(leaves, element.value);
    }
    return { dataSet, shadowErrorInfo, errorInfo, baseLeaves, leaves, choices };
}

export default class extends React.Component {
    constructor(props) {
        super(props);
        this.state = getIntialState(props);
        this.state.showHelp = true;
    }

    handleCloseEditor = () => {
    };

    componentWillReceiveProps(nextProps) {
        if (this.props.isOpen !== nextProps.isOpen) {
            this.setState(getIntialState(nextProps));
        }
    }

    render() {
        try {
            const { isOpen, model, isReadonly, properties, operation, onSave, onCancel } = this.props;
            if (!isOpen) {
                return null;
            }
            let dataPath = this.props.path.slice();
            const element = model.getElement(dataPath);
            const container = element.value;
            let editors = null;
            let submitHandler = () => {
                if (Object.keys(this.state.errorInfo).length === 0) {
                    onSave(this.state.dataSet);
                }
            }
            const checkForSubmitKey = (e) => {
                if (e.keyCode == 13) {
                    e.preventDefault();
                    e.stopPropagation();
                    submitHandler();
                }
            };
            let submitButtonLabel = operation.isCreate ? "Add" : "Save";
            let submitDisabled = true;
            let headerText = null;
            if (operation.isDelete) {
                const id = dataPath[dataPath.length - 1];
                const deletePrompt = `Delete ${id}?`;
                submitButtonLabel = "Delete";
                submitDisabled = false;
                editors = (<div style={{ paddingBottom: '10px' }}>{deletePrompt}</div>);
            } else {
                let { leaves, choices } = this.state;
                if (choices.length) {
                    if (operation.isCreate) {
                        headerText = `Select feature(s) for ${element.name}`
                        submitButtonLabel = "Continue";
                        submitHandler = () => {
                            const { dataSet, baseLeaves } = this.state;
                            const leaves = choices.reduce((leafList, choice) => {
                                const caseSelected = dataSet[choice.name].value;
                                delete dataSet[choice.name];
                                if (caseSelected) {
                                    return leafList.concat(choice.properties.find((p) => p.name === caseSelected).properties.reduce((list, p) => {
                                        yang.isLeafOrLeafList(p) && list.push(p);
                                        return list;
                                    }, []));
                                }
                                return leafList;
                            }, baseLeaves.slice());
                            const shadowErrorInfo = initErrorInfo(leaves, element.value);
                            this.setState({ dataSet, leaves, choices: [], errorInfo: {}, shadowErrorInfo });
                        }
                    }
                }
                submitDisabled = (Object.keys(this.state.shadowErrorInfo).length
                    || (!operation.isCreate && Object.keys(this.state.dataSet).length === 0));
                // process the named field value change
                function processFieldValueChange(property, currentValue, value) {
                    console.debug(`processed change for -- ${name} -- with value -- ${value}`);
                    const dataSet = this.state.dataSet;
                    const name = property.name;
                    if ((currentValue && currentValue !== value) || (!currentValue && value)) {
                        dataSet[name] = { property, value, currentValue };
                    } else {
                        delete dataSet[name];
                    }
                    const { errorInfo, shadowErrorInfo } = this.state;
                    delete errorInfo[name];
                    delete shadowErrorInfo[name];
                    this.setState({ dataSet, errorInfo, shadowErrorInfo });
                }

                function onErrorHandler(name, message) {
                    const { errorInfo, shadowErrorInfo } = this.state;
                    errorInfo[name] = message;
                    shadowErrorInfo[name] = message;
                    this.setState({ errorInfo, shadowErrorInfo });
                }

                editors = leaves.reduce((editors, property, index) => {
                    const itemPath = dataPath.slice();
                    itemPath.push(property.name);
                    const props = { model, 'path': itemPath };
                    const value = container && container[property.name];
                    let readOnly = isReadonly;
                    let extraHelp = null;
                    if (!isReadonly) {
                        if (yang.isKey(property) && !operation.isCreate) {
                            extraHelp = "Id fields are not modifiable.";
                            readOnly = true;
                        } else if (yang.isLeafList(property)) {
                            extraHelp = "Enter a comma separated list of values."
                        }
                    }
                    editors.push(
                        <LeafField
                            key={property.name}
                            container={container}
                            property={property}
                            path={dataPath}
                            value={value}
                            showHelp={this.state.showHelp}
                            onChange={processFieldValueChange.bind(this, property, value)}
                            onError={onErrorHandler.bind(this, property.name)}
                            readOnly={readOnly}
                            extraHelp={extraHelp}
                            errorMessage={this.state.errorInfo[property.name]}
                        />
                    );
                    return editors;
                }, [])
            }
            const customStyles = {
                content: {
                    top: '50%',
                    left: '50%',
                    right: 'auto',
                    bottom: 'auto',
                    marginRight: '-50%',
                    transform: 'translate(-50%, -50%)'
                }
            };
            const dlgHeader = headerText ? (<div style={{ paddingBottom: '16px' }} >{headerText}</div>) : null;
            return (
                <Modal
                    isOpen={isOpen}
                    contentLabel="Edit"
                    onRequestClose={onCancel}
                    shouldCloseOnOverlayClick={false}
                    style={customStyles}
                >
                    <div className='leaf-group' style={{ maxWidth: '400px', maxHeight: '600px' }} onKeyUp={checkForSubmitKey} >
                        {dlgHeader}
                        {editors}
                        <ButtonBar
                            submitName={submitButtonLabel}
                            submitDisabled={submitDisabled}
                            onSubmit={submitHandler}
                            onCancel={onCancel} />
                    </div>
                </Modal >
            )
        } catch (e) {
            console.error("component render", e);
        }
    }
}