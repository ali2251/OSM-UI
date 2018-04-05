import './formControls.jsx';

import React from 'react'
import SelectOption from 'widgets/form_controls/selectOption.jsx';
import imgAdd from '../../../node_modules/open-iconic/svg/plus.svg'
import imgRemove from '../../../node_modules/open-iconic/svg/trash.svg'
import TextInput from 'widgets/form_controls/textInput.jsx';
import Input from 'widgets/form_controls/input.jsx';

export class FormSection extends React.Component {
    render() {
        let className = 'FormSection ' + this.props.className;
        let html = (
            <div
                style={this.props.style}
                className={className}
            >
                <div className="FormSection-title">
                    {this.props.title}
                </div>
                <div className="FormSection-body">
                    {this.props.children}
                </div>
            </div>
        );
        return html;
    }
}

FormSection.defaultProps = {
    className: ''
}

/**
 * AddItemFn:
 */
export class InputCollection extends React.Component {
    constructor(props) {
        super(props);
        this.collection = props.collection;
    }
    buildTextInput(onChange, v, i) {
        return (
            <Input
                readonly={this.props.readonly}
                style={{flex: '1 1'}}
                key={i}
                value={v}
                onChange= {onChange.bind(null, i)}
            />
        )
    }
    buildSelectOption(initial, options, onChange, v, i) {
        return (
            <SelectOption
                readonly={this.props.readonly}
                key={`${i}-${v.replace(' ', '_')}`}
                intial={initial}
                defaultValue={v}
                options={options}
                onChange={onChange.bind(null, i)}
            />
        );
    }
    showInput() {

    }
    render() {
        const props = this.props;
        let inputType;
        let className = "InputCollection";
        if (props.className) {
            className = `${className} ${props.className}`;
        }
        if (props.type == 'select') {
            inputType = this.buildSelectOption.bind(this, props.initial, props.options, props.onChange);
        } else {
            inputType = this.buildTextInput.bind(this, props.onChange)
        }
        let html = (
            <div className="InputCollection-wrapper">
                {props.collection.map((v,i) => {
                    return (
                        <div key={i} className={className} >
                            {inputType(v, i)}
                            {
                                props.readonly ? null : <span onClick={props.RemoveItemFn.bind(null, i)} className="removeInput"><img src={imgRemove} />Remove</span>}
                        </div>
                    )
                })}
                { props.readonly ? null : <span onClick={props.AddItemFn} className="addInput"><img src={imgAdd} />Add</span>}
            </div>
        );
        return html;
    }
}

InputCollection.defaultProps = {
    input: Input,
    collection: [],
    onChange: function(i, e) {
        console.log(`
                        Updating with: ${e.target.value}
                        At index of: ${i}
                    `)
    },
    AddItemFn: function(e) {
        console.log(`Adding a new item to collection`)
    },
    RemoveItemFn: function(i, e) {
        console.log(`Removing item from collection at index of: ${i}`)
    }
}
