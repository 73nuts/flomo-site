import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';

// https://astro.build/config
// 部署到 https://73nuts.github.io/flomo-site/
// 如果未来绑定自定义域名（例如 ayada.yourdomain.com），把 base 改为 '/' 即可
export default defineConfig({
  site: 'https://73nuts.github.io',
  base: '/flomo-site',
  integrations: [svelte()],
  vite: {
    server: {
      watch: {
        // 内容集合在外部目录，不 watch（手动 pnpm sync 触发）
        ignored: ['**/Documents/flomo-sync/**'],
      },
    },
  },
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },
});
