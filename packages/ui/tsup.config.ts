import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/tokens/index.ts',
    'src/tokens/golden-ratio.ts',
    'src/tokens/tailwind-preset.ts',
  ],
  format: ['cjs', 'esm'],
  dts: false, // Temporarily disabled due to React 18/19 type conflicts in lucide-react
  external: ['react', 'react-dom', 'tailwindcss'],
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: false,
  treeshake: true,
});
