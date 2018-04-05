import React from 'react';
import axios from 'axios';
import {LineChart} from 'react-easy-chart';
import {Legend} from 'react-easy-chart';
import ReactTable from "react-table";
require("./react-table.css");

export default class HelloWorldDashboard extends React.Component {

    constructor(props) {
        super(props);
        this.state = {};
        this.constructData = this.constructData.bind(this);
        this.constructTable = this.constructTable.bind(this);
    }
    componentWillMount() {
        console.log("componentWillMountme")

        this.setState({
            latencies: [1, 2, 3],
            throughput: [1, 2, 3],
            jitter: [1, 2, 3],
            bandwidth: [1, 2, 3],
            packetloss: [1, 2, 3],
            links: [],
            ids: [],
            data: [{
                id: "Openflow:1:1",
                latencyMin: 20,
                latencyMax: 14,
                latencyAverage: 4,
                jitterMin: 73,
                jitterMax: 10,
                jitterAverage: 10,
                throughputMin: 10,
                throughputMax: 10,
                throughputAverage: 10,
                packetLossMin: 10,
                packetlossMax: 10,
                packetLossAverage: 10,
                bandwidthMin: 10,
                bandwidthMax: 10,
                bandwidthAverage: 10
            }
            ]
        });

        axios.get('https://192.168.133.23:3002/user/getAllLinks').then((res) => {
            console.log('hey', res)
            this.setState({links: res.data.Links});
            return new Promise((resolve, reject) => {
                if (this.state.links !== undefined) {
                    resolve(true);
                } else {
                    reject(false);
                }
            })
        }).then((result) => {
            if (result) {
                this.constructTable();
                this.constructData('latency');
                this.constructData('jitter');
                this.constructData('throughput');
                this.constructData('bandwidth');
                this.constructData('packetloss');
            }
        }).catch((error) => {
            console.error(error);
        });

    }


    constructTable() {

        const arrAvg = arr => arr.reduce((a,b) => a + b, 0) / arr.length;
        let localData = [];


        const links = this.state.links;

        links.forEach((link) => {

            const latencyMin = Math.min(...link.latency)
            const latencyMax = Math.max(...link.latency)
            const latencyAverage = arrAvg(link.latency);

            const jitterMin = Math.min(...link.jitter);
            const jitterMax = Math.max(...link.jitter);
            const jitterAverage = arrAvg(link.jitter);

            const throughputMin = Math.min(...link.throughput)
            const throughputMax = Math.max(...link.throughput)
            const throughputAverage = arrAvg(link.throughput)

            const packetlossMin = Math.min(...link.packetloss);
            const packetlossMax = Math.max(...link.packetloss);
            const packetlossAverage = arrAvg(link.packetloss);

            const bandwidthMin = Math.min(...link.bandwidth);
            const bandwidthMax = Math.max(...link.bandwidth);
            const bandwidthAverage = arrAvg(link.bandwidth);


            localData.push({
                id: link.id,
                latencyMin: latencyMin/1000,
                latencyMax: latencyMax/1000,
                latencyAverage: latencyAverage/1000,
                jitterMin: jitterMin/1000,
                jitterMax: jitterMax/1000,
                jitterAverage: jitterAverage/1000,
                throughputMin: throughputMin,
                throughputMax: throughputMax,
                throughputAverage: throughputAverage,
                packetLossMin: packetlossMin,
                packetlossMax: packetlossMax,
                packetLossAverage: packetlossAverage,
                bandwidthMin: bandwidthMin,
                bandwidthMax: bandwidthMax,
                bandwidthAverage: bandwidthAverage

            });





        });

        this.setState({data: localData});



    }


