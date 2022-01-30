import { useMemo } from "react";
import { Accordion } from "react-accessible-accordion";
import { useStyletron } from "styletron-react";
import _take from 'lodash/take.js';
import { useUserDevices } from "../common/hooks.js";
import { ManageDeviceListItem } from "../components/manage-devices/list-item.js";
import { PageHeading } from "../shared/base-components.js";
import { LoadingSpinner } from "../shared/loading-spinner.js";

function ManageDevicesPage() {
  const {
    loading,
    origDevices,
  } = useUserDevices();
  const [css] = useStyletron();

  const firstDevice = useMemo(() => 
    _take(origDevices).map(({name}) => name),
    [origDevices]
  );

  if(loading) {
    return (
      <div className={css({
        display: 'flex',
        justifyContent: 'center',
      })}>
        <LoadingSpinner size="5em" border="0.6em" />
      </div>
    );
  }
  
  return (
    <>
      <PageHeading>Manage devices</PageHeading>
      <Accordion
        allowMultipleExpanded={false}
        allowZeroExpanded={true}
        preExpanded={firstDevice}
        className={css({
          maxWidth: '750px'
        })}
      >
        {(origDevices || []).map(device => 
          <ManageDeviceListItem key={device.name} device={device} />)
        }
      </Accordion>
    </>
  );
}

export default ManageDevicesPage;
