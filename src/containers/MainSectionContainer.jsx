import React, { Component } from 'react';
import _get from 'lodash/get';
import _uniq from 'lodash/uniq';

import * as API from '../common/api';
import NoDeviceMessageComponent from '../components/noDevicesAdded';
import DeviceSetupModalContainer from './DeviceSetupModalContainer';
import '../css/main.less';
import { Tabs, Tab } from 'react-bootstrap';

class MainSectionContainer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            loading: true,
            devices: []
        };

        this.setupNewDevice = this.setupNewDevice.bind(this);
    }

    componentDidMount() {
        this.loadDevicesList();
    }

    loadDevicesList() {
        API.getExistingDevices()
            .then(devices => {
                this.setState({
                    loading: false,
                    devices
                });
            })
            .catch(err => {
                this.setState({
                    loading: false,
                    devices: []
                })
            });
    }

    setupNewDevice() {
        this.setState({
            showDeviceSetupModel: true
        })
    }

    getDeviceUI() {
        if(this.state.loading){
            return (
                <div>
                    <div className="loading"></div>
                </div>
            );
        }

        if(this.state.showDeviceSetupModel) {
            return <DeviceSetupModalContainer closeModal={() => {
                this.setState({ showDeviceSetupModel: false });
                this.loadDevicesList();
            }} />;
        }

        if(this.state.devices.length === 0) {
            return <NoDeviceMessageComponent setupNewDevice={this.setupNewDevice} />;
        }

        const roomsList = _uniq(this.state.devices.map(device => device.room));
        const roomTabs = roomsList.map(room => {
            const devsInThisRoom = this.state.devices.filter(dev => dev.room === room);

            return (
                <Tab eventKey={room} title={room}>
                    <span>we have {devsInThisRoom.length} devices here!</span>
                </Tab>
            );
        });

        return (
            <Tabs>
                { roomTabs }
            </Tabs>
        );
    }

    render() {
        const firstName = _get(this.props, 'user.name', '').split(' ')[0];

        return (
            <main className="col-xl-8 col-md-9 col-12 main-section">
                <h1>Hello { firstName }!</h1>
                { this.getDeviceUI() }
            </main>
        );
    }
}

export default MainSectionContainer;
