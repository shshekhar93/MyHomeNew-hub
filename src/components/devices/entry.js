import { useCallback, useState } from "react";
import { useStyletron } from "styletron-react";
import { updateDeviceState } from "../../common/api.js";
import { useStore } from "../../common/store.js";
import { useTheme } from "../../common/theme.js";
import { LoadingSpinner } from "../../shared/loading-spinner.js";
import Switch from "../common/switch.jsx";

function DeviceEntry({ device }) {
  const { name, label, devId, isActive, state } = device;
  const [css] = useStyletron();
  const {theme} = useTheme();
  const store = useStore();

  const [updating, setUpdating] = useState(false);

  const onChange = useCallback(async (e) => {
    const newState = e.target.checked? 100 : 0;

    setUpdating(true);
    await updateDeviceState(name, devId, newState);

    // Updating object on store directly! Not cool.
    device.state = newState;
    const groupedDevices = store.get('devices');
    store.set('devices', groupedDevices);
    
    setUpdating(false);
  }, [name, devId, device, store]);

  return (
    <div className={css({
      padding: '1rem 0',
      margin: '0 1rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottom: `1px solid ${theme.border}`,

      ':last-child': {
        borderBottom: 'none',
      },
    })}>
      <div>
        {label}
        <span className={css({
          display: 'inline-block',
          height: '15px',
          width: '15px',
          borderRadius: '50%',
          marginLeft: '15px',
          marginTop: '-2px',
          verticalAlign: 'middle',
          backgroundColor: isActive ? 'darkgreen' : 'darkgray',
        })} />
      </div>
      {updating?
        <LoadingSpinner size="24px" border="4px" /> :
        <Switch
          checked={state > 0}
          onChange={onChange} />
      }
    </div>
  );
}

export { DeviceEntry };
