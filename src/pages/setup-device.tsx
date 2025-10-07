import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStyletron } from 'styletron-react';
import { usePendingDevices } from '../common/hooks';
import { useTranslations } from '../common/i18n';
import { useTheme } from '../common/theme';
import { ManageDeviceInput } from '../components/manage-devices/input';
import { OTP } from '../components/manage-devices/otp';
import {
  InputLabel,
  InputLabelText,
  PageHeading,
  Select,
} from '../shared/base-components';
import { LoadingSpinner } from '../shared/loading-spinner';
import { DeviceT } from '../../types/device';

function SetupDevice() {
  const [loading, devices, reload] = usePendingDevices();

  const [selectedDevice, selectDevice] = useState('');
  const translate = useTranslations();
  const [css] = useStyletron();
  const { theme } = useTheme();

  const devicesArr = useMemo(
    () => Object.values(devices || {}).map(({ name }) => name),
    [devices],
  );

  const deviceObj = useMemo(
    () => ({
      name: selectedDevice,
      label: '',
      room: '',
      leads: [],
    }),
    [selectedDevice],
  );

  useEffect(() => {
    if (!selectedDevice) {
      return;
    }

    if (!devicesArr.includes(selectedDevice)) {
      selectDevice('');
    }
  }, [selectedDevice]);

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
    <div
      className={css({
        maxWidth: '750px',
      })}
    >
      <PageHeading>{translate('setup-device.heading')}</PageHeading>
      {devicesArr.length === 0
        ? (
            <p>
              {translate('setup-device.none-pending')}
            &nbsp;
              <Link to="#" onClick={reload}>
                {translate('setup-device.check-again')}
              </Link>
            </p>
          )
        : (
            <>
              <InputLabel>
                <InputLabelText>
                  {translate('setup-device.select-label')}
                </InputLabelText>
                <Select
                  value={selectedDevice}
                  onChange={e => selectDevice(e.target.value)}
                >
                  <option value="" disabled hidden>
                    {translate('setup-device.select-one')}
                  </option>
                  {devicesArr.map(device => (
                    <option key={device} value={device}>
                      {device}
                    </option>
                  ))}
                </Select>
              </InputLabel>
              {selectedDevice && (
                <div
                  className={css({
                    padding: '0.5rem 1rem',
                    marginBottom: '1.5rem',
                    border: `1px solid ${theme.border}`,
                  })}
                >
                  <ManageDeviceInput
                    device={deviceObj as unknown as DeviceT} // populate deviceObj with default values
                    isNew={true}
                    onSave={reload}
                  />
                </div>
              )}
            </>
          )}
      <OTP />
    </div>
  );
}

export default SetupDevice;
