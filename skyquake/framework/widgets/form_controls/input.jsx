/*
 *
 *   Copyright 2016 RIFT.IO Inc
 *
 *   Licensed under the Apache License, Version 2.0 (the "License");
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 *
 */
import './formControls.scss';
import SelectOption from 'widgets/form_controls/selectOption.jsx';
import CheckSVG from '../../../node_modules/open-iconic/svg/check.svg'
import React, {Component} from 'react';

export default class Input extends Component {
    render() {
        let {label, value, defaultValue, ...props} = this.props;
        let inputProperties = {
            value: value
        }
        let isRequired;
        let inputType;
        let tester = null;
        let className = `sqTextInput ${props.className}`;

        if(this.props.required) {
           isRequired = <span className="required">*</span>
        }
        if (defaultValue) {
            inputProperties.defaultValue = defaultValue;
        }
        if (props.pattern) {
            inputProperties.pattern = props.pattern;
            tester = new RegExp(props.pattern);
        }
        if(props.hasOwnProperty('type') && (props.type.toLowerCase() == 'checkbox')) {
            inputProperties.checked = props.checked;
            className = `${className} checkbox`;
        }
        if (value == undefined) {
            value = defaultValue;
        }
        switch(props.type) {
            case 'textarea':
                inputType = <textarea key={props.key} {...inputProperties} value={value} onChange={props.onChange} />
                break;
            case 'select':
                inputType = <SelectOption
                                key={props.key}
                                initial={props.initial}
                                defaultValue={defaultValue}
                                options={props.options}
                                onChange={props.onChange}
                            />
                break;
            case 'radiogroup':
                inputType = buildRadioButtons(this.props);
                break;
            default:
                inputType = <input key={props.key} type={props.type} {...inputProperties} onChange={props.onChange} placeholder={props.placeholder}/>;
        }
        let displayedValue;
        if(value === null) {
            displayedValue = null;
        } else {
            displayedValue = value.toString();
        }
        if( props.readonly && props.type == "checkbox" && props.checked ) {
            displayedValue = <img src={CheckSVG} />
        }

        if( props.readonly && props.type == "radiogroup" && props.readonlydisplay ) {
            displayedValue = props.readonlydisplay
        }

        let html = (
            <label className={className} style={props.style}>
              <span> { label } {isRequired}</span>
              {
                !props.readonly ? inputType : <div className="readonly">{displayedValue}</div>
              }
              {
                 !props.readonly && tester && value && !tester.test(value) ? <span className="invalid">The Value you entered is invalid</span> : null
              }
            </label>
        );
        return html;
    }
}


function buildRadioButtons(props) {
    let className = 'sqCheckBox';
    return(
       <div className={className}>
            {
                props.options.map((o,i) => {
                    let label = o.label || o;
                    let value = o.value || o;
                    return (
                        <label key={i}>
                            {label}
                            <input type="radio" checked={props.value == value} value={value} onChange={props.onChange} />
                        </label>
                    )
                })
            }
       </div>

    )
}

Input.defaultProps = {
    onChange: function(e) {
        console.log(e.target.value, e);
        console.dir(e.target);
    },
    label: '',
    defaultValue: null,
    type: 'text',
    readonly: false,
    style:{},
    className: ''

}

