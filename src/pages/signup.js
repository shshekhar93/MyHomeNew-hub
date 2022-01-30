import { useCallback, useState } from 'react';
import {useStyletron} from 'styletron-react';
import { useNavigate, Link } from "react-router-dom";
import _get from 'lodash/get.js'
import { useTheme } from "../common/theme.js";
import { Button, Input } from "../shared/base-components.js";
import { registerUser } from '../common/api.js';
import { serializeForm } from '../common/helper.js';

function SignupPage() {
  const [css] = useStyletron();
  const { theme } = useTheme();
  const [state, setState] = useState({});
  const navigate = useNavigate();

  const onChange = useCallback((e) => {
    const { name, value } = e.target;
    setState(old => ({
      ...old,
      [name]: value
    }));
  }, []);

  const checkUserName = useCallback(async (e) => {
    const username = e.target.value;

    const resp = await fetch(`/user/check-user-name?username=${username}`)
    const result = await resp.json();
    setState(old => ({
      ...old,
      usernameError: _get(result, 'exists', false),
    }));
  }, []);

  const onSubmit = useCallback(async (e) => {
    e.preventDefault();
    if(state.usernameError) {
      return;
    }

    try {
      const result = registerUser(serializeForm(e.target));
      if(result.hubClientId && result.hubClientSecret) {
        return setState({
          ...state,
          error: false,
          clientId: result.hubClientId,
          clientSecret: result.hubClientSecret
        });
      }
    } catch(e) {
      setState({...state, error: true });
    }
    
  }, [state]);

  const goToSignin = useCallback(() => {
    navigate('/signin')
  }, [navigate]);

  const rowClassname = css({
    marginBottom: '1rem',
  });

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
          {state.clientId? 
            <div className={css({ width: '100%' })}>
              <p className={css({
                textAlign: 'center',
                padding: '0.5rem 0.75rem',
                color: 'green',
                background: 'lightgreen',
                borderRadius: '5px'
              })}>Registration complete.</p>
              <p>Take a note of your Hub credentials mentioned here.
              <br />You'd need these to connect your local hub to this account.</p>
              <p className={css({ fontSize: '1rem', fontFamily: 'monospace' })}>
                Client id: {state.clientId}
              </p>
              <p className={css({ fontSize: '1rem', fontFamily: 'monospace' })}>
                Client secret: {state.clientSecret}
              </p>
              <div className={css({textAlign: 'center'})}>
                <Button onClick={goToSignin}>Done</Button>
              </div>
            </div> :
            <>
              {state.error && 
                <p className={css({
                  width: '100%',
                  background: theme.errorBackground,
                  color: theme.error,
                  padding: '0.5rem 0.75rem',
                })}>Registration failed! Please try again.</p>
              }
              <Input
                className={rowClassname}
                name="name"
                type="text"
                placeholder="Full name"
                required
                value={state.name}
                onChange={onChange} />
              <Input
                className={rowClassname}
                name="email"
                type="email"
                placeholder="Email address"
                required
                value={state.email}
                onChange={onChange} />
              <div className={rowClassname} style={{ width: '100%' }}>
                <Input
                  name="username"
                  type="text"
                  placeholder="Username"
                  autoComplete='off'
                  required
                  value={state.username}
                  hasError={!!state.usernameError}
                  onChange={onChange}
                  onBlur={checkUserName} />
                {state.usernameError &&
                  <p className={css({
                    color: theme.error,
                    margin: '0.5rem 0 0',
                  })}>This username is already taken.</p>}
              </div>
              <Input
                className={rowClassname}
                name="password"
                type="password"
                placeholder="Password"
                required
                value={state.password}
                onChange={onChange} />
              <Button
                type="submit"
                className={rowClassname}>Register</Button>
              <Link
                to="/signin"
                className={css({
                  color: theme.link
                })}
              >Already have an account? Signin</Link>
            </>
          }
        </div>
      </form>
    </div>
  );
}

export default SignupPage;
