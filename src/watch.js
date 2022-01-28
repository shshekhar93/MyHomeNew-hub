'use strict';
import 'promise-polyfill/src/polyfill.js';
import 'whatwg-fetch';

import React from 'react';
import ReactDom from 'react-dom';

import WatchPageContainer from './containers/WatchPageContainer.jsx';

ReactDom.render(<WatchPageContainer />, document.getElementById('root'));
