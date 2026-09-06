import { defineCliConfig } from 'sanity/cli';

// Same project the app reads from (EXPO_PUBLIC_SANITY_PROJECT_ID in .env.local).
// `dev` is the default for CLI commands that take no dataset argument — the
// one holding test content. Pass `preprod` explicitly for anything real.
export default defineCliConfig({
  api: {
    projectId: '5hfvgbis',
    dataset: 'dev',
  },
});
