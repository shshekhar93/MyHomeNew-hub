'use strict';
import React, { Component } from 'react';
import '../css/main.less';

class MainSectionContainer extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <main className="col-xl-8 col-md-9 col-12 main-section">
                Hello World!
            </main>
        );
    }
}

export default MainSectionContainer;
