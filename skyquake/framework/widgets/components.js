
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

var React = require('react');
//var Histogram = require('react-d3-histogram')
export default {
  //test: require('./test/test.js'),
  button: require('./button/rw.button.js'),
  React: React,
//  Histogram: Histogram,
  Multicomponent: require('./multicomponent/multicomponent.js'),
  Mixins: require('./mixins/ButtonEventListener.js'),
//  Gauge: require('./gauge/gauge.js'),
  Bullet: require('./bullet/bullet.js')
};

