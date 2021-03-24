'use strict';
import 'promise-polyfill/src/polyfill';
import 'whatwg-fetch';

import React from 'react';
import ReactDom from 'react-dom';

import WatchPageContainer from './containers/WatchPageContainer';

ReactDom.render(<WatchPageContainer />, document.getElementById('root'));