    constructData(typeOfData) {

        console.log('type of data: ', typeOfData);
        let latencyDataPoints = [];

        let links = this.state.links;
        console.log(links.length, '  -------------------')
        for (let i = 0; i < links.length; ++i) {

            console.log('looping', i);

            let linkId = links[i].id;
            if (!this.state.ids.includes(linkId)) {
                this.state.ids.push(linkId);
            }
            console.log('links', links[i].id);
            var latencies = links[i].latency;//[20,40,60,80,10];
            if (typeOfData === 'latency') {
                latencies = links[i].latency;
            } else if (typeOfData === 'throughput') {
                latencies = links[i].throughput;
            } else if (typeOfData === 'jitter') {
                latencies = links[i].jitter;
            } else if (typeOfData === 'packetloss') {
                latencies = links[i].packetloss;
            } else if (typeOfData === 'bandwidth') {
                latencies = links[i].bandwidth;
            }
            var dates = links[i].date;//[new Date(), new Date(), new Date(), new Date(), new Date()];
            var formattedDates = [];
            var dataPoints = [];

            for (var j = 0; j < dates.length; ++j) {

                var d = new Date(dates[j]);

                var fullYear = d.getFullYear();
                var month = d.getMonth() + 1;
                var date1 = d.getDate();

                var hours = d.getHours();
                var minutes = d.getMinutes();

                var newDate = date1 + '-' + month + '-' + fullYear + ' ' + hours + ':' + minutes;

                formattedDates.push(newDate);
            }

            for (var k = 0; k < latencies.length; ++k) {
                if(typeOfData === 'latency' || typeOfData === 'jitter' ) {
                    dataPoints.push({x: formattedDates[k], y: latencies[k]/1000});
                } else {
                    dataPoints.push({x: formattedDates[k], y: latencies[k]});
                }
            }


            console.log(dataPoints);

            var manualData = [
                {x: '5-3-2018 17:00', y: 200000},
                {x: '5-3-2018 17:30', y: 100000},
                {x: '5-3-2018 18:00', y: 330000},
                {x: '5-3-2018 18:30', y: 450000},
                {x: '5-3-2018 19:00', y: 150000}
            ];

            //console.log(manualData)
            console.log('test 1');

            //return dataPoints;
            latencyDataPoints.push(dataPoints);



        }

        if (typeOfData === 'latency') {
            this.setState({latencies: latencyDataPoints});
        } else if (typeOfData === 'throughput') {
            console.log('throughput: ');
            this.setState({throughput: latencyDataPoints});
        } else if (typeOfData === 'jitter') {
            this.setState({jitter: latencyDataPoints});
        } else if (typeOfData === 'packetloss') {
            this.setState({packetloss: latencyDataPoints});
        } else if (typeOfData === 'bandwidth') {
            this.setState({bandwidth: latencyDataPoints});
        }


    }


