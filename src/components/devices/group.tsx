import { useMemo } from 'react';
import {
  AccordionItemHeading,
  AccordionItemPanel,
} from 'react-accessible-accordion';
import {
  StyledAccordionItem,
  StyledAccordionItemButton,
} from '../../shared/base-components';
import { StatusIndicator } from '../common/status-indicator';
import { DeviceEntry } from './entry';
import { MappedDeviceT } from '../../../types/device';

export type DeviceGroupProps = {
  name: string;
  devices: MappedDeviceT[];
};

function DeviceGroup({ name, devices }: DeviceGroupProps) {
  const someDevicesActive = useMemo(
    () => devices.some(({ isActive }) => isActive),
    [devices],
  );

  return (
    <StyledAccordionItem uuid={name}>
      <AccordionItemHeading>
        <StyledAccordionItemButton className="accordion-btn">
          <span>
            {name}
            {someDevicesActive && (
              <StatusIndicator available={someDevicesActive} />
            )}
          </span>
        </StyledAccordionItemButton>
      </AccordionItemHeading>
      <AccordionItemPanel>
        {devices.map(device => (
          <DeviceEntry key={`${device.name}|${device.devId}`} device={device} />
        ))}
      </AccordionItemPanel>
    </StyledAccordionItem>
  );
}

export { DeviceGroup };
