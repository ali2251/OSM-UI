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
import React from 'react';

export default class SelectOption extends React.Component {
  constructor(props){
    super(props);
    this.state = {};
  }
  handleOnChange = (e) => {
    this.props.onChange(e);
  }
  render() {
    let html;
    let defaultValue = this.props.defaultValue;
    let options =  this.props.options && this.props.options.map(function(op, i) {
    let value;
    let label;
    if(typeof(op) == 'object') {
      value = JSON.stringify(op.value);
      label = op.label;
    } else {
      value = op;
      label = op;
    }

      return <option key={i} value={JSON.stringify(value)}>{label}</option>
    }) || [];
    if (this.props.initial) {
      options.unshift(<option key='blank' value={JSON.stringify(this.props.defaultValue)}></option>);
    }
    html = (
        <label key={this.props.key} className={this.props.className}>
            <span>{this.props.label}</span>
            {
              this.props.readonly ? defaultValue
              : (
                  <select
                    className={this.props.className}
                    onChange={this.handleOnChange}
                    value={JSON.stringify(this.props.value)}
                    defaultValue={JSON.stringify(defaultValue)}>
                      {
                       options
                      }
                  </select>
                )
            }
        </label>
    );
    return html;
  }
}
SelectOption.defaultProps = {
  /**
   * [options description]
   * @type {Array} - Expects items to contain objects with the properties 'label' and 'value' which are both string types. Hint: JSON.stringify()
   */
  options: [],
  onChange: function(e) {
    console.log(e.target.value)
    console.dir(e)
  },
  readonly: false,
  /**
   *  Selected or default value
​
   * @type {[type]}
   */
  defaultValue: null,
  /**
   * True if first entry in dropdown should be blank
   * @type {Boolean}
   */
  initial: false,
  label: null
}
