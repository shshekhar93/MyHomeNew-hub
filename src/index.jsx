'use strict';
import 'promise-polyfill/src/polyfill';
import 'whatwg-fetch';

import ReactDom from 'react-dom';

import App from './app';

ReactDom.render(<App />, document.getElementById('root'));
