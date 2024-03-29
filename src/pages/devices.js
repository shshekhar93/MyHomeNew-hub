import { Accordion } from 'react-accessible-accordion';
import { useStyletron } from 'styletron-react';
import { useUserDevices } from '../common/hooks.js';
import { useTranslations } from '../common/i18n.js';
import { DeviceGroup } from '../components/devices/group.js';
import { PageHeading } from '../shared/base-components.js';
import { LoadingSpinner } from '../shared/loading-spinner.js';

function DevicePage() {
  const { loading, devices } = useUserDevices();
  const translate = useTranslations();
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

  return (
    <>
      <PageHeading>{translate('devices-heading')}</PageHeading>
      <Accordion
        allowMultipleExpanded={true}
        allowZeroExpanded={true}
        preExpanded={rooms}
        className={css({
          maxWidth: '750px',
        })}
      >
        {rooms.length === 0
          ? translate('devices-none-added')
          : rooms.map((room) => (
              <DeviceGroup key={room} name={room} devices={devices[room]} />
            ))}
      </Accordion>
    </>
  );
}

export default DevicePage;
