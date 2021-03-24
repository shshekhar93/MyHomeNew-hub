import React from 'react';
import { Card } from 'react-bootstrap';
import '../css/device-list.less';
import Switch from './switch';

const SwitchDisplay = ({leads = [], name, isActive, onChange}) => {
  return (leads || []).map((switchUnit, idx) => (
    <div className="device-entry">
      <div>
          <span>{switchUnit.label || ('Switch ' + (idx + 1))}</span>
          { leads.length === 1 && 
            <span className={'acitivtyDot ' + (isActive ? 'active': '')}></span>
          }
      </div>
      <div>
        <Switch onChange={ onChange.bind(null, name, idx) } checked={ switchUnit.brightness > 0 } />
      </div>
    </div>
  ))
};

const DeviceList = props => {
    const { dev } = props;
    const { leads = [] } = dev;
    return (
      <Card className="device-row">
        { leads.length > 1 && 
            <Card.Header>{dev.label || dev.name} <span className={'acitivtyDot ' + (dev.isActive ? 'active': '')}></span></Card.Header>
        }
        <Card.Body className="device-body">
          <SwitchDisplay {...dev} onChange={ props.onChange } />
        </Card.Body>
      </Card>
    );
}

export default DeviceList;
