# Running

Node is in `~/.local/node` and not on the shell path. In each new terminal:

```bash
export PATH="$HOME/.local/node/bin:/opt/homebrew/bin:$PATH" LANG=en_US.UTF-8
```

- `npm run ios -- --port 8090`: build and run. Port 8081 is often Stellar.
- `npm run ios -- --port 8090 --device`: on a phone. Judge feel and haptics here.
- `npm run check`: types, lint, format, tests.

Expo Go is not used. Rebuild after adding native code. `npx expo prebuild` regenerates `ios/`; then recreate `ios/.xcode.env.local` with `export NODE_BINARY=$HOME/.local/node/bin/node`.

Launch the dev build once: opening its deep link right after launching loads the app twice and leaves the splash showing.

The icon and splash are the Pearl bubble, cropped from a simulator screenshot of the real shader. Rebuild after changing anything in `assets/` or `app.json`.
