import { useMemo } from 'react';
import {
  AccordionItemHeading,
  AccordionItemPanel,
} from 'react-accessible-accordion';
import {
  StyledAccordionItem,
  StyledAccordionItemButton,
} from '../../shared/base-components.js';
import { StatusIndicator } from '../common/status-indicator.js';
import { DeviceEntry } from './entry.js';

function DeviceGroup({ name, devices }) {
  const someDevicesActive = useMemo(
    () => devices.some(({ isActive }) => isActive),
    [devices]
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
        {devices.map((device) => (
          <DeviceEntry key={`${device.name}|${device.devId}`} device={device} />
        ))}
      </AccordionItemPanel>
    </StyledAccordionItem>
  );
}

export { DeviceGroup };
