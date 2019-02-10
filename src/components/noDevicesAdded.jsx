'use strict';

import React from 'react';

const NoDeviceMessageComponent = (props) => {
    return (
        <div className="no-items-section">
            <h4>Looks like you haven't added any devices to your profile.</h4>
            <h4>Would you like to <span className="btn-link" style={{cursor: 'pointer'}} onClick={ props.setupNewDevice }>add one now</span>?</h4>
        </div>
    );
};

export default NoDeviceMessageComponent;
