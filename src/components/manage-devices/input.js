import { useCallback, useEffect, useState } from 'react';
import { useStyletron } from 'styletron-react';
import _cloneDeep from 'lodash/cloneDeep.js';
import _set from 'lodash/set.js';
import { Button, Input, InputLabel, InputLabelText, Select } from '../../shared/base-components.js';
import { Link } from 'react-router-dom';

function ManageDeviceInput({ device }) {
  const [localDevice, setLocalDevice] = useState(() => _cloneDeep(device));
  const [remainingLeads, setRemaininLeads] = useState([]);
  const [isDirty, setDirty] = useState(false);
  const [css] = useStyletron();

  useEffect(() => {
    const { leads } = localDevice;

    const alreadyConfigured = leads.map(lead => lead.devId);
    const remainingLeads = Array(4).fill()
      .map((_, id) => id)
      .filter(id => !alreadyConfigured.includes(id));

    if(alreadyConfigured.length === 0) {
      addAnotherLead();
    }
    setRemaininLeads(remainingLeads);
  }, []);

  const addAnotherLead = useCallback(() => {
    if(!remainingLeads.length) {
      return;
    }

    const devId = remainingLeads.shift();
    setLocalDevice(device => ({
      ...device,
      leads: device.leads.concat({
        devId,
        label: '',
        type: '',
        state: '0',
        brightness: '0'
      })
    }));
    setRemaininLeads([...remainingLeads]);
  }, [remainingLeads]);

  const removeLead = useCallback((e) => {
    const devId = +e.target.getAttribute('data-devid');
    setLocalDevice(localDevice => ({
      ...localDevice,
      leads: localDevice.leads.filter((lead) => lead.devId !== devId),
    }));
    setRemaininLeads(remainingLeads => 
      remainingLeads.concat(devId).sort((a, b )=> a - b)
    );
  }, [])

  const onChange = useCallback((e) => {
    const { name, value, type } = e.target;
    setDirty(true);
    setLocalDevice(device => Object.assign(
      {},
      _set(device, name, type === 'checkbox'? checked : value)
    ));
  }, []);

  const onSubmit = useCallback((e) => {
    e.preventDefault();
    console.log('trying to save', localDevice);
  }, [localDevice]);

  const optClass = css({ color: 'initial' });

  return (
    <div className={css({
      padding: '0.75rem 0'
    })}>
      <form onSubmit={onSubmit}>
        <InputLabel>
          <InputLabelText>Device name</InputLabelText>
          <Input
            name="label"
            required
            value={localDevice.label}
            onChange = {onChange}
            $style={SizeLimitStyle} />
        </InputLabel>
        <InputLabel>
          <InputLabelText>Room</InputLabelText>
          <Input
            name="room"
            required
            value={localDevice.room}
            onChange = {onChange}
            $style={SizeLimitStyle} />
        </InputLabel>
        {(localDevice.leads || []).map((lead, idx) => (
          <div key={lead.devId} className={css({
            display: 'flex',
            alignItems: 'center',
          })}>
            <div
              className={css({
                display: 'flex',
                padding: '0.5rem',
                flexDirection: 'column',
                flex: 1,

                '@media only screen and (min-width: 750px)': {
                  flexDirection: 'row',
                },
              })}
            >
              <div className={css({
                margin: '0.5rem',
                flex: 1,
              })}>
                <Select 
                  name={`leads[${idx}].type`} 
                  required
                  value={lead.type} 
                  onChange={onChange}
                  $style={{
                    ':invalid': {
                      color: 'gray'
                    }
                  }}
                >
                  <option value=""  style={{color: 'gray'}} disabled hidden>Device type</option>
                  <option className={optClass} value="switch">Generic switch</option>
                  <option className={optClass} value="tv">Television</option>
                  <option className={optClass} value="light">Light</option>
                  <option className={optClass} value="fan">Fan</option>
                  <option className={optClass} value="ac">AC</option>
                </Select>
              </div>
              <div className={css({
                margin: '0.5rem',
                flex: 1,
              })}>
                <Input
                  name={`leads[${idx}].label`}
                  placeholder="Switch name"
                  required
                  value={lead.label}
                  onChange={onChange} />
              </div>
            </div>
            {(localDevice.leads || []).length > 1 && 
              <span
                className={css({
                  fontSize: '2rem',
                  cursor: 'pointer',
                })}
                data-devid={lead.devId}
                onClick={removeLead}
              >&times;</span>
            }
          </div>
        ))}
        {remainingLeads.length !== 0 &&
          <div className={css({
            margin: '0 1rem 1rem',
          })}>
            <Link to="#" onClick={addAnotherLead}>+ Configure another switch</Link>
          </div>
        }
        <Button type="submit" $size="expand" disabled={!isDirty}>Save</Button>
      </form>
    </div>
  )

}

export { ManageDeviceInput };

const SizeLimitStyle = {
  '@media only screen and (min-width: 1000px)': {
    width: '50%'
  }
};
