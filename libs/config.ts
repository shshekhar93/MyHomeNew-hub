import { readFileSync } from 'fs';
import { RootURL } from './esm-utils.js';

const config = JSON.parse(
  readFileSync(new URL('./config/config.json', RootURL), 'utf8'),
);
export default config;
