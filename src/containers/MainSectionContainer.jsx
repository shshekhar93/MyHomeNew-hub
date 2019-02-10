'use strict';
import React, { Component } from 'react';
import _get from 'lodash/get';

import * as API from '../common/api';
import '../css/main.less';

class MainSectionContainer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            loading: true,
            devices: []
        };
    }

    componentDidMount() {
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

    getDeviceUI() {
        if(this.state.loading){
            return (
                <div>
                    <div className="loading"></div>
                </div>
            );
        }
        if(this.state.devices.length === 0) {
            console.log('here');
            return (
                <div className="no-items-section">
                    <h4>Looks like you haven't added any devices to your profile.</h4>
                    <h4>Would you like to add one now?</h4>
                </div>
            );
        }
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
