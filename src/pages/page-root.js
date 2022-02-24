import { useStyletron } from 'styletron-react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useStore } from '../common/store.js';
import SigninPage from './signin.js';
import { Navbar } from '../shared/navbar.js';
import { SideBar } from '../shared/sidebar.js';
import SignupPage from './signup.js';
import ManageDevicesPage from './manage-devices.js';
import DevicePage from './devices.js';
import SetupDevice from './setup-device.js';
import ConnectAppPage from './connect-app.js';
import ManageConnectionsPage from './manage-connections.js';
import { getReturnURI } from '../common/helper.js';
import AuthorizePage from './authorize.js';

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
      {!user ? (
        <Routes>
          <Route path="/signin" element={<SigninPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route
            path="*"
            element={<Navigate to={`/signin?return=${getReturnURI()}`} />}
          />
        </Routes>
      ) : (
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
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </div>
      )}
    </div>
  );
}

export { PageRoot };
