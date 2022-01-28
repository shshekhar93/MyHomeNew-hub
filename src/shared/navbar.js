import {useStyletron} from 'styletron-react';
import { Link } from 'react-router-dom';
import { useTheme } from '../common/theme.js';
import { useLogout } from '../common/hooks.js';

function Navbar({ user }) {
  const { theme } = useTheme();
  const [css] = useStyletron();
  const logout = useLogout();

  return (
    <nav className={css({
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      height: '56px',
      padding: '0 1rem',
      backgroundColor: theme.navbar,
      color: theme.navbarColor
    })}>
      <div>
        <Link
          to="/"
          className={css({
            display: 'flex',
            alignItems: 'center',
            color: theme.navbarColor,
            ':hover': {
              color: theme.navbarColor
            }
          })}
        >
          <img
            src="/images/icon-no-bg-192x192.png"
            className={css({
              maxHeight: '45px',
              paddingRight: '0.3rem',
            })} />
          <span>Home Applyed</span>
        </Link>
      </div>
      {user &&
        <div>
          <Link
            to="#"
            onClick={logout}
            className={css({
              color: theme.navbarColor,
              ':hover': {
                color: theme.navbarColor
              },
            })}
          >
            Logout
          </Link>
        </div>
      }
    </nav>
  );
}

export { Navbar };