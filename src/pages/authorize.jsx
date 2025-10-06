import { useStyletron } from 'styletron-react';
import { useClientDetails } from '../common/hooks';
import { useTranslations } from '../common/i18n';
import { ErrorPage } from '../components/common/error';
import { Button, PageHeading } from '../shared/base-components';
import { LoadingSpinner } from '../shared/loading-spinner';

function AuthorizePage() {
  const [css] = useStyletron();
  const translate = useTranslations();
  const [loading = true, error, client, params = {}] = useClientDetails();

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

  if (error) {
    return <ErrorPage message={translate('authoize.error_invalid_request')} />;
  }

  return (
    <div
      className={css({
        display: 'flex',
        flexDirection: 'column',
        width: '100%',

        '@media only screen and (min-width: 600px)': {
          width: '400px',
          margin: '0 auto',
        },
      })}
    >
      <PageHeading>
        {translate('authorize.heading', { client: client.name })}
      </PageHeading>
      <p>{translate('authorize.instructions', { client: client.name })}</p>
      <form action="/authorize" method="POST">
        <input type="hidden" name="grant_type" value="code" />
        {Object.entries(params).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
        <Button type="submit" $size="expand">
          {translate('authorize.cta')}
        </Button>
      </form>
    </div>
  );
}

export default AuthorizePage;
