'use strict';

import React from 'react';
import { Navbar, Nav } from 'react-bootstrap';

const imgStyle = {
    filter: 'grayscale(100%) invert(100%)',
    'margin-right': '10px',
    width: '25px',
    height: '25px'
};

const nav = (props) => {
    return (
        <Navbar bg="dark" variant="dark">
            <Navbar.Brand href="#home">
            <img
                alt=""
                src="/images/home-logo-truncated.png"
                className="d-inline-block align-top"
                style = {imgStyle}
            />
            {' My Home'}
            </Navbar.Brand>
            <span className="navbar-toggler-icon ml-auto d-md-none" onClick={ props.onToggle }></span>
            <span className="ml-auto d-none d-md-block" style={{color: '#fff', cursor: 'pointer'}} onClick={ props.onLogout }><img src="https://unpkg.com/open-iconic@1.1.1/svg/account-logout.svg" style={imgStyle}></img>Logout</span>
        </Navbar>
    );
};

export default nav;
