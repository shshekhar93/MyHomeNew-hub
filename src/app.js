import { BrowserRouter } from 'react-router-dom';
import {
  Provider as StyletronProvider,
} from 'styletron-react';
import { Client as Styletron } from 'styletron-engine-atomic';
import { ThemeProvider } from "./common/theme.js";
import { PageRoot } from "./pages/page-root.js";
import Store, { StoreContext } from './common/store.js';
import { useStoreUpdates, useUserDetails } from './common/hooks.js';
import LoadingPage from './pages/loading.js';


const engine = new Styletron();

const store = window.store = new Store();

const DEPENDENT_FIELDS = [
  'initialized',
  'initError',
]
function App() {
  useUserDetails(store);

  const [
    initialized,
    // initError,
  ] = useStoreUpdates(DEPENDENT_FIELDS, store);

  if(!initialized) {
    return (
      <StyletronProvider value={engine}>
        <LoadingPage />
      </StyletronProvider>
    );
  }

  return (
    <BrowserRouter>
      <StyletronProvider value={engine}>
        <ThemeProvider>
          <StoreContext.Provider value={store}>
            <PageRoot />
          </StoreContext.Provider>
        </ThemeProvider>
      </StyletronProvider>
    </BrowserRouter>
  );
}

export default App;