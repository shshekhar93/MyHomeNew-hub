import { useStyletron } from 'styletron-react';
import { useConnectApp } from '../common/hooks.js';
import { useTranslations } from '../common/i18n.js';
import { useTheme } from '../common/theme.js';
import { PageHeading } from '../shared/base-components.js';
import { LoadingSpinner } from '../shared/loading-spinner.js';

function ConnectAppPage() {
  const { theme } = useTheme();
  const translate = useTranslations();
  const [css] = useStyletron();
  const [loading, clientId, clientSecret, QRCode] = useConnectApp();

  if (loading) {
    return (
      <div
        className={css({
          display: 'flex',
          justifyContent: 'center',
        })}
      >
        <LoadingSpinner size="5em" border="0.6em" />
      </div>
    );
  }

  return (
    <div
      className={css({
        maxWidth: '750px',
      })}
    >
      <PageHeading>{translate('connect-app.heading')}</PageHeading>
      <p>{translate('connect-app.instructions')}</p>
      <div
        className={css({
          border: `1px solid ${theme.border}`,
          padding: '1rem',
        })}
      >
        <p className={css({ marginTop: 0 })}>
          <b>{translate('connect-app.clientid')}</b>&nbsp;{clientId}
        </p>
        <p className={css({ marginBottom: 0 })}>
          <b>{translate('connect-app.secret')}</b>&nbsp;{clientSecret}
        </p>
      </div>
      <div
        className={css({
          display: 'flex',
          justifyContent: 'center',
        })}
      >
        <img src={QRCode} className={css({ marginTop: '1.5rem' })} />
      </div>
    </div>
  );
}

export default ConnectAppPage;
