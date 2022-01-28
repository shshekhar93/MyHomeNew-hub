import { AccordionItem, AccordionItemButton, AccordionItemHeading, AccordionItemPanel } from "react-accessible-accordion";
import { useStyletron } from "styletron-react";
import { useTheme } from "../../common/theme.js";
import { DeviceEntry } from "./entry.js";

function DeviceGroup({ name, devices }) {
  const { theme } = useTheme();
  const [css] = useStyletron();

  return (
    <AccordionItem uuid={name} className={css({
      border: `1px solid ${theme.border}`,
      padding: '0.5rem 0.75rem',
    })}>
      <AccordionItemHeading>
        <AccordionItemButton className={'accordion-btn ' + css({
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '1.25rem',
          cursor: 'pointer',

          ':after': {
            content: "''",
            display: 'inline-block',
            width: '10px',
            height: '10px',
            borderBottom: '2px solid currentColor',
            borderRight: '2px solid currentColor',
            marginRight: '12px',
            transform: 'rotate(-45deg) translate(-3px, -3px)',
          }
        })}>{name}</AccordionItemButton>
      </AccordionItemHeading>
      <AccordionItemPanel>
        {devices.map(device => (
          <DeviceEntry key={`${device.name}|${device.devId}`} device={device} />
        ))}
      </AccordionItemPanel>
    </AccordionItem>
  );
}

export { DeviceGroup };
