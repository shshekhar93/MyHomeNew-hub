import React, {
  useState,
  useEffect,
  useCallback
} from 'react';
import { Modal, Spinner, Alert, Row, Col } from 'react-bootstrap';
import { getAllAppConnections, deleteAppConnection } from '../common/api';

function ExistingClientsModal(props) {
  const [state, setState] = useState({ loading: true });

  useEffect(() => {
    getAllAppConnections()
      .then(connections => {
        setState(old => ({ ...old, loading: false, connections }));
      })
      .catch(() => {
        setState(old=> ({
          ...old,
          loading: false,
          error: 'Failed to load existing connections.'
        }));
      });
  }, []);

  const deleteConnection = useCallback((e) => {
    const clientId = e.target.getAttribute('data-clientid');

    deleteAppConnection(clientId)
      .then(() => {
        setState(oldState => ({
          ...oldState,
          connections: oldState.connections.filter(({id}) => id !== clientId)
        }));
      })
      .catch(() => {
        setState(oldState => ({
          ...oldState,
          error: 'Failed to delete connection.'
        }));
      });
  }, [props.id]);

  return (
    <Modal show={true} onHide={props.onClose}>
      <Modal.Header>
        <Modal.Title>Existing connections to app</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ minHeight: '200px' }}>
        {state.error && <Alert variant="danger">{state.error}</Alert>}
        {state.loading && <Spinner variant="primary" animation="grow" /> }
        {!state.loading && (
          (state.connections || []).length > 0 ? 
            state.connections.map(conn => 
              <ExistingConnection key={conn.id} {...conn} deleteRow={deleteConnection} />) : 
            'You haven\'t connected any apps yet.'
        )}
      </Modal.Body>
    </Modal>
  );
}

function ExistingConnection(props) {
  return (
    <Row>
      <Col>{props.id}</Col>
      <Col xs={1}>
        <a href="#" data-clientid={props.id} onClick={props.deleteRow}>&times;</a>
      </Col>
    </Row>
  );
}

export default ExistingClientsModal;
