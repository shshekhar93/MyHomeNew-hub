import { useCallback } from 'react';
import { useStyletron } from 'styletron-react';
import { deleteAppConnection } from '../common/api.js';
import { useClientConnections } from '../common/hooks.js';
import { useTheme } from '../common/theme.js';
import { PageHeading } from '../shared/base-components.js';
import { LoadingSpinner } from '../shared/loading-spinner.js';

function ManageConnectionsPage() {
  const { theme } = useTheme();
  const [css] = useStyletron();
  const [loading, connections = [], reloadConnections] = useClientConnections();

  const deleteClient = useCallback(async (e) => {
    const clientID = e.target.getAttribute('data-clientid');
    await deleteAppConnection(clientID);
    await reloadConnections();
  }, []);

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
      <PageHeading>Manage connections</PageHeading>
      {connections.length > 0 ? (
        <p>You have the following clients connected to your account.</p>
      ) : (
        <p>You don&apos;t have any clients connected to your account yet.</p>
      )}
      <div
        className={css({
          padding: '1rem',
          border: `1px solid ${theme.border}`,
        })}
      >
        {connections.map((connection) => (
          <div
            key={connection.id}
            className={css({
              display: 'flex',
              borderBottom: `1px solid ${theme.border}`,
              padding: '0 0 1rem',
              marginBottom: '1rem',

              ':last-child': {
                marginBottom: 0,
                borderBottom: 'none',
              },
            })}
          >
            <div
              className={css({
                paddingRight: '1rem',
                display: 'none',

                '@media only screen and (min-width: 600px)': {
                  display: 'block',
                },
              })}
            >
              {connection.createdDate}
            </div>
            <div className={css({ flex: 1 })}>{connection.id}</div>
            <div
              data-clientid={connection.id}
              onClick={deleteClient}
              className={css({
                fontSize: '1.5rem',
                lineHeight: 1,
                cursor: 'pointer',
              })}
            >
              &times;
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
export default ManageConnectionsPage;
