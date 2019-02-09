'use strict';

export const UNAUTHORIZED = new Error('unauthorized');

export const logout = () => {
  return fetch('/logout')
    .then(resp => {
      if(!resp.ok) {
        throw new Error('logout failed!');
      }
    });
};

export const login = (username, password) => {
  return fetch('/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      username,
      password
    })
  })
  .then(resp => {
    if(resp.ok) {
      return resp.json();
    }
    throw UNAUTHORIZED;
  });
};

export const getCurrentUserDetails = () => {
  return fetch('/user/@me')
    .then(resp => {
      if(resp.ok) {
        return resp.json();
      }
      throw UNAUTHORIZED;
    })
};

export const getKnownDeviceList = () => {
  return fetch('/devices/available')
    .then(resp => {
      if(resp.ok) {
        return resp.json();
      }
      throw UNAUTHORIZED;
    });
};
