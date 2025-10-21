import { exists, gt, type ValidationSchemaT } from './common.js';

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
] as ValidationSchemaT[];

export { DeviceSchema };
