import React from 'react';
import {Card, Row, Col, Form} from 'react-bootstrap';

const getSwitchesDisplay = (dev, onChange) => {
    const { leads } = dev;

    return (leads || []).map((switchUnit, idx) => {
        return (
            <Row>
                <Col>
                    <span>{switchUnit.label || ('Switch ' + (idx + 1))}</span>
                </Col>
                <Col xs={4}>
                    <label className="switch align-middle">
                        <input type="checkbox" onChange={onChange.bind(null, dev.name, idx)}/>
                        <span className="slider"></span>
                    </label>
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
            <Card.Header>{dev.label || dev.name}</Card.Header>
            <Card.Body>
                {getSwitchesDisplay(dev, props.onChange)}
            </Card.Body>
        </Card>
    );
}

export default DeviceList;
