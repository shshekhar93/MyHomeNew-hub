import { useStyletron } from 'styletron-react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../common/theme.js';
import { useStoreUpdates, useLogout } from '../common/hooks.js';
import { MenuIcon } from './menu-icon.js';
import { useStore } from '../common/store.js';
import { useCallback, useEffect } from 'react';

function Navbar() {
  const { theme } = useTheme();
  const [css] = useStyletron();
  const logout = useLogout();
  const { pathname } = useLocation();

  const store = useStore();
  const user = store.get('user');

  useEffect(() => {
    store.set('menu-state', false);
  }, [pathname]);

  const toggleMenu = useCallback(() => {
    store.set('menu-state', !store.get('menu-state'));
  }, [store]);

  const [menuOpen] = useStoreUpdates(['menu-state']);

  return (
    <nav
      className={css({
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '56px',
        padding: '0 1rem',
        backgroundColor: theme.navbar,
        color: theme.navbarColor,
      })}
    >
      <div>
        <Link
          to="/"
          className={css({
            display: 'flex',
            alignItems: 'center',
            color: theme.navbarColor,
            ':hover': {
              color: theme.navbarColor,
            },
          })}
        >
          <img
            src="/images/icon-no-bg-192x192.png"
            className={css({
              maxHeight: '45px',
              paddingRight: '0.3rem',
            })}
          />
          <span>Home Applyed</span>
        </Link>
      </div>
      {user && (
        <div>
          <Link
            to="#"
            onClick={logout}
            className={css({
              display: 'none',
              color: theme.navbarColor,
              ':hover': {
                color: theme.navbarColor,
              },
              '@media only screen and (min-width: 600px)': {
                display: 'block',
              },
            })}
          >
            Logout
          </Link>
          <div
            className={css({
              '@media only screen and (min-width: 600px)': {
                display: 'none',
              },
            })}
          >
            <MenuIcon isOpen={menuOpen} onClick={toggleMenu} />
          </div>
        </div>
      )}
    </nav>
  );
}

export { Navbar };
