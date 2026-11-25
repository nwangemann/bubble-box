# 3. A web preview

Status: trial, 2026-11-25

## Decision

`react-dom` and `react-native-web`, so Expo can build the same code for a browser. Skia draws through CanvasKit, copied into `public/` by the build. Only the start (`src/start.web.ts`) and storage (`src/services/store.web.ts`) differ, and Glass is off.

## Why

To try the app on a phone without Xcode, signing or the App Store. ADR 1 still holds: the app is native. The web has no haptics on iOS, no Glass, tilt only over HTTPS, and one thread for everything.

## Drop it if

It is too slow on a phone to judge anything, or keeping it working costs native work.
