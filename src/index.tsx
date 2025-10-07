'use strict';
import 'promise-polyfill/src/polyfill';
import 'whatwg-fetch';

import { createRoot } from 'react-dom/client';

import App from './app';

const root = createRoot(document.getElementById('root')!);

root.render(<App />);
