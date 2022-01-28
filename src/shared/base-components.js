import { styled } from 'styletron-react';

const Input = styled('input', ({ theme, hasError }) => ({
  width: '100%',
  padding: '0.5rem 0.75rem',
  fontSize: '1rem',
  outline: 0,
  border: `1px solid ${hasError? theme.error : theme.border}`,
  borderRadius: '5px',

  ':focus': {
    borderColor: theme.borderFocus,
    boxShadow: '0 0 0 0.2rem rgb(0 50 50 / 25%)',
  }
}));

const Button = styled('button', ({size, theme}) => ({
  width: size === 'expand' ? '100%' : undefined,
  padding: '0.75rem',
  fontSize: '1rem',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
  color: '#fff',
  background: theme.accent,

  ':hover': {
    background: theme.accentDark
  }
}));

export {
  Input,
  Button
};
