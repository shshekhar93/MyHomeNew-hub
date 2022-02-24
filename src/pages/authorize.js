import { useStyletron } from 'styletron-react';
import { useClientDetails } from '../common/hooks.js';
import { ErrorPage } from '../components/common/error.jsx';
import { Button, PageHeading } from '../shared/base-components.js';
import { LoadingSpinner } from '../shared/loading-spinner.js';

function AuthorizePage() {
  const [css] = useStyletron();
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
    console.log('error', error);
    return <ErrorPage message="We received an invalid request." />;
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
      <PageHeading>Authorize {client.name} to access your account</PageHeading>
      <p>
        Once authorized, {client.name} will be able to discover and control the
        devices that you add to your Home Applyed account.
      </p>
      <form action="/authorize" method="POST">
        <input type="hidden" name="grant_type" value="code" />
        {Object.entries(params).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
        <Button type="submit" $size="expand">
          Authorize
        </Button>
      </form>
    </div>
  );
}

export default AuthorizePage;
