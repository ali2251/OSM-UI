
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
import Loader from 'widgets/loading-indicator/loadingIndicator.jsx';

export default class LaunchpadCardCloudAccount extends React.Component {
  constructor(props) {
    super(props);
  }
  componentWillReceiveProps(nextProps) {

  }
  render() {
    let html;
    let isDisplayed = this.props.display;
    let nsrDataCenter = this.props.nsr['resource-orchestrator'] ? this.props.nsr['resource-orchestrator'] : 'RIFT';
    return (
            <div className={this.props.className + (isDisplayed ? '_open':'_close')}>
              <h2>Accounts</h2>
              <div className={'dataCenterTable'}>
                <div className="dataCenterTable-header">
                  <div>TYPE</div>
                  <div>NAME</div>
                  <div>RESOURCE ORCHESTRATOR</div>
                  <div>DATACENTER</div>
                </div>
                <div>
                  <div>NSR</div>
                  <div>{this.props.nsr['short-name']}</div>
                  <div>{nsrDataCenter}</div>
                  <div>{this.props.nsr['datacenter']}</div>
                </div>
                {
                  this.props.nsr && this.props.nsr['vnfrs'] && this.props.nsr['vnfrs'].map(function(v,i) {
                    if(v.hasOwnProperty('datacenter')) {
                      return  <div>
                                <div>VNFR</div>
                                <div>{v['short-name']}</div>
                                <div>{nsrDataCenter}</div>
                                <div>{v['datacenter']}</div>
                              </div>
                    }
                  })
                }
              </div>
            </div>
    );
  }
}

LaunchpadCardCloudAccount.defaultProps = {
  display: false,
  nsr: {}
}


