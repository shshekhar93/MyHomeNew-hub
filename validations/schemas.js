import { exists, gt } from './common.js';

const DeviceSchema = [
  ['name', exists],
  ['label', exists],
  ['leads.length', gt(0)],
  [
    'leads',
    [
      ['label', exists],
      ['type', exists],
    ],
  ],
];

export { DeviceSchema };
