import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// DOCS_BASE is set to "/tablekit/" when building for GitHub Pages.
export default defineConfig({
  base: process.env.DOCS_BASE ?? '/',
  plugins: [react()],
});
