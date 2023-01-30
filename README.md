# `vite-ssr-issue-vue-sfc-dynamic-import`

**Description:** This repository uses a very minimal Vite SSR setup to demonstrate a very strange issue involving dynamic imports inside of Vue SFC components. Follow the instructions below to reproduce the issue.

1. Run `npm run dev` and go to http://localhost:3000. Note the log mesages for debugging.
2. Go to `entrypoints/App.vue`, change `<div>` to `<div class="whatever">`, and reload.
3. The server new crashes with a `__vite_ssr_import_meta__.glob is not a function` error.
