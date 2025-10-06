import { useCallback, useState } from 'react';
import { useStyletron } from 'styletron-react';
import { updateDeviceState } from '../../common/api';
import { useStore } from '../../common/store';
import { useTheme } from '../../common/theme';
import { LoadingSpinner } from '../../shared/loading-spinner';
import { StatusIndicator } from '../common/status-indicator';
import Switch from '../common/switch';

function DeviceEntry({ device }) {
  const { name, label, devId, isActive, state } = device;
  const [css] = useStyletron();
  const { theme } = useTheme();
  const store = useStore();

  const [updating, setUpdating] = useState(false);

  const onChange = useCallback(
    async (e) => {
      const newState = e.target.checked ? 100 : 0;

      setUpdating(true);
      await updateDeviceState(name, devId, newState);

      // Updating object on store directly! Not cool.
      device.state = newState;
      const groupedDevices = store.get('devices');
      store.set('devices', groupedDevices);

      setUpdating(false);
    },
    [name, devId, device, store]
  );

  return (
    <div
      className={css({
        padding: '1rem 0',
        margin: '0 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: `1px solid ${theme.border}`,

        ':last-child': {
          borderBottom: 'none',
        },
      })}
    >
      <div>
        {label}
        {!isActive && <StatusIndicator available={false} />}
      </div>
      {updating ? (
        <LoadingSpinner size="24px" border="4px" />
      ) : (
        <Switch checked={state > 0} onChange={onChange} />
      )}
    </div>
  );
}

export { DeviceEntry };
