import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStyletron } from 'styletron-react';
import { usePendingDevices } from '../common/hooks.js';
import { useTranslations } from '../common/i18n.js';
import { useTheme } from '../common/theme.js';
import { ManageDeviceInput } from '../components/manage-devices/input.js';
import { OTP } from '../components/manage-devices/otp.js';
import {
  InputLabel,
  InputLabelText,
  PageHeading,
  Select,
} from '../shared/base-components.js';
import { LoadingSpinner } from '../shared/loading-spinner.js';

function SetupDevice() {
  const [loading, devices, reload] = usePendingDevices();

  const [selectedDevice, selectDevice] = useState('');
  const translate = useTranslations();
  const [css] = useStyletron();
  const { theme } = useTheme();

  const devicesArr = useMemo(
    () => Object.values(devices || {}).map(({ name }) => name),
    [devices]
  );

  const deviceObj = useMemo(
    () => ({
      name: selectedDevice,
      label: '',
      room: '',
      leads: [],
    }),
    [selectedDevice]
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
      {devicesArr.length === 0 ? (
        <p>
          {translate('setup-device.none-pending')}&nbsp;
          <Link to="#" onClick={reload}>
            {translate('setup-device.check-again')}
          </Link>
        </p>
      ) : (
        <>
          <InputLabel>
            <InputLabelText>
              {translate('setup-device.select-label')}
            </InputLabelText>
            <Select
              value={selectedDevice}
              onChange={(e) => selectDevice(e.target.value)}
            >
              <option value="" disabled hidden>
                {translate('setup-device.select-one')}
              </option>
              {devicesArr.map((device) => (
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
                device={deviceObj}
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
