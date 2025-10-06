import { Accordion } from 'react-accessible-accordion';
import { useStyletron } from 'styletron-react';
import { useUserDevices } from '../common/hooks';
import { useTranslations } from '../common/i18n';
import { DeviceGroup } from '../components/devices/group';
import { PageHeading } from '../shared/base-components';
import { LoadingSpinner } from '../shared/loading-spinner';

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
          : rooms.map(room => (
              <DeviceGroup key={room} name={room} devices={devices[room]} />
            ))}
      </Accordion>
    </>
  );
}

export default DevicePage;
