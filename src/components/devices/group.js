import { AccordionItemHeading, AccordionItemPanel } from "react-accessible-accordion";
import { StyledAccordionItem, StyledAccordionItemButton } from "../../shared/base-components.js";
import { DeviceEntry } from "./entry.js";

function DeviceGroup({ name, devices }) {
  return (
    <StyledAccordionItem uuid={name}>
      <AccordionItemHeading>
        <StyledAccordionItemButton className="accordion-btn">
          {name}
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
