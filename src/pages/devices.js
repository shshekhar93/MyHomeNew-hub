import { Accordion } from 'react-accessible-accordion';
import { useStyletron } from 'styletron-react';
import { useUserDevices } from '../common/hooks.js';
import { DeviceGroup } from '../components/devices/group.js';
import { PageHeading } from '../shared/base-components.js';
import { LoadingSpinner } from '../shared/loading-spinner.js';

function DevicePage() {
  const { loading, devices } = useUserDevices();
  const [css] = useStyletron();

  if (loading) {
    return (
      <div
        className={css({
          display: 'flex',
          justifyContent: 'center',
        })}
      >
        <LoadingSpinner size="5em" border="0.6em" />
      </div>
    );
  }

  const rooms = Object.keys(devices || {});
  if (rooms.length === 0) {
    return 'No devices added yet.';
  }

  return (
    <>
      <PageHeading>All Devices</PageHeading>
      <Accordion
        allowMultipleExpanded={true}
        allowZeroExpanded={true}
        preExpanded={rooms}
        className={css({
          maxWidth: '750px',
        })}
      >
        {rooms.map((room) => (
          <DeviceGroup key={room} name={room} devices={devices[room]} />
        ))}
      </Accordion>
    </>
  );
}

export default DevicePage;
