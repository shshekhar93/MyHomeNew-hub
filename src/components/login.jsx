'use strict';
import React from 'react';
import { Container, Row, Col, Button, Form } from 'react-bootstrap';
import '../css/login.less';

const userNameRef = React.createRef();
const passwordRef = React.createRef();

const onLogin = (parentOnLogin, e) => {
  e.preventDefault();
  e.stopPropagation();
  parentOnLogin(userNameRef.current.value, passwordRef.current.value);
};

export default (props) => {
  return (
    <Container className="login-component">
      <Form action="#" className="col p-0" onSubmit={ onLogin.bind(null, props.onLogin) }>
        <Row>
          <Col xs={12} className="login-field">
            <input type="text" className="form-control" ref={userNameRef} placeholder="username" />
          </Col>
          <Col xs={12}  className="login-field">
            <input type="password" className="form-control" ref={passwordRef} placeholder="password" />
          </Col>
          <Col xs={12} className="login-field">
            <Button type="submit" variant="primary" block>Login</Button>
          </Col>
        </Row>
      </Form>
      <p className="text-center">
        <a href="#" onClick={props.openRegistrationModal}>Create an account</a>
      </p>
    </Container>
  );
};