import {useStyletron} from 'styletron-react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from '../common/store.js';
import SigninPage from '../pages/signin.js';
import { Navbar } from './navbar.js';
import { SideBar } from './sidebar.js';
import SignupPage from '../pages/signup.js';

function RootContainer({ children }) {
  const [css] = useStyletron();
  const store = useStore();
  const user = store.get('user');

  return (
    <div className={css({
      display: 'flex',
      flexDirection: 'column',
    })}>
      <Navbar user={user} />
      {!user?
        <Routes>
          <Route
            path="/signin"
            element={<SigninPage />} />
          <Route
            path="/signup"
            element={<SignupPage />} />
          <Route
            path="*"
            element={<Navigate to="/signin" />} />
        </Routes> :
        <div className={css({
          display: 'flex',
          minHeight: 'calc(100vh - 56px)'
        })}>
          <SideBar />
          <div id="page-container" className={css({
            flex: 1,
            padding: '1rem'
          })}>
            { children }
          </div>
        </div>
      }
    </div>
  )
}

export { RootContainer };
