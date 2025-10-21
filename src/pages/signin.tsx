import { ChangeEvent, FormEvent, useCallback, useState } from 'react';
import { useStyletron } from 'styletron-react';
import { Link } from 'react-router-dom';

import { useStore } from '../common/store';
import { useTheme } from '../common/theme';
import { Button, Input } from '../shared/base-components';
import { getCurrentUserDetails, login } from '../common/api';
import { useTranslations } from '../common/i18n';

function SigninPage() {
  const translate = useTranslations();
  const [error, setError] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [css] = useStyletron();
  const { theme } = useTheme();
  const store = useStore();

  const onUsernameChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
  }, []);

  const onPasswordChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  }, []);

  const onSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError(false);

      try {
        await login(username, password);
        store.set('user', await getCurrentUserDetails());
      }
      catch (_) {
        setError(true);
      }
    },
    [store, username, password],
  );

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
          {error && (
            <p
              className={css({
                width: '100%',
                background: theme.errorBackground,
                color: theme.error,
                padding: '0.5rem 0.75rem',
                borderRadius: '5px',
              })}
            >
              {translate('login-error')}
            </p>
          )}
          <Input
            type="text"
            name="username"
            placeholder={translate('username-placeholder')}
            required
            value={username}
            onChange={onUsernameChange}
            $style={{
              marginBottom: '1rem',
            }}
          />
          <Input
            type="password"
            name="password"
            placeholder={translate('password-placeholder')}
            required
            value={password}
            onChange={onPasswordChange}
            $style={{
              marginBottom: '1rem',
            }}
          />
          <Button $size="expand">{translate('login-cta')}</Button>
          <Link
            to="/signup"
            className={css({
              color: theme.link,
              marginTop: '1rem',
            })}
          >
            {translate('loginpage-signup-cta')}
          </Link>
        </div>
      </form>
    </div>
  );
}

export default SigninPage;
