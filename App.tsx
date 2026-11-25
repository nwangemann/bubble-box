import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ENVIRONMENTS, type EnvironmentId } from '@/config/environments';
import { FEELS, type FeelId } from '@/config/feels';
import { GLASS, type GlassId } from '@/config/glass';
import { TAPS, type TapId } from '@/config/taps';
import { Scene } from '@/scene/Scene';
import { STYLES, type StyleId } from '@/styles';
import { Tray } from '@/ui/Tray';

const options = (record: Record<string, { name: string }>) =>
  Object.entries(record).map(([id, { name }]) => ({ id, name }));

const STYLE_OPTIONS = options(STYLES);
const ENVIRONMENT_OPTIONS = options(ENVIRONMENTS);
const GLASS_OPTIONS = options(GLASS);
const TAP_OPTIONS = options(TAPS);
const FEEL_OPTIONS = options(FEELS);

export default function App() {
  const [style, setStyle] = useState<StyleId>('soap');
  const [environment, setEnvironment] = useState<EnvironmentId>('invisible');
  const [feel, setFeel] = useState<FeelId>('drift');
  const [glass, setGlass] = useState<GlassId>('ripple');
  const [tap, setTap] = useState<TapId>('pop');
  const [open, setOpen] = useState(false);
  const [popSignal, setPopSignal] = useState(0);
  const close = useCallback(() => setOpen(false), []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#070a18' }}>
      <StatusBar hidden />
      <Scene
        style={style}
        feel={FEELS[feel]}
        env={ENVIRONMENTS[environment]}
        glass={GLASS[glass]}
        tapPops={TAPS[tap].pops}
        popSignal={popSignal}
        onTouch={close}
      />
      <Tray
        open={open}
        onToggle={() => setOpen((o) => !o)}
        onPopAll={() => setPopSignal((n) => n + 1)}
        rows={[
          {
            label: 'Bubble',
            options: STYLE_OPTIONS,
            value: style,
            onPick: (id) => setStyle(id as StyleId),
          },
          {
            label: 'Box',
            options: ENVIRONMENT_OPTIONS,
            value: environment,
            onPick: (id) => setEnvironment(id as EnvironmentId),
          },
          {
            label: 'Feel',
            options: FEEL_OPTIONS,
            value: feel,
            onPick: (id) => setFeel(id as FeelId),
          },
          {
            label: 'Glass',
            options: GLASS_OPTIONS,
            value: glass,
            onPick: (id) => setGlass(id as GlassId),
          },
          {
            label: 'Tap',
            options: TAP_OPTIONS,
            value: tap,
            onPick: (id) => setTap(id as TapId),
          },
        ]}
      />
    </GestureHandlerRootView>
  );
}
