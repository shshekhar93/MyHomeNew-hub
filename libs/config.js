import { readFileSync } from 'fs';

const config = JSON.parse(readFileSync(new URL('../config/config.json', import.meta.url), 'utf8'));
export default config;
