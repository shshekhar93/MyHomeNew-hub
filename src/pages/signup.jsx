import { useCallback, useState } from 'react';
import { useStyletron } from 'styletron-react';
import { useNavigate, Link } from 'react-router-dom';
import _get from 'lodash/get';
import { useTheme } from '../common/theme';
import { Button, Input } from '../shared/base-components';
import { registerUser } from '../common/api';
import { serializeForm } from '../common/helper';
import { useTranslations } from '../common/i18n';

function SignupPage() {
  const translate = useTranslations();
  const [css] = useStyletron();
  const { theme } = useTheme();
  const [state, setState] = useState({});
  const navigate = useNavigate();

  const onChange = useCallback((e) => {
    const { name, value } = e.target;
    setState((old) => ({
      ...old,
      [name]: value,
    }));
  }, []);

  const checkUserName = useCallback(async (e) => {
    const username = e.target.value;

    const resp = await fetch(`/user/check-user-name?username=${username}`);
    const result = await resp.json();
    setState((old) => ({
      ...old,
      usernameError: _get(result, 'exists', false),
    }));
  }, []);

  const onSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (state.usernameError) {
        return;
      }

      try {
        const result = registerUser(serializeForm(e.target));
        if (result.hubClientId && result.hubClientSecret) {
          return setState({
            ...state,
            error: false,
            clientId: result.hubClientId,
            clientSecret: result.hubClientSecret,
          });
        }
      } catch (e) {
        setState({ ...state, error: true });
      }
    },
    [state]
  );

  const goToSignin = useCallback(() => {
    navigate('/signin');
  }, [navigate]);

  const rowClassname = css({
    marginBottom: '1rem',
  });

  return (
    <div
      className={css({
        display: 'flex',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 56px)',
      })}
    >
      <form onSubmit={onSubmit}>
        <div
          className={css({
            display: 'flex',
            flexDirection: 'column',
            padding: '0.5rem 1rem',
            width: '100vw',
            marginTop: '15vh',
            alignItems: 'center',

            '@media only screen and (min-width: 600px)': {
              width: '400px',
            },
          })}
        >
          {state.clientId ? (
            <div className={css({ width: '100%' })}>
              <p
                className={css({
                  textAlign: 'center',
                  padding: '0.5rem 0.75rem',
                  color: 'green',
                  background: 'lightgreen',
                  borderRadius: '5px',
                })}
              >
                {translate('signup-success-heading')}
              </p>
              <p>
                {translate('signup-hubcreds-instructions-1')}
                <br />
                {translate('signup-hubcreds-instructions-2')}
              </p>
              <p className={css({ fontSize: '1rem', fontFamily: 'monospace' })}>
                {translate('signup-hubcreds-clientid')} {state.clientId}
              </p>
              <p className={css({ fontSize: '1rem', fontFamily: 'monospace' })}>
                {translate('signup-hubcreds-secret')} {state.clientSecret}
              </p>
              <div className={css({ textAlign: 'center' })}>
                <Button onClick={goToSignin}>
                  {translate('signup=success-cta')}
                </Button>
              </div>
            </div>
          ) : (
            <>
              {state.error && (
                <p
                  className={css({
                    width: '100%',
                    background: theme.errorBackground,
                    color: theme.error,
                    padding: '0.5rem 0.75rem',
                  })}
                >
                  {translate('signup-error')}
                </p>
              )}
              <Input
                className={rowClassname}
                name="name"
                type="text"
                placeholder={translate('signup-name')}
                required
                value={state.name}
                onChange={onChange}
              />
              <Input
                className={rowClassname}
                name="email"
                type="email"
                placeholder={translate('signup-email')}
                required
                value={state.email}
                onChange={onChange}
              />
              <div className={rowClassname} style={{ width: '100%' }}>
                <Input
                  name="username"
                  type="text"
                  placeholder={translate('signup-username')}
                  autoComplete="off"
                  required
                  value={state.username}
                  hasError={!!state.usernameError}
                  onChange={onChange}
                  onBlur={checkUserName}
                />
                {state.usernameError && (
                  <p
                    className={css({
                      color: theme.error,
                      margin: '0.5rem 0 0',
                    })}
                  >
                    {translate('signup-username-error')}
                  </p>
                )}
              </div>
              <Input
                className={rowClassname}
                name="password"
                type="password"
                placeholder={translate('password-placeholder')}
                required
                value={state.password}
                onChange={onChange}
              />
              <Button $size="expand" type="submit" className={rowClassname}>
                {translate('signup-cta')}
              </Button>
              <Link
                to="/signin"
                className={css({
                  color: theme.link,
                })}
              >
                {translate('signuppage-login-cta')}
              </Link>
            </>
          )}
        </div>
      </form>
    </div>
  );
}

export default SignupPage;
