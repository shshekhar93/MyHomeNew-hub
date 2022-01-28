import { useCallback } from 'react';
import { useStyletron } from 'styletron-react';
import { NavLink } from 'react-router-dom';
import { useTheme } from "../common/theme.js";

function SideBar() {
  const { theme } = useTheme();
  const [ css ] = useStyletron();

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
      backgroundColor: theme.contrastBackground,
      listStyle: 'none',
      margin: 0,
      padding: '0.5rem 0',
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
    </ul>
  )
}

export { SideBar };