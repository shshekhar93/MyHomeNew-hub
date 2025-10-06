import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

const backendProxyConfig = {
  target: 'http://127.0.0.1:8020',
  changeOrigin: true,
  ws: true,
};
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/login': backendProxyConfig,
      '/logout': backendProxyConfig,
      '/translations': backendProxyConfig,
      '/user': backendProxyConfig,
      '/devices': backendProxyConfig,
      '/create-client': backendProxyConfig,
      '/existing-clients': backendProxyConfig,
      '/delete-client': backendProxyConfig,
    },
  },
});
