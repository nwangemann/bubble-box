import type { ConfigContext, ExpoConfig } from 'expo/config';

// app.json holds the config. BUBBLE_BOX_BASE_URL sets the web base path for the GitHub Pages
// build (`/bubble-box`); unset, the web preview serves from the root, as in development (ADR 5).
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...(config as ExpoConfig),
  experiments: { ...config.experiments, baseUrl: process.env.BUBBLE_BOX_BASE_URL ?? '' },
});
