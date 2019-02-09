'use strict';
import 'promise-polyfill/src/polyfill';
import 'whatwg-fetch';

import React from 'react';
import ReactDom from 'react-dom';

import PageContainer from './containers/PageContainer';

ReactDom.render(<PageContainer />, document.getElementById('root'));
