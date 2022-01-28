'use strict';
import 'promise-polyfill/src/polyfill.js';
import 'whatwg-fetch';

import ReactDom from 'react-dom';

import App from './app.js';

ReactDom.render(<App />, document.getElementById('root'));
