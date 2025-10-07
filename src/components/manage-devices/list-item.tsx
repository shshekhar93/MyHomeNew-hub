import {
  AccordionItemHeading,
  AccordionItemPanel,
} from 'react-accessible-accordion';
import {
  StyledAccordionItem,
  StyledAccordionItemButton,
} from '../../shared/base-components.jsx';
import { ManageDeviceInput } from './input.js';
import { DeviceT } from '../../../types/device.js';

export type ManageDeviceListItemProps = {
  device: DeviceT;
};

function ManageDeviceListItem({ device }: ManageDeviceListItemProps) {
  return (
    <StyledAccordionItem uuid={device.name}>
      <AccordionItemHeading>
        <StyledAccordionItemButton className="accordion-btn">
          {device.name}
        </StyledAccordionItemButton>
      </AccordionItemHeading>
      <AccordionItemPanel>
        <ManageDeviceInput device={device} />
      </AccordionItemPanel>
    </StyledAccordionItem>
  );
}

export { ManageDeviceListItem };
