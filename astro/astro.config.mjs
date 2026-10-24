import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://mandresoeiro.github.io',
  base: '/catequese-tradicional',
  trailingSlash: 'always',
  output: 'static',
  build: { format: 'directory' },

  // Usa os mesmos SVGs e estilos de imagem do projeto MkDocs.
  publicDir: '../docs/assets',

  vite: {
    plugins: [tailwindcss()],
  },
});