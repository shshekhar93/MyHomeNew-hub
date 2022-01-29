import { Accordion } from "react-accessible-accordion";
import { useStyletron } from "styletron-react";
import { hookUserDevices } from "../common/hooks.js";
import { DeviceGroup } from "../components/devices/group.js";

function DevicePage() {
  const { devices = {}, reloadDevices } = hookUserDevices();
  const [css] = useStyletron();

  const rooms = Object.keys(devices);
  if(rooms.length === 0) {
    return "No devices added yet.";
  }

  return (
    <>
      <h1 className={css({
        marginTop: 0
      })}>All Devices</h1>
      <Accordion
        allowMultipleExpanded={true}
        allowZeroExpanded={true}
        preExpanded={rooms}
        className={css({
          maxWidth: '750px'
        })}
      >
        {rooms.map(room => (
          <DeviceGroup key={room} name={room} devices={devices[room]} />
        ))}
      </Accordion>
    </>
  );
}

export default DevicePage;
