import { useStyletron } from 'styletron-react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useStore } from '../common/store';
import SigninPage from './signin';
import { Navbar } from '../shared/navbar';
import { SideBar } from '../shared/sidebar';
import SignupPage from './signup';
import ManageDevicesPage from './manage-devices';
import DevicePage from './devices';
import SetupDevice from './setup-device';
import ConnectAppPage from './connect-app';
import ManageConnectionsPage from './manage-connections';
import { getReturnURI } from '../common/helper';
import AuthorizePage from './authorize';
import { FamilySharingPage } from './family-sharing';

const FULL_WIDTH_PAGE = ['/authorize'];

function PageRoot() {
  const [css] = useStyletron();
  const store = useStore();
  const { pathname } = useLocation();
  const user = store.get('user');

  return (
    <div
      className={css({
        display: 'flex',
        flexDirection: 'column',
      })}
    >
      <Navbar />
      {!user
        ? (
          <Routes>
            <Route path="/signin" element={<SigninPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route
              path="*"
              element={<Navigate to={`/signin?return=${getReturnURI()}`} />}
            />
          </Routes>
        )
        : (
          <div
            className={css({
              position: 'relative',
              display: 'flex',
              minHeight: 'calc(100vh - 56px)',
            })}
          >
            {!FULL_WIDTH_PAGE.includes(pathname) && <SideBar />}
            <div
              id="page-container"
              className={css({
                flex: 1,
                padding: '1rem',
              })}
            >
              <Routes>
                <Route path="/" element={<DevicePage />} />
                <Route path="/authorize" element={<AuthorizePage />} />
                <Route path="/manage" element={<ManageDevicesPage />} />
                <Route path="/setup-device" element={<SetupDevice />} />
                <Route path="/connect-app" element={<ConnectAppPage />} />
                <Route
                  path="/manage-connections"
                  element={<ManageConnectionsPage />}
                />
                <Route path="/family-sharing" element={<FamilySharingPage />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </div>
          </div>
        )}
    </div>
  );
}

export { PageRoot };
