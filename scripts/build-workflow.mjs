import { build } from 'vite';

// Bundle the same shared engine and formatter used by the app into one deployable file.
await build({
  configFile: false,
  build: {
    outDir: 'dist-functions',
    emptyOutDir: true,
    minify: false,
    lib: {
      entry: 'supabase/functions/siba-workflow/index.ts',
      formats: ['es'],
      fileName: () => 'siba-workflow/index.js',
    },
    rollupOptions: {
      external: (id) => id.startsWith('https://'),
      output: { inlineDynamicImports: true },
    },
  },
});
