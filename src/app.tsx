import { BrowserRouter } from 'react-router-dom';
import { Provider as StyletronProvider } from 'styletron-react';
import { Client as Styletron } from 'styletron-engine-atomic';
import { ThemeProvider } from './common/theme';
import { PageRoot } from './pages/page-root';
import Store, { StoreContext } from './common/store';
import {
  useLoadUserDetails,
  useLoadTranslations,
  useInitialized,
} from './common/hooks';
import LoadingPage from './pages/loading';
import { I18nProvider } from './common/i18n';

const engine = new Styletron();

const store = new Store();

function App() {
  useLoadUserDetails(store);
  useLoadTranslations(store);

  const initialized = useInitialized(store);

  if (!initialized) {
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
            <I18nProvider>
              <PageRoot />
            </I18nProvider>
          </StoreContext.Provider>
        </ThemeProvider>
      </StyletronProvider>
    </BrowserRouter>
  );
}

export default App;
