import React from 'react';
import {Card, Row, Col, Form} from 'react-bootstrap';
import Slider, {createSliderWithTooltip} from 'rc-slider';

import '../css/device-list.less';
import 'rc-slider/assets/index.css';

const SliderWithTooltip = createSliderWithTooltip(Slider);

const getSwitchesDisplay = (dev, onChange) => {
    const { leads } = dev;

    return (leads || []).map((switchUnit, idx) => {
        return (
            <Row>
                <Col>
                    <span>{switchUnit.label || ('Switch ' + (idx + 1))}</span>
                </Col>
                <Col xs={3}>
                    <label className="switch align-middle">
                        <input type="checkbox" onChange={onChange.bind(null, dev.name, idx)} checked={switchUnit.brightness > 0} />
                        <span className="slider"></span>
                    </label>
                </Col>
                <Col xs={1}>
                    <SliderWithTooltip 
                        vertical 
                        onChange={onChange.bind(null, dev.name, idx)} value={switchUnit.brightness || 0} 
                        handleStyle={{
                            bottom: '100%',
                            'border-radius': '0',
                            width: '20px',
                            height: '10px',
                            'margin-left': '-8px'
                        }}
                    />
                </Col>
            </Row>
        );
    });
};

const DeviceList = (props) => {
    const { dev } = props;
    const { leads } = dev;
    return (
        <Card>
            <Card.Header>{dev.label || dev.name} <span className={'acitivtyDot ' + (dev.isActive ? 'active': '')}></span></Card.Header>
            <Card.Body>
                {getSwitchesDisplay(dev, props.onChange)}
            </Card.Body>
        </Card>
    );
}

export default DeviceList;
