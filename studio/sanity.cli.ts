import { defineCliConfig } from 'sanity/cli';

// Same project the app reads from (EXPO_PUBLIC_SANITY_PROJECT_ID in .env.local).
export default defineCliConfig({
  api: {
    projectId: '5hfvgbis',
    dataset: 'production',
  },
});
