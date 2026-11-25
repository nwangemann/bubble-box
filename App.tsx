import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  calmFeel,
  feelPool,
  fxPools,
  glassPool,
  mergePool,
  pickBox,
  pickLight,
  RANDOM,
  NONE,
  ROWS,
  stylePool,
  tapPool,
  type Setting,
  type Settings,
} from '@/config/defaults';
import { CUSTOM, customLook, type Custom } from '@/config/custom';
import { dress, type Walls } from '@/config/environments';
import { Scene } from '@/scene/Scene';
import { loadSettings, saveSettings } from '@/services/savedSettings';
import { useReduceMotion } from '@/services/useReduceMotion';
import { Maker } from '@/ui/Maker';
import { Picker } from '@/ui/Picker';
import { Tray } from '@/ui/Tray';

export default function App() {
  const [saved] = useState(loadSettings);
  const [settings, setSettings] = useState<Settings>(saved.settings);
  const [walls, setWalls] = useState<Walls>(saved.walls);
  const [custom, setCustom] = useState<Custom>(saved.custom);
  const mine = useMemo(() => customLook(custom), [custom]);
  const [making, setMaking] = useState(false);
  const [look, setLook] = useState(() => pickBox(settings.box));
  const [light, setLight] = useState(() => pickLight(settings.light));
  const env = useMemo(() => dress(look, light, walls), [look, light, walls]);
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<Setting | null>(null);
  const [popSignal, setPopSignal] = useState(0);
  const close = useCallback(() => setOpen(false), []);

  const calm = useReduceMotion();
  useEffect(() => {
    // A slider moves many times a second; one write at the end is enough.
    const timer = setTimeout(() => saveSettings({ settings, walls, custom }), 300);
    return () => clearTimeout(timer);
  }, [settings, walls, custom]);

  const { bubble, feel, glass, tap, contact, meet, pop } = settings;
  const styles = useMemo(() => stylePool(bubble), [bubble]);
  const feels = useMemo(() => (calm ? feelPool(feel).map(calmFeel) : feelPool(feel)), [feel, calm]);
  const glasses = useMemo(() => glassPool(calm ? 'still' : glass), [glass, calm]);
  const taps = useMemo(() => tapPool(tap), [tap]);
  const merges = useMemo(() => mergePool(contact), [contact]);
  const fx = useMemo(() => (calm ? fxPools(NONE, NONE) : fxPools(meet, pop)), [meet, pop, calm]);

  const pick = (key: Setting, id: string) => {
    // Choosing Random again moves to another.
    if (key === 'box') setLook((now) => pickBox(id, id === RANDOM ? now : undefined));
    if (key === 'light') setLight((now) => pickLight(id, id === RANDOM ? now : undefined));
    // Choosing Custom, even again, opens what makes it.
    if (key === 'bubble' && id === CUSTOM) setMaking(true);
    setSettings((s) => ({ ...s, [key]: id }));
  };

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#070a18' }}>
      <StatusBar hidden />
      <Scene
        styles={styles}
        mine={mine}
        feels={feels}
        env={env}
        glasses={glasses}
        taps={taps}
        fx={fx}
        merges={merges}
        popSignal={popSignal}
        paused={preview !== null || making}
        onTouch={close}
      />
      <Tray
        open={open && preview === null && !making}
        onToggle={() => setOpen((o) => !o)}
        walls={walls}
        onWalls={setWalls}
        onPopAll={() => setPopSignal((n) => n + 1)}
        rows={ROWS.map(({ key, label, options }) => ({
          key,
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
          mine={mine}
          look={look}
          light={light}
          walls={walls}
          calm={calm}
          onPick={(id) => {
            pick(preview, id);
            setPreview(null);
          }}
          onClose={() => setPreview(null)}
        />
      )}
      {making && (
        <Maker
          custom={custom}
          mine={mine}
          env={env}
          calm={calm}
          onChange={setCustom}
          onClose={() => setMaking(false)}
        />
      )}
    </GestureHandlerRootView>
  );
}