    render() {
        const {data} = this.state;

        const config = [
            {color: 'pink'},
            {color: 'cyan'},
            {color: 'grey'},
            {color: 'yellow'},
            {color: 'blue'},
            {color: 'green'},
            {color: 'red'},
            {color: 'purple'},
            {color: 'orange'},
            {color: 'black'},
            {color: 'darkorange'},
            {color: 'mediumseagreen'}

        ];
        var legendData = [];
        this.state.ids.forEach((id) => {
            legendData.push({key: id});
        });
        let html;
        html = (
            <div>
                <ReactTable
                    data={data}
                    columns={[
                        {
                            Header: "Link",
                            accessor: "id"
                        },
                        {
                            Header: "Latency(Microsecond)",
                            columns: [

                                {
                                    Header: "Min",
                                    accessor: "latencyMin"
                                },
                                {
                                    Header: "Max",
                                    accessor: "latencyMax"
                                },
                                {
                                    Header: "Average",
                                    accessor: "latencyAverage"
                                }

                            ]
                        },

                        {
                            Header: "Jitter(Microsecond)",
                            columns: [
                                {
                                    Header: "Min",
                                    accessor: "jitterMin"
                                },
                                {
                                    Header: "Max",
                                    accessor: "jitterMax"
                                },
                                {
                                    Header: "Average",
                                    accessor: "jitterAverage"
                                }
                            ]
                        },
                        {
                            Header: 'PacketLoss(%)',
                            columns: [
                                {
                                    Header: "Min",
                                    accessor: "packetlossMin"
                                },
                                {
                                    Header: "Max",
                                    accessor: "packetlossMax"
                                },
                                {
                                    Header: "Average",
                                    accessor: "packetlossAverage"
                                }
                            ]
                        },
                        {
                            Header: 'Throughput(bytes/s)',
                            columns: [
                                {
                                    Header: "Min",
                                    accessor: "throughputMin"
                                },
                                {
                                    Header: "Max",
                                    accessor: "throughputMax"
                                },
                                {
                                    Header: "Average",
                                    accessor: "throughputAverage"
                                }
                            ]
                        },
                        {
                            Header: 'Bandwidth(bytes)',
                            columns: [
                                {
                                    Header: "Min",
                                    accessor: "bandwidthMin"
                                },
                                {
                                    Header: "Max",
                                    accessor: "bandwidthMax"
                                },
                                {
                                    Header: "Average",
                                    accessor: "bandwidthAverage"
                                }
                            ]
                        },

                    ]}
                    defaultPageSize={10}
                    className="-striped -highlight"
                />
                <br />

                <h1> Latency Chart </h1>
                <Legend data={legendData} dataId={'key'} config={config} horizontal/>
                <LineChart
                    axisLabels={{x: 'Hour', y: 'Percentage'}}
                    datePattern={'%d-%m-%Y %H:%M'}
                    xType={'time'}
                    verticalGrid
                    lineColors={['pink', 'cyan', 'grey', 'yellow', 'blue', 'green', 'red', 'purple', 'orange', 'black', 'darkorange', 'mediumseagreen']}
                    grid
                    margin={{top: 10, right: 0, bottom: 30, left: 100}}
                    axes
                    interpolate={'cardinal'}
                    width={750}
                    height={250}
                    data={this.state.latencies}

                />

                <h1> Jitter Chart </h1>
                <LineChart
                    axisLabels={{x: 'Hour', y: 'Percentage'}}
                    datePattern={'%d-%m-%Y %H:%M'}
                    xType={'time'}
                    verticalGrid
                    lineColors={['pink', 'cyan', 'grey', 'yellow', 'blue', 'green', 'red', 'purple', 'orange', 'black', 'darkorange', 'mediumseagreen']}
                    grid
                    margin={{top: 10, right: 0, bottom: 30, left: 100}}
                    axes
                    interpolate={'cardinal'}
                    width={750}
                    height={250}
                    data={this.state.jitter}

                />
                <h1> Packetloss Chart </h1>
                <LineChart
                    axisLabels={{x: 'Hour', y: 'Percentage'}}
                    datePattern={'%d-%m-%Y %H:%M'}
                    xType={'time'}
                    verticalGrid
                    lineColors={['pink', 'cyan', 'grey', 'yellow', 'blue', 'green', 'red', 'purple', 'orange', 'black', 'darkorange', 'mediumseagreen']}
                    grid
                    margin={{top: 10, right: 0, bottom: 30, left: 100}}
                    axes
                    interpolate={'cardinal'}
                    width={750}
                    height={250}
                    data={this.state.packetloss}

                />

                <h1> Throughput Chart </h1>
                <LineChart
                    axisLabels={{x: 'Hour', y: 'Percentage'}}
                    datePattern={'%d-%m-%Y %H:%M'}
                    xType={'time'}
                    verticalGrid
                    lineColors={['pink', 'cyan', 'grey', 'yellow', 'blue', 'green', 'red', 'purple', 'orange', 'black', 'darkorange', 'mediumseagreen']}
                    grid
                    margin={{top: 10, right: 0, bottom: 30, left: 100}}
                    axes
                    interpolate={'cardinal'}
                    width={750}
                    height={250}
                    data={this.state.throughput}

                />
                <h1> Bandwidth Chart </h1>
                <LineChart
                    axisLabels={{x: 'Hour', y: 'Percentage'}}
                    datePattern={'%d-%m-%Y %H:%M'}
                    xType={'time'}
                    verticalGrid
                    lineColors={['pink', 'cyan', 'grey', 'yellow', 'blue', 'green', 'red', 'purple', 'orange', 'black', 'darkorange', 'mediumseagreen']}
                    grid
                    margin={{top: 10, right: 0, bottom: 30, left: 100}}
                    axes
                    interpolate={'cardinal'}
                    width={750}
                    height={250}
                    data={this.state.bandwidth}

                />
            </div>

        );
        return html;
    }
}
