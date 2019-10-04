import React, { Component } from 'react';
import { Modal, Form, Row, Col, Button } from 'react-bootstrap';
import _get from 'lodash';

import * as API from '../../common/api';
import GenericSetup from './generic-setup';
import LightSetup from './light-setup';
import SwitchSetup from './switch-setup';

class DeviceSetupModalContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      showOTK: false,
      otk: '',
      leads: {}
    };

    this.addDevice = this.addDevice.bind(this);
    this.updateSetupComponent = this.updateSetupComponent.bind(this);
    this.updateLead = this.updateLead.bind(this);
    this.updateValue = this.updateValue.bind(this);
    this.generateOTK = this.generateOTK.bind(this);
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

  updateLead(leadNum, mergeObj) {
    this.setState({
      leads: {
        ...this.state.leads,
        [leadNum]: {
          ...this.state.leads[leadNum],
          ...mergeObj
        }
      }
    })
  }

  updateValue(e) {
    const { name, type, value, checked } = e.target;
    const finalValue = type === 'checkbox' ? checked : value;
    this.setState({
      [name]: finalValue
    });
  }

  addDevice() {
    if(!this.state.selectedDevice || !this.state.deviceLabel || !this.state.room) {
      console.log('validation failed!', !this.state.selectedDevice, !this.state.deviceLabel, !this.state.room)
      return;
    }
    
    const selectedInputs = Object.keys(this.state.leads).filter(id => 
      this.state.leads[id].enabled && this.state.leads[id].label);
    if(selectedInputs.length === 0) {
      console.log('select at least one switch');
      return;
    }

    const request = {
      name: this.state.selectedDevice,
      label: this.state.deviceLabel,
      room: this.state.room,
      leads: selectedInputs.map(id=> {
        const thisSwitch = this.state.leads[id];
        return {
          devId: id,
          type: thisSwitch.type,
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

  updateSetupComponent(event) {
    const devName = event.target.value;
    const devType = _get(this.state, `devices[${devName}].type`);

    if(devName === '') {
      this.SetupComponent = null;
      return this.setState({ selectedDevice: null });
    }


    // if(devType === 'light') {
    //   this.SetupComponent = LightSetup
    // }
    // else if(devType === 'switch') {
    //   this.SetupComponent = SwitchSetup
    // }
    // else {
      this.SetupComponent = GenericSetup;
    // }

    this.setState({
      selectedDevice: devName
    });
  }

  generateOTK(e) {
    e.preventDefault();
    API.generateOTK()
      .then(({otk}) => {
        this.setState({
          showOTK: true,
          otk
        });
      })
      .catch(() => {
        this.setState({
          error: true
        });
      })
  }

  getModalBody() {
    if(this.state.loading) {
      return <span>loading</span>;
    }
    
    if(this.state.error){
      return <span>An error occured! Please try again later.</span>;
    }

    if(this.state.showOTK) {
      return (
        <div>
          <p>One time setup key generated</p>
          <h2 className="text-center" style={{color: 'green'}}>{this.state.otk}</h2>
          <p>To add a new device to your account:</p>
          <ol>
            <li>Plug in your device and switch it on.</li>
            <li>Connect to the WiFi access point started by device.</li>
            <li>When the setup modal opens, enter your user id, and this key</li>
            <li>Select your home WiFi SSID and provide password.</li>
            <li>Once the device connects to internet, you will see the device listed here, ready for setup.</li>
          </ol>
        </div>
      );
    }
    
    if(Object.keys(this.state.devices || {}).length === 0) {
      return (
        <React.Fragment>
          <p>No device awaiting setup!</p>
          <p><a href="#" onClick={this.generateOTK}>Generate an One Time Key (OTK)</a> to activate a new device.</p>
          <span>If you have already activated your device using OTK, make sure its plugged in and connected to your WiFi.</span>
        </React.Fragment>
      );
    }

    return (
      <div>
        <Form.Label>Available devices</Form.Label>
        <Form.Control className="form-group" as="select" onChange={this.updateSetupComponent}>
          <option value="">Select one</option>
          {
              Object.keys(this.state.devices || {}).map(device => <option value={device}>{device}</option>)
          }
        </Form.Control>
        
        {
          this.SetupComponent && <this.SetupComponent 
            updateValue={this.updateValue}
            updateLead={this.updateLead} /> ||
          <span>Please select a device to configure</span>
        }
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
