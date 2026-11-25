# 2. Expo modules for saved settings and splash

Status: accepted, 2026-11-24

- `expo-file-system` keeps the settings in one small JSON file. It already ships inside `expo`, and reads synchronously, so the first frame is right. MMKV and SQLite are more than seven strings need.
- `expo-splash-screen` shows the bubble on the app's own background at launch. It is the supported way to configure a splash.
