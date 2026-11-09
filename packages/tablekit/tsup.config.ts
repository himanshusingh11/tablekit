import { copyFileSync } from 'node:fs';
import { defineConfig } from 'tsup';

export default defineConfig([
  {
    // React entry: marked as a client module for React Server Components frameworks.
    entry: { index: 'src/index.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: true,
    target: 'es2020',
    external: ['react', 'react-dom', 'react/jsx-runtime'],
    banner: { js: '"use client";' },
    onSuccess: async () => {
      copyFileSync('src/styles/tablekit.css', 'dist/styles.css');
    },
  },
  {
    // Framework-agnostic core: no React, safe to import anywhere.
    entry: { core: 'src/core/index.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    target: 'es2020',
  },
]);
