import React, {
  useState,
  useEffect
} from 'react';
import PropTypes from 'prop-types';
import { Modal, Spinner, Alert } from 'react-bootstrap';
import QRCode from 'qrcode';

import * as API from '../common/api';

function CreateClientModal(props) {
  const [state, setState] = useState({ loading: true });
  useEffect(() => {
    API.createClientCreds({
      name: 'MyHome App',
      redirectUri: 'myhomenew://oauthreturn/'
    })
      .then(resp => {
        return QRCode.toDataURL(
          `${resp.id}:${resp.secret}:${window.location.protocol}//${window.location.host}`,
          { errorCorrectionLevel: 'H' }
        )
          .then(qrCode => ({...resp, qrCode}));
      })
      .then(resp => {
        setState(state => ({...state, clientCreds: resp}));
      })
      .catch(() => {
        setState(state => ({...state, error: true}))
      });
  }, []);

  return (
    <Modal show={true} onHide={props.onClose}>
      <Modal.Header>
        <Modal.Title>Connect to App</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {state.error && <Alert variant="danger">Failed to create app credentials.</Alert>}
        {state.loading && <Spinner variant="primary" animation="grow" /> }
        {state.clientCreds && (
          <div>
            <div>
              <span className="font-weight-bold">App client id:&nbsp;</span>
              <span>{state.clientCreds.id}</span>
            </div>
            <div>
              <span className="font-weight-bold">App client secret:&nbsp;</span>
              <span>{state.clientCreds.secret}</span>
            </div>
            <p>Enter the above credentials manually in the app, or scan the below QR code to connect the app.</p>
            <p>You'll be asked to login to your account on app.</p>
            <p>Remember to save the credentials and the QR code incase you need to setup the app on a different phone.</p>
            <div className="qr-code-container" style={{
              margin: '0 auto',
              'max-width': '250px'
            }}>
              <a className="btn btn-secondary" href={state.clientCreds.qrCode} download="myhomenew-app-qr-code.png">Download QR Code image</a>
              <img src={state.clientCreds.qrCode} style={{ 'margin-top': '25px' }} />
            </div>
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
}

CreateClientModal.propTypes = {
  onClose: PropTypes.func.isRequired
};

export default CreateClientModal;
