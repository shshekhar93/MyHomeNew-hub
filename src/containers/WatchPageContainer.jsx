import React, {
  useState, useEffect, useCallback
} from 'react';
import * as API from '../common/api';
import LoginComponent from '../components/login';
import Switch from '../components/switch';

import "../css/watch.less";

function WatchPageContainer() {
  const [loggedin, setLoggedin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [devices, setDevices] = useState([]);

  useEffect(() => {
    setLoading(true);
    API.getExistingDevices()
      .then(devices => {
        setDevices(mapToLeads(devices));
      })
      .catch(err => {
        if(err === API.UNAUTHORIZED) {
          setLoggedin(false);
        }
        setDevices([]);
      })
      .then(() => setLoading(false));
  }, []);

  const onLogin = useCallback((username, password) => {
    API.login(username, password)
      .then(() => setLoggedin(true))
      .catch(err => console.error(err.stack));
  }, []);

  const onToggle = useCallback((idx, e) => {
    const newState = e.target.checked ? 100 : 0;
    const device = devices[idx];

    API.updateDeviceState(device.name, device.switchId, newState)
      .then(() => {
        setDevices(devices => devices.map(dev => ({
          ...dev,
          brightness: dev.name === device.name && dev.switchId === device.switchId ? newState : dev.brightness
        })));
      })
      .catch(err => console.log(err));
  }, [ devices ]);

  if(!loggedin) {
    return <LoginComponent onLogin={onLogin} />
  }

  if(loading) {
    return (
      <div>
        <div className="loading"></div>
      </div>
    );
  }

  if(devices.length === 0) {
    return (
      <div id="watch-page-controller">
        <h2>No devices added.</h2>
        <p>Login on a mobile or computer to complete setup.</p>
      </div>
    );
  }

  return (
    <div id="watch-page-controller">
      {devices.map((device, idx) => (
        <div className="watch-page-item">
          <label style={{
            fontWeight: device.type === 'room' ? 'bold' : ''
          }}>{device.label}</label>
          {device.type !== 'room' &&
            <Switch onChange={onToggle.bind(null, idx)} checked={ +device.brightness > 0 } />
          }
        </div>
      ))}
    </div>
  );
}

function mapToLeads(devices) {
  return devices.flatMap(device => {
    return ([{
        type: 'room',
        label: device.room
      }])
        .concat(
          (device.leads || [])
            .map((lead, idx) => ({
              name: device.name,
              switchId: idx,
              label: lead.label,
              brightness: lead.brightness
            }))
        );
  });
}

export default WatchPageContainer;

