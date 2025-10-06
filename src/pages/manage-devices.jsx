import { useMemo } from 'react';
import { Accordion } from 'react-accessible-accordion';
import { useStyletron } from 'styletron-react';
import _take from 'lodash/take';
import { useUserDevices } from '../common/hooks';
import { ManageDeviceListItem } from '../components/manage-devices/list-item';
import { PageHeading } from '../shared/base-components';
import { LoadingSpinner } from '../shared/loading-spinner';
import { useTranslations } from '../common/i18n';

function ManageDevicesPage() {
  const { loading, origDevices } = useUserDevices();
  const translate = useTranslations();
  const [css] = useStyletron();

  const firstDevice = useMemo(
    () => _take(origDevices).map(({ name }) => name),
    [origDevices]
  );

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

  return (
    <>
      <PageHeading>{translate('manage-devices-heading')}</PageHeading>
      <Accordion
        allowMultipleExpanded={false}
        allowZeroExpanded={true}
        preExpanded={firstDevice}
        className={css({
          maxWidth: '750px',
        })}
      >
        {(origDevices || []).map((device) => (
          <ManageDeviceListItem key={device.name} device={device} />
        ))}
      </Accordion>
    </>
  );
}

export default ManageDevicesPage;
