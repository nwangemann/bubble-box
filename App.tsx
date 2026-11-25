import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  calmFeel,
  feelPool,
  fxPools,
  glassPool,
  pickBox,
  RANDOM,
  NONE,
  ROWS,
  stylePool,
  tapPool,
  type Setting,
  type Settings,
} from '@/config/defaults';
import { Scene } from '@/scene/Scene';
import { loadSettings, saveSettings } from '@/services/savedSettings';
import { useReduceMotion } from '@/services/useReduceMotion';
import { Picker } from '@/ui/Picker';
import { Tray } from '@/ui/Tray';

export default function App() {
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [env, setEnv] = useState(() => pickBox(settings.box));
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<Setting | null>(null);
  const [popSignal, setPopSignal] = useState(0);
  const close = useCallback(() => setOpen(false), []);

  const calm = useReduceMotion();
  useEffect(() => saveSettings(settings), [settings]);

  const { bubble, feel, glass, tap, meet, pop } = settings;
  const styles = useMemo(() => stylePool(bubble), [bubble]);
  const feels = useMemo(() => (calm ? feelPool(feel).map(calmFeel) : feelPool(feel)), [feel, calm]);
  const glasses = useMemo(() => glassPool(calm ? 'still' : glass), [glass, calm]);
  const taps = useMemo(() => tapPool(tap), [tap]);
  const fx = useMemo(() => (calm ? fxPools(NONE, NONE) : fxPools(meet, pop)), [meet, pop, calm]);

  const pick = (key: Setting, id: string) => {
    // Choosing Random again moves to another box.
    if (key === 'box') setEnv((now) => pickBox(id, id === RANDOM ? now : undefined));
    setSettings((s) => ({ ...s, [key]: id }));
  };

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#070a18' }}>
      <StatusBar hidden />
      <Scene
        styles={styles}
        feels={feels}
        env={env}
        glasses={glasses}
        taps={taps}
        fx={fx}
        popSignal={popSignal}
        paused={preview !== null}
        onTouch={close}
      />
      <Tray
        open={open && preview === null}
        onToggle={() => setOpen((o) => !o)}
        onPopAll={() => setPopSignal((n) => n + 1)}
        rows={ROWS.map(({ key, label, options }) => ({
          label,
          options,
          value: settings[key],
          onPick: (id) => pick(key, id),
          onPreview: () => setPreview(key),
        }))}
      />
      {preview && (
        <Picker
          key={preview}
          setting={preview}
          settings={settings}
          env={env}
          calm={calm}
          onPick={(id) => {
            pick(preview, id);
            setPreview(null);
          }}
          onClose={() => setPreview(null)}
        />
      )}
    </GestureHandlerRootView>
  );
}
