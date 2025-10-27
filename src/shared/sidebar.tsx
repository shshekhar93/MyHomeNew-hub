import { useCallback } from 'react';
import { useStyletron } from 'styletron-react';
import { NavLink } from 'react-router-dom';
import { useTheme } from '../common/theme';
import { useStoreUpdates, useLogout } from '../common/hooks';
import { useTranslations } from '../common/i18n';

function SideBar() {
  const translate = useTranslations();
  const { theme } = useTheme();
  const [css] = useStyletron();
  const logout = useLogout();

  const [menuOpen] = useStoreUpdates(['menu-state']);

  const navLinkClassName = css({
    display: 'block',
    padding: '0.5rem 1rem',
    color: theme.contrastColor,

    ':hover': {
      background: theme.highlightBackground,
      color: theme.highlightColor,
    },
  });

  const activeNavLinkClassName = css({
    background: theme.highlightBackground,
    color: theme.highlightColor,
  });

  const classNameCreator = useCallback(
    ({ isActive }: { isActive: boolean }) => {
      return `${navLinkClassName} ${isActive ? activeNavLinkClassName : ''}`;
    },
    [navLinkClassName, activeNavLinkClassName],
  );

  return (
    <ul
      className={css({
        display: menuOpen ? 'flex' : 'none',
        flexDirection: 'column',
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
          display: 'flex',
          minWidth: '250px',
        },
      })}
    >
      <li>
        <NavLink to="/" end className={classNameCreator}>
          {translate('links.home')}
        </NavLink>
      </li>
      <li>
        <NavLink to="/manage" className={classNameCreator}>
          {translate('links.manage-devices')}
        </NavLink>
      </li>
      <li>
        <NavLink to="/setup-device" className={classNameCreator}>
          {translate('links.setup-device')}
        </NavLink>
      </li>
      <li>
        <NavLink to="/connect-app" className={classNameCreator}>
          {translate('links.connect-app')}
        </NavLink>
      </li>
      <li>
        <NavLink to="/manage-connections" className={classNameCreator}>
          {translate('links.manage-connections')}
        </NavLink>
      </li>
      <li>
        <NavLink to="/family-sharing" className={classNameCreator}>
          {translate('links.family-sharing')}
        </NavLink>
      </li>
      <li>
        <NavLink
          to="/console"
          className={`${navLinkClassName} ${css({
            '@media only screen and (min-width: 600px)': {
              display: 'none',
            },
          })}`}
        >
          {translate('links.device-console')}
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
        >
          {translate('links.logout')}
        </NavLink>
      </li>
    </ul>
  );
}

export { SideBar };
