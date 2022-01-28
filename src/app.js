import { BrowserRouter } from 'react-router-dom';
import {
  Provider as StyletronProvider,
  DebugEngine
} from 'styletron-react';
import { Client as Styletron } from 'styletron-engine-atomic';
import { ThemeProvider } from "./common/theme.js";
import { RootContainer } from "./shared/root-container.js";
import Store, { StoreContext } from './common/store.js';
import { hookStoreUpdates, hookUserDetails } from './common/hooks.js';
import LoadingPage from './pages/loading.js';

const debug =
  process.env.NODE_ENV === "production" ? void 0 : new DebugEngine();
const engine = new Styletron();

const store = window.store = new Store();

const DEPENDENT_FIELDS = [
  'initialized',
  'initError',
]
function App() {
  hookUserDetails(store);
  hookStoreUpdates(DEPENDENT_FIELDS, store);

  if(!store.get('initialized')) {
    return (
      <StyletronProvider value={engine} debug={debug} debugAfterHydration>
        <LoadingPage />
      </StyletronProvider>
    );
  }

  return (
    <BrowserRouter>
      <StyletronProvider value={engine} debug={debug} debugAfterHydration>
        <ThemeProvider>
          <StoreContext.Provider value={store}>
            <RootContainer>
              Hello world!
            </RootContainer>
          </StoreContext.Provider>
        </ThemeProvider>
      </StyletronProvider>
    </BrowserRouter>
  );
}

export default App;