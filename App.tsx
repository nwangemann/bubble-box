import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  DEFAULTS,
  feelPool,
  fxPools,
  glassPool,
  pickBox,
  RANDOM,
  ROWS,
  stylePool,
  tapPool,
  type Setting,
  type Settings,
} from '@/config/defaults';
import { Scene } from '@/scene/Scene';
import { Tray } from '@/ui/Tray';

export default function App() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [env, setEnv] = useState(() => pickBox(DEFAULTS.box));
  const [open, setOpen] = useState(false);
  const [popSignal, setPopSignal] = useState(0);
  const close = useCallback(() => setOpen(false), []);

  const { bubble, feel, glass, tap, meet, pop } = settings;
  const styles = useMemo(() => stylePool(bubble), [bubble]);
  const feels = useMemo(() => feelPool(feel), [feel]);
  const glasses = useMemo(() => glassPool(glass), [glass]);
  const taps = useMemo(() => tapPool(tap), [tap]);
  const fx = useMemo(() => fxPools(meet, pop), [meet, pop]);

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
        onTouch={close}
      />
      <Tray
        open={open}
        onToggle={() => setOpen((o) => !o)}
        onPopAll={() => setPopSignal((n) => n + 1)}
        rows={ROWS.map(({ key, label, options }) => ({
          label,
          options,
          value: settings[key],
          onPick: (id) => pick(key, id),
        }))}
      />
    </GestureHandlerRootView>
  );
}
