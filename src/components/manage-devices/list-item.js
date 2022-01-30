import { AccordionItemHeading, AccordionItemPanel } from "react-accessible-accordion";
import { StyledAccordionItem, StyledAccordionItemButton } from "../../shared/base-components.js";
import { ManageDeviceInput } from "./input.js";

function ManageDeviceListItem({device}) {
  return (
    <StyledAccordionItem uuid={device.name}>
      <AccordionItemHeading>
        <StyledAccordionItemButton className="accordion-btn" >{device.name}</StyledAccordionItemButton>
      </AccordionItemHeading>
      <AccordionItemPanel>
        <ManageDeviceInput device={device} />
      </AccordionItemPanel>
    </StyledAccordionItem>
  );
}

export { ManageDeviceListItem };
