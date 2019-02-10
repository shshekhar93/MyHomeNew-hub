import React, { Component } from 'react';
import { Modal, Form, Row, Col, Button } from 'react-bootstrap';

import * as API from '../common/api';

const formFieldsStyle = {
    'margin-top': '1rem'
};

class DeviceSetupModalContainer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            loading: true
        };
        this.switchesInput = {};

        this.deviceRef = React.createRef();
        this.deviceLabelRef = React.createRef();
        this.roomRef = React.createRef();

        this.addDevice = this.addDevice.bind(this);
    }

    componentDidMount() {
        API.getKnownDeviceList()
            .then(devices => this.setState({
                loading: false,
                devices
            }))
            .catch(err => this.setState({
                loading: false,
                error: true
            }));
    }

    saveUnitEnabled(rowNum, event) {
        this.switchesInput[rowNum] = Object.assign({}, this.switchesInput[rowNum], {
            enabled : event.target.checked
        });
    }
    
    saveUnitName(rowNum, event) {
        this.switchesInput[rowNum] = Object.assign({}, this.switchesInput[rowNum], {
            label : event.target.value
        });
    }

    addDevice() {
        if(!this.deviceRef.current.value || !this.deviceLabelRef.current.value || !this.roomRef.current.value) {
            console.log('validation failed!')
            return;
        }
        const selectedInputs = Object.keys(this.switchesInput).filter(id => this.switchesInput[id].enabled && this.switchesInput[id].label);
        if(selectedInputs.length === 0) {
            console.log('select at least one switch');
            return;
        }

        const request = {
            name: this.deviceRef.current.value,
            label: this.deviceLabelRef.current.value,
            room: this.roomRef.current.value,
            leads: selectedInputs.map(id=> {
                const thisSwitch = this.switchesInput[id];
                return {
                    devId: id,
                    label: thisSwitch.label
                }
            })
        }
        
        API.saveDeviceForUser(request)
            .then(() => {
                this.props.closeModal();
            })
            .catch(err => {
                console.log('an error occured:', err);
            });
    }

    getModalBody() {
        if(this.state.loading) {
            return <span>loading</span>;
        } else if(this.state.error){
            return <span>An error occured! Please try again later.</span>;
        } else {
            return (
                <div>
                    <Form.Label>Device name</Form.Label>
                    <Form.Control as="select" ref={this.deviceRef}>
                        <option value="">Select one</option>
                        {
                            Object.keys(this.state.devices || {}).map((device) => (
                                <option value={device}>{ device }</option>
                            ))
                        }
                    </Form.Control>
                    <Form.Label style={formFieldsStyle}>Device label</Form.Label>
                    <Form.Control as="input" placeholder="Consider a friendlier name?" ref={this.deviceLabelRef}></Form.Control>

                    <Form.Label style={formFieldsStyle}>Room</Form.Label>
                    <Form.Control placeholder="which room is this device in?" ref={this.roomRef}></Form.Control>
                    <br />
                    <hr />
                    <Form.Group style={formFieldsStyle}>
                        <Form.Label>Units in this device:</Form.Label>
                        {
                            [0,1,2,3].map((rowNum) => (
                                <Row style={ formFieldsStyle }>
                                    <Col xs={3}>
                                        <span className="align-middle">Switch {rowNum + 1}:</span>
                                    </Col>
                                    <Col xs={2}>
                                        <label className="switch align-middle">
                                            <input type="checkbox" onChange={this.saveUnitEnabled.bind(this, rowNum)} />
                                            <span className="slider"></span>
                                        </label>
                                    </Col>
                                    <Col>
                                        <Form.Control placeholder="Consider a name?" onChange={this.saveUnitName.bind(this, rowNum)}></Form.Control>
                                    </Col>
                                </Row>
                            ))
                        }
                    </Form.Group>
                    <Form.Group>
                        <Button variant="primary" size="medium" style={{
                            'margin-top': '20px',
                            'margin-left': '140px',
                            'width': '150px'
                        }} 
                        onClick={this.addDevice}>Save</Button>
                    </Form.Group>
                </div>
            );
        }
    }

    render() {
        return (
            <Modal show={true} onHide={ this.props.closeModal }>
                <Modal.Header closeButton>
                    <Modal.Title>Select a device</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    { this.getModalBody() }
                </Modal.Body>
            </Modal>
        );
    }
}

export default DeviceSetupModalContainer;
