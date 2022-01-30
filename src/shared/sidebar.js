import { useCallback } from 'react';
import { useStyletron } from 'styletron-react';
import { NavLink } from 'react-router-dom';
import { useTheme } from "../common/theme.js";
import { useStoreUpdates, useLogout } from '../common/hooks.js';
import { useStore } from '../common/store.js';

function SideBar() {
  const { theme } = useTheme();
  const [ css ] = useStyletron();
  const logout = useLogout();

  const [menuOpen] = useStoreUpdates(['menu-state']);

  const navLinkClassName = css({
    display: 'block',
    padding: '0.5rem 1rem',
    color: theme.contrastColor,

    ':hover': {
      background: theme.highlightBackground,
      color: theme.highlightColor,
    }
  });

  const activeNavLinkClassName = css({
    background: theme.highlightBackground,
    color: theme.highlightColor,
  });

  const classNameCreator = useCallback(({ isActive}) => {
    return (
      `${navLinkClassName} ${isActive? activeNavLinkClassName : ''}`
    );
  }, [navLinkClassName, activeNavLinkClassName]);

  return (
    <ul className={css({
      display: menuOpen ? 'block': 'none',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 99,
      backgroundColor: theme.contrastBackground,
      listStyle: 'none',
      margin: 0,
      padding: '0.5rem 0',

      '@media only screen and (min-width: 600px)': {
        position: 'static',
        display: 'block',
        minWidth: '250px',
      },
    })}>
      <li>
        <NavLink
          to="/"
          end
          className={classNameCreator}
        >
          Home
        </NavLink>
      </li>
      <li>
        <NavLink
          to="/manage"
          className={classNameCreator}
        >
          Manage Devices
        </NavLink>
      </li>
      <li>
        <NavLink
          to="/setup-device"
          className={classNameCreator}
        >
          Setup new device
        </NavLink>
      </li>
      <li>
        <NavLink
          to="/connect-app"
          className={classNameCreator}
        >
          Connect to app
        </NavLink>
      </li>
      <li>
        <NavLink
          to="/manage-connections"
          className={classNameCreator}
        >
          Manage connected apps
        </NavLink>
      </li>
      <li>
        <NavLink
          to="#"
          className={`${navLinkClassName} ${css({
            '@media only screen and (min-width: 600px)': {
              display: 'none',
            },
          })}`}
          onClick={logout}
        >Logout</NavLink>
      </li>
    </ul>
  )
}

export { SideBar };