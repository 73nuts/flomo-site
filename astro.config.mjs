import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';

// https://astro.build/config
// 部署到自定义域名 https://ayalife.cc（通过 Cloudflare DNS 代理 → GitHub Pages 回源）
export default defineConfig({
  site: 'https://ayalife.cc',
  base: '/',
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
