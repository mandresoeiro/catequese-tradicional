import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://mandresoeiro.github.io',
  base: '/catequese-tradicional',
  trailingSlash: 'always',
  output: 'static',
  devToolbar: { enabled: false },
  build: { format: 'directory' },
  // Usa os mesmos SVGs e estilos de imagem do projeto MkDocs.
  publicDir: '../docs/assets',
});
