import React, {
  useState,
  useCallback
} from 'react';
import PropTypes from 'prop-types';

import { Modal, Form, Button, Alert } from 'react-bootstrap';
import { registerUser } from '../common/api';
import _get from 'lodash/get';
import { serializeForm } from '../common/helper';

export default function RegistrationModal (props) {
  const [state, setState] = useState({});
  const register = useCallback(e => {
    e.preventDefault();

    if(state.usernameErr) {
      return;
    }

    registerUser(serializeForm(e.target))
      .then(obj => {
        if(obj.hubClientId && obj.hubClientSecret) {
          return setState({
            ...state,
            error: false,
            clientId: obj.hubClientId,
            clientSecret: obj.hubClientSecret
          });
        }
        throw new Error('Registration failed!');
      })
      .catch((e) => {
        console.log(e.stack);
        setState({ ...state, error: true })
      });
  }, [state]);

  const checkUserName = useCallback(e => {
    fetch(`/user/check-user-name?username=${e.target.value}`)
      .then(resp => resp.json())
      .catch(() => {})
      .then(obj => {
        setState({
          ...state,
          usernameErr: _get(obj, 'exists', false)
        });
      });
  }, [state]);

  return (
    <Modal show={true} onHide={props.onClose}>
      <Modal.Header closeButton>
        <Modal.Title>Create a new account</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {state.error && <Alert variant="danger">Registration failed!</Alert>}
        {state.clientId ? (
            <Alert variant="success">
              <Alert.Heading>Hub credentials</Alert.Heading>
              <p>Client id: {state.clientId}</p>
              <p>Secret: {state.clientSecret}</p>
            </Alert>
          ) : (
            <Form action="#" method="POST" onSubmit={register}>
              <Form.Group>
                <Form.Control placeholder="Full name" name="name" type="text" />
              </Form.Group>
              <Form.Group>
                <Form.Control placeholder="Email address" name="email" type="email" />
              </Form.Group>
              <Form.Group>
                <Form.Control 
                  placeholder="Username"
                  name="username"
                  type="text"
                  isInvalid={state.usernameErr}
                  onBlur={checkUserName} />
                {state.usernameErr && <p style={{color: 'red'}}>This username is already taken</p> }
              </Form.Group>
              <Form.Group>
                <Form.Control placeholder="Password" name="password" type="password" />
              </Form.Group>
              <Form.Group className="text-center">
                <Button type="submit">Register</Button>
              </Form.Group>
            </Form>
          )
        }
      </Modal.Body>
    </Modal>
  );
}

RegistrationModal.propTypes = {
  onClose: PropTypes.func.isRequired
};
