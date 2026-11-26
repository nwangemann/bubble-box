# Running

Needs Node 22.13+, 24.3+ or 26+, and Xcode with an iOS simulator for native builds. On the development Mac, Node is in `~/.local/node` and not on the shell path, so each new terminal starts with:

```bash
export PATH="$HOME/.local/node/bin:/opt/homebrew/bin:$PATH" LANG=en_US.UTF-8
```

- `npm run ios -- --port 8090`: build and run on the simulator. The port avoids 8081, which other projects often hold.
- `npm run ios -- --port 8090 --device`: on a phone. Judge feel and haptics here.
- `npm run check`: types, lint, format, tests.

## On a phone, in Safari

`npm run web:build`, then `npm run web:serve`, and open `http://<the Mac's local name>.local:8098` on a phone on the same network (`PORT=… npm run web:serve` for another port). Add to Home Screen hides Safari's bars. Rebuild after a change and reload. Anyone on that network can open it while it is served.

While the bundle and Skia load, a bubble drawn by `public/index.html` breathes; `src/start.web.ts` fades it once the app has drawn. The build ends with `scripts/web-finish.mjs`, which has the page fetch Skia and the app at once and zips them; `scripts/web-serve.mjs` sends the zipped copies.

A preview, not the app: Glass is always still, there are no haptics on an iPhone, and tilt needs HTTPS. Judge those, and frame time, on a native build. See [ADR 3](adr/0003-web-preview.md).

## Native builds

Expo Go is not used. Rebuild after adding native code. `npx expo prebuild` regenerates `ios/`; then recreate `ios/.xcode.env.local` with `export NODE_BINARY=$HOME/.local/node/bin/node` (or wherever Node is).

Launch the dev build once: opening its deep link right after launching loads the app twice and leaves the splash showing.

Sound plays through the Mac on a simulator, which has no silent switch: judge loudness and the switch on a phone.

The icon and splash are the Pearl bubble, cropped from a simulator screenshot of the real shader. Rebuild after changing anything in `assets/` or `app.json`.

## Screenshots

The images in `docs/images/` were taken from the web preview at 390 × 844. Bubbles can be made there without a finger by dispatching `pointerdown`, `pointermove` and `pointerup` events of `pointerType: 'touch'` on the canvas, holding a second or two before the release.
