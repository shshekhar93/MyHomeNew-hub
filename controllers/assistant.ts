'use strict';
import _get from 'lodash/get.js';
import { getCurrentUser } from '../libs/helpers.js';
import { logError } from '../libs/logger.js';
import DeviceModel, { type DeviceModelT } from '../models/devices.js';
import { getDevState, updateDeviceState } from './devices.js';
import type { Request, Response } from 'express';
import type { BaseMongooseMixin } from '../types/mongoose-mixins.js';
import type { UserT } from '../types/user.js';
import type { AssistantCommandT } from '../types/assistant.js';

async function syncDevices(req: Request, res: Response) {
  const user = getCurrentUser(req, res);
  const userEmail = user?.email;
  const agentUserId = user?._id;

  try {
    const devices = await DeviceModel.find({ user: userEmail });

    res.json({
      requestId: req.body.requestId,
      payload: {
        agentUserId,
        devices: devices.map(deviceMapper).flat(),
      },
    });
  }
  catch (err) {
    logError(err);
    res.status(500).json({
      message: 'something went wrong, try again later',
    });
  }
}

function getDeviceType(dbType: string) {
  if (dbType === 'light' || dbType === 'fan') {
    return dbType.toUpperCase();
  }
  if (dbType === 'ac') {
    return 'AC_UNIT';
  }
  return 'SWITCH';
}

function deviceMapper(device: DeviceModelT & BaseMongooseMixin) {
  return (device.leads || []).map(lead => ({
    id: `${device._id}-${lead.devId}`,
    type: `action.devices.types.${getDeviceType(lead.type)}`,
    traits: ['action.devices.traits.OnOff'],
    name: {
      defaultNames: [`${device.name}-${lead.devId}`],
      name: lead.label,
      nicknames: [`${device.room}-${lead.label}`],
    },
    willReportState: false,
    roomHint: device.room,
    deviceInfo: {
      manufacturer: 'Shashi',
      model: 'v0.0.1',
      hwVersion: '0.0.1',
      swVersion: '0.0.1',
    },
  }));
}

export type AssistantDeviceStateT = {
  on: boolean;
  online: boolean;
};

function devsToQueryResponseReducer(allDeviceStates: ({
  _id?: string;
  isActive: boolean;
  leads: { devId: number; brightness: number }[];
})[]) {
  return (resp: Record<string, AssistantDeviceStateT>, [id, devId = '0']: [string, string]): Record<string, AssistantDeviceStateT> => {
    const thisDev = allDeviceStates.find(dev => dev._id === id) ?? { isActive: false, leads: [] };
    const thisLead
      = thisDev.leads.find(lead => lead.devId === Number(devId)) ?? { brightness: 0 };

    return {
      ...resp,
      [`${id}-${devId}`]: {
        on: thisLead.brightness === 100,
        online: thisDev.isActive,
      },
    };
  };
}

export type QueryStatusRequestBodyT = {
  requestId: string;
  inputs: {
    intent: string;
    payload: {
      commands?: {
        devices: { id: string }[];
        execution: { command: string; params: { on: boolean } }[];
      }[];
      devices?: { id: string }[];
    };
  }[];
};

async function queryStatus(req: Request<unknown, unknown, QueryStatusRequestBodyT>, res: Response) {
  try {
    const devicesToQuery = (req?.body?.inputs?.[0]?.payload?.devices ?? []).map(
      dev => dev?.id?.split('-') ?? [],
    ) as [string, string][];

    const allDeviceStates = await Promise.all(
      devicesToQuery
        .map(arr => arr[0])
        .map(async devId => getDevState((await DeviceModel.findById(devId))!)),
    );
    const devices = devicesToQuery.reduce(
      devsToQueryResponseReducer(allDeviceStates),
      {},
    );

    res.json({
      requestId: req.body.requestId,
      payload: {
        devices,
      },
    });
  }
  catch (err) {
    logError(err);
    res.status(500).json({
      message: 'Something went wrong, please try again later.',
    });
  }
}

async function execute(req: Request, res: Response) {
  const commands = _get(req.body, 'inputs[0].payload.commands', []) as AssistantCommandT[];
  const currentUser = getCurrentUser(req, res);

  try {
    const allResponses = (
      await Promise.all(commands.map(commandExecutor.bind(null, currentUser)))
    ).flat();

    const resultMap = allResponses.reduce((result, resp) => {
      const key = resp.status === 'ERROR' ? 'error' : resp.isOn ? 'on' : 'off';
      return {
        ...result,
        [key]: [...(result?.[key] ?? []), resp.id],
      };
    }, {} as Record<'on' | 'off' | 'error', string[]>);

    res.json({
      requestId: req.body.requestId,
      payload: {
        commands: [
          resultMap?.on?.length && {
            ids: resultMap.on,
            status: 'SUCCESS',
            states: {
              on: true,
              online: true,
            },
          },
          resultMap?.off?.length && {
            ids: resultMap.off,
            status: 'SUCCESS',
            states: {
              on: false,
              online: true,
            },
          },
          resultMap?.error?.length && {
            ids: resultMap.error,
            status: 'ERROR',
          },
        ].filter(Boolean),
      },
    });
  }
  catch (err) {
    logError(err);
    res.status(400).json({});
  }
}

async function commandExecutor(currentUser: UserT & BaseMongooseMixin, command: AssistantCommandT) {
  const devices = command?.devices ?? [];
  const applicableCmd = (command?.execution ?? []).find(
    ({ command }) => command === 'action.devices.commands.OnOff',
  );
  const isOn = _get(applicableCmd, 'params.on') ?? false;

  return Promise.all(
    devices.map(dev => executeDeviceCommand(currentUser, dev.id, isOn)),
  );
}

async function executeDeviceCommand(currentUser: UserT & BaseMongooseMixin, id: string, isOn: boolean) {
  const [devId, devLeadId] = id.split('-');

  try {
    if (!devId || !devLeadId) {
      throw new Error(`Invalid device id ${id}`);
    }

    const device = await DeviceModel.findById(devId).lean();
    if (!device) {
      throw new Error('Device does not exist');
    }

    if (!device.user || device.user !== currentUser?.email) {
      throw new Error(`Unauthorized access to ${id} by ${currentUser._id}`);
    }

    await updateDeviceState(
      device.user,
      device.name,
      devLeadId,
      isOn ? 100 : 0,
    );

    await DeviceModel.update(
      {
        _id: devId,
        'leads.devId': devLeadId,
      },
      {
        'leads.$.state': isOn ? 100 : 0,
      },
    ).exec();

    return {
      status: 'SUCCESS',
      id,
      isOn,
    };
  }
  catch (err) {
    logError(`Device ${id} state update failed`);
    logError(err);
    return { id, status: 'ERROR' };
  }
}

export { syncDevices, queryStatus, execute };
