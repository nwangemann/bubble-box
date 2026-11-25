import { registerRootComponent } from 'expo';
import { LoadSkiaWeb } from '@shopify/react-native-skia/lib/module/web';

// Skia must be ready before anything that touches it is imported.
LoadSkiaWeb({ locateFile: (file: string) => `/${file}` })
  .then(() => import('../App'))
  .then(({ default: App }) => registerRootComponent(App))
  .catch((e) => console.error('Skia did not load', e));
