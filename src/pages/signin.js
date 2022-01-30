import { useCallback, useState } from "react";
import { useStyletron } from 'styletron-react';
import { Link } from 'react-router-dom';

import Store, { useStore } from "../common/store.js";
import { useTheme } from "../common/theme.js";
import { Button, Input } from "../shared/base-components.js";
import { getCurrentUserDetails, login } from "../common/api.js";

/**
 * 
 * @param {{store: Store}} props 
 */
function SigninPage() {
  const [error, setError] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [css] = useStyletron();
  const {theme} = useTheme();
  const store = useStore();

  const onUsernameChange = useCallback((e) => {
    setUsername(e.target.value);
  }, []);

  const onPasswordChange = useCallback((e) => {
    setPassword(e.target.value);
  }, []);

  const onSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError(false);

    try {
      await login(username, password);
      store.set('user', await getCurrentUserDetails());
    } catch(e) {
      setError(true);
    }
  }, [
    store,
    username,
    password,
  ]);

  return (
    <div className={css({
      display: 'flex',
      justifyContent: 'center',
      minHeight: 'calc(100vh - 56px)',
    })}>
      <form onSubmit={onSubmit}>
        <div className={css({
          display: 'flex',
          flexDirection: 'column',
          width: '400px',
          marginTop: '15vh',
          alignItems: 'center'
        })}>
          {error &&
            <p className={css({
              width: '100%',
              background: theme.errorBackground,
              color: theme.error,
              padding: '0.5rem 0.75rem',
              borderRadius: '5px',
            })}>Invalid username or password.</p>}
          <Input
            type="text"
            name="username"
            placeholder="Email or username"
            required
            value={username}
            onChange={onUsernameChange}
            $style={{
              marginBottom: '1rem'
            }} />
          <Input
            type="password"
            name="password"
            placeholder="Password"
            required
            value={password}
            onChange={onPasswordChange}
            $style={{
              marginBottom: '1rem'
            }} />
          <Button $size="expand">Login</Button>
          <Link to="/signup" className={css({
            color: theme.link,
            marginTop: '1rem',
          })}>Create an account</Link>
        </div>
      </form>
    </div>
  )
}

export default SigninPage;
