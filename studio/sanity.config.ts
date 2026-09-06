import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { schemaTypes } from './schemas';

// møma Learn CMS. Serves the Discover · Learn (articles) and Watch (reels)
// feeds the app reads via lib/sanity.ts.
//
// Two workspaces, one per dataset, because the app now reads a different one
// per environment: dev builds read `production`, pré-prod builds read
// `preprod`. As a single-workspace studio it silently edited whichever dataset
// was hardcoded here — publishing an article and not seeing it in the app,
// with nothing anywhere saying why.
//
// The switcher is the workspace menu at the top left. PRÉ-PROD is listed
// first: it is the one real mothers will read, so it should be the one you
// land on rather than the one you have to remember to pick.
export default defineConfig([
  {
    name: 'preprod',
    basePath: '/preprod',
    title: 'møma · PRÉ-PROD',
    projectId: '5hfvgbis',
    dataset: 'preprod',
    plugins: [structureTool(), visionTool()],
    schema: { types: schemaTypes },
  },
  {
    name: 'production',
    basePath: '/production',
    title: 'møma · dev (contenu de test)',
    projectId: '5hfvgbis',
    dataset: 'production',
    plugins: [structureTool(), visionTool()],
    schema: { types: schemaTypes },
  },
]);
