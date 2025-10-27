import { useState } from 'react';
import { useTranslations } from '../common/i18n';
import { Button, PageHeading, Select, Textarea } from '../shared/base-components';
import { useStyletron } from 'styletron-react';
import { useTheme } from '../common/theme';
import { useUserDevices } from '../common/hooks';
import { directDeviceCommunication } from '../common/api';

export function DeviceConsole() {
  const { origDevices } = useUserDevices();
  const { theme } = useTheme();
  const [css] = useStyletron();
  const translate = useTranslations();
  const [selectedDevice, setSelectedDevice] = useState('');
  const [request, setRequest] = useState('');
  const [error, setError] = useState('');

  const format = (e: React.FocusEvent) => {
    e.preventDefault();

    setRequest((req) => {
      try {
        const formatted = JSON.stringify(JSON.parse(req), null, 2);
        setError('');
        return formatted;
      }
      catch (e) {
        console.error('Unable to parse', e);
        setError('Invalid JSON');
      }
      return req;
    });
  };

  const sendRequest = async () => {
    if (error) {
      return;
    }
    if (!selectedDevice || !request) {
      return setError('Please select a device and enter valid request.');
    }
    try {
      const response = await directDeviceCommunication(selectedDevice, JSON.parse(request));
      console.log('got response', response);
    }
    catch (e) {
      console.log(e);
      setError((e as Error).message);
    }
  };

  return (
    <>
      <PageHeading>{translate('device-console.heading')}</PageHeading>
      <p>{translate('device-console.description')}</p>
      <p><b>{translate('device-console.warning')}</b></p>
      <div className={css({
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      })}
      >
        <Select value={selectedDevice} onChange={e => setSelectedDevice(e.target.value)}>
          <option value="">Select device</option>
          {!origDevices && <option disabled>Loading...</option>}
          {origDevices?.map(({ label, name }) => (
            <option value={name}>
              {label}
              {' '}
              (
              {name}
              )
            </option>
          ))}
        </Select>
        <div>
          <Textarea
            className={css({
              minHeight: '10rem',
            })}
            name="request"
            placeholder="Enter request payload here.."
            value={request}
            onChange={e => setRequest(e.target.value)}
            onBlur={format}
          />
          {error && (
            <p className={css({
              background: theme.errorBackground,
              color: theme.error,
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
            })}
            >
              {error}
            </p>
          )}
        </div>
        <Button onClick={sendRequest}> Send</Button>
      </div>
    </>
  );
}
