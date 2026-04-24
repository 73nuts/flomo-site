import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';

// https://astro.build/config
export default defineConfig({
  site: 'https://ayada.local',
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
