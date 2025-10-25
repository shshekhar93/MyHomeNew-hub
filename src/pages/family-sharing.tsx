import { FormEvent, useEffect, useMemo, useState } from "react";
import { useTranslations } from "../common/i18n";
import { Button, Input, PageHeading, Select } from "../shared/base-components";
import { authorizeUserForDevice, getDeviceAuthorizations, getExistingDevices, revokeUserAuthorizationForDevice } from "../common/api";
import { DeviceAuthorizationT, DeviceT } from "../../types/device";
import { Card } from "../components/common/card";
import { useStyletron } from "styletron-react";
import { Badge } from "../components/common/badge";
import { useTheme } from "../common/theme";

export function FamilySharingPage() {
  const translate = useTranslations();
  const [css] = useStyletron();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [devices, setDevices] = useState<DeviceT[]>([]);
  const [authorizations, setAuthorizations] = useState<DeviceAuthorizationT[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (submitting) {
      return; // will execute after submition completes.
    }
    (async () => {
      setLoading(true);
      try {
        const [data, devices] = await Promise.all([
          getDeviceAuthorizations(),
          getExistingDevices(),
        ])
        setAuthorizations(data)
        setDevices(devices);
      } catch (e) { }
      console.log('clearing')
      setLoading(false);
    })();
  }, [submitting]);

  const [sharedDevices, privateDevices] = useMemo(() => {
    const shared: DeviceT[] = [];
    const priv: DeviceT[] = [];
    devices.forEach((device) => {
      const isShared = authorizations.some(auth => auth.deviceId === device._id);
      if (isShared) {
        shared.push(device);
      } else {
        priv.push(device);
      }
    });
    return [shared, priv];
  }, [devices, authorizations])

  const onShare = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement
    const deviceId = (form.elements.namedItem('deviceId') as HTMLSelectElement).value;
    const userEmail = (form.elements.namedItem('userEmail') as HTMLInputElement).value;
    const role = (form.elements.namedItem('role') as HTMLSelectElement).value;

    setSubmitting(true);
    try {
      await authorizeUserForDevice(deviceId, userEmail, role)
    } catch (e) { }
    setSubmitting(false);
  }

  const revokeAuthorization = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const elem = e.target as HTMLAnchorElement;
    const deviceId = elem.getAttribute('data-deviceid') ?? '';
    const userEmail = elem.getAttribute('data-useremail') ?? '';

    try {
      setSubmitting(true);
      await revokeUserAuthorizationForDevice(deviceId, userEmail);
    } catch (e) { }
    setSubmitting(false)
  }

  if (loading || submitting) {
    return (
      <>
        <PageHeading>{translate('family-sharing.heading')}</PageHeading>
        <p>{translate('loading')}</p>
      </>
    );
  }

  return (
    <>
      <PageHeading>{translate('family-sharing.heading')}</PageHeading>
      {devices.length === 0 && <p>{translate('family-sharing.no-devices')}</p>}
      {sharedDevices.length === 0 && (<p>{translate('family-sharing.no-authorizations')}</p>)}
      {sharedDevices.map((device) => (
        <Card key={device._id} title={`${device.label} (${device.name})`}>
          <ul className={css({
            listStyle: 'none',
          })}>
            {authorizations
              .filter(auth => auth.deviceId === device._id)
              .map((auth, idx) => (
                <li key={idx} className={css({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                })}>
                  {auth.user.email}
                  <Badge type="information">{auth.role}</Badge>
                  <a
                    href="#"
                    onClick={revokeAuthorization}
                    data-deviceid={auth.deviceId}
                    data-useremail={auth.user.email}
                    className={css({
                      color: theme.link,
                      textDecoration: 'none'
                    })}
                  >
                    &times;
                  </a>
                </li>
              ))}
          </ul>
        </Card>
      ))}
      <Card title={translate('family-sharing.share-new-device')}>
        <form onSubmit={onShare} className={css({
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',

          '@media only screen and (min-width: 980px)': {
            flexDirection: 'row',
            alignItems: 'center',
          },
        })}>
          <Select
            name="deviceId"
            required
            $style={{
              flex: 1,
              ':invalid': {
                color: 'gray',
              },
            }}>
            <option value="">{translate('family-sharing.select-device')}</option>
            {privateDevices.map((device) => (
              <option key={device._id} value={device._id}>{device.label} ({device.name})</option>
            ))}
          </Select>
          <Input
            type="email"
            name="userEmail"
            required
            placeholder={translate('family-sharing.user-email')}
            $style={{ flex: 1 }} />
          <Select
            name="role"
            required
            $style={{
              flex: 1,
              ':invalid': {
                color: 'gray',
              },
            }}
          >
            <option value="">{translate('family-sharing.select-role')}</option>
            <option value="operator">{translate('family-sharing.role-operator')}</option>
            <option value="administrator">{translate('family-sharing.role-administrator')}</option>
          </Select>
          <Button>{translate('family-sharing.share-device')}</Button>
        </form>
      </Card>
    </>
  );
}
