'use strict';
import React from 'react';
import { Container, Row, Col, Nav } from 'react-bootstrap';

import '../css/side-bar.less';

const SideNav = (props) => {
    return (
        <Col xl={2} xs={12} md={3} className={ "flex-column side-bar collapse " + (props.displayNav? "show": "") }>
            <Nav className="flex-column" onSelect={ props.navigate }>
                <Nav.Link eventKey="manage">Manage devices</Nav.Link>
                <Nav.Link eventKey="setup">Setup new device</Nav.Link>
                <Nav.Link eventKey="logout">Logout</Nav.Link>
            </Nav>
        </Col>
    );
};

export default SideNav;
