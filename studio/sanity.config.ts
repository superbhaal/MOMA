import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { schemaTypes } from './schemas';

// møma Learn CMS. Serves the Discover · Learn (articles) and Watch (reels) feeds
// the app reads via lib/sanity.ts. Deploy with `npm run deploy` → hosts at
// https://moma-learn.sanity.studio (name chosen at first deploy).
export default defineConfig({
  name: 'moma-learn',
  title: 'møma · Learn',
  projectId: '5hfvgbis',
  dataset: 'production',
  plugins: [structureTool(), visionTool()],
  schema: {
    types: schemaTypes,
  },
});
