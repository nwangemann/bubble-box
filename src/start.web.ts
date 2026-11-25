import { registerRootComponent } from 'expo';
import { LoadSkiaWeb } from '@shopify/react-native-skia/lib/module/web';

const loading = document.getElementById('loading');

/** Fades the page's loading bubble once the app's first canvas has had a frame to draw. */
function reveal() {
  if (!document.querySelector('#root canvas')) {
    requestAnimationFrame(reveal);
    return;
  }
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      loading?.classList.add('done');
      setTimeout(() => loading?.remove(), 600);
    }),
  );
}

function fail(e: unknown) {
  console.error('The app did not load', e);
  if (!loading) return;
  loading.classList.add('failed');
  loading.setAttribute('aria-label', 'Could not load');
  const note = document.createElement('p');
  note.textContent = 'Could not load. Reload to try again.';
  loading.append(note);
}

// Skia must be ready before anything that touches it is imported.
LoadSkiaWeb({ locateFile: (file: string) => `/${file}` })
  .then(() => import('../App'))
  .then(({ default: App }) => {
    registerRootComponent(App);
    reveal();
  })
  .catch(fail);
