import { defineConfig, searchForWorkspaceRoot } from 'vite';
import react from '@vitejs/plugin-react';
import cesium from 'vite-plugin-cesium';
import { fileURLToPath, URL } from 'node:url';

// Tải đúng mã TypeScript của Ngày 2, không nhân đôi Simulation Core.
const coreRoot = fileURLToPath(new URL('../../packages/simulation-core', import.meta.url));

export default defineConfig({
  plugins: [react(), cesium()],
  resolve: {
    alias: {
      '@uav/simulation-core': fileURLToPath(new URL('../../packages/simulation-core/src/index.ts', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    fs: { allow: [searchForWorkspaceRoot(process.cwd()), coreRoot] },
  },
});
