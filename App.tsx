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
  pullPool,
  RANDOM,
  NONE,
  ROWS,
  stylePool,
  tapPool,
  trailPool,
  type Setting,
  type Settings,
} from '@/config/defaults';
import { CUSTOM, customLook, type Custom } from '@/config/custom';
import { dress, type Walls } from '@/config/environments';
import type { Mode } from '@/config/modes';
import { RULES, type RuleId } from '@/config/rules';
import { addWin } from '@/config/tally';
import { Scene } from '@/scene/Scene';
import { loadSettings, saveSettings } from '@/services/savedSettings';
import { useReduceMotion } from '@/services/useReduceMotion';
import { THEME_IDS, THEMES, type ThemeId } from '@/showdown';
import { castFor, mostOf, type CastChoice, type CastId } from '@/showdown/casts';
import { Lobby } from '@/ui/Lobby';
import { Maker } from '@/ui/Maker';
import { Picker } from '@/ui/Picker';
import { Pool } from '@/ui/Pool';
import { Showdown } from '@/ui/Showdown';
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
  const [lobby, setLobby] = useState(false);
  const [rule, setRule] = useState<RuleId>(saved.rule);
  const [count, setCount] = useState(saved.count);
  const [cast, setCast] = useState<CastChoice>(saved.cast);
  const [tally, setTally] = useState(saved.tally);
  /** Name of the one rooted for, kept while they enter again. */
  const [favourite, setFavourite] = useState<string | null>(null);
  const [hinted, setHinted] = useState(saved.hinted);
  const [bout, setBout] = useState<{
    arena: ThemeId;
    cast: CastId;
    round: number;
  } | null>(null);
  const [pool, setPool] = useState(false);
  const [poolSettings, setPoolSettings] = useState(saved.pool);
  const [popSignal, setPopSignal] = useState(0);
  const close = useCallback(() => setOpen(false), []);
  const learned = useCallback(() => setHinted(true), []);

  const calm = useReduceMotion();
  useEffect(() => {
    // A slider moves many times a second; one write at the end is enough.
    const timer = setTimeout(
      () =>
        saveSettings({
          settings,
          walls,
          custom,
          rule,
          count,
          cast,
          tally,
          pool: poolSettings,
          hinted,
        }),
      300,
    );
    return () => clearTimeout(timer);
  }, [settings, walls, custom, rule, count, cast, tally, poolSettings, hinted]);

  const { bubble, feel, glass, tap, contact, pull, trail, meet, pop } = settings;
  const styles = useMemo(() => stylePool(bubble), [bubble]);
  const feels = useMemo(() => (calm ? feelPool(feel).map(calmFeel) : feelPool(feel)), [feel, calm]);
  const glasses = useMemo(() => glassPool(calm ? 'still' : glass), [glass, calm]);
  const taps = useMemo(() => tapPool(tap), [tap]);
  const merges = useMemo(() => mergePool(contact), [contact]);
  const pulls = useMemo(() => pullPool(calm ? NONE : pull), [pull, calm]);
  const trails = useMemo(() => trailPool(calm ? NONE : trail), [trail, calm]);
  const fx = useMemo(() => (calm ? fxPools(NONE, NONE) : fxPools(meet, pop)), [meet, pop, calm]);

  const pick = (key: Setting, id: string) => {
    // Choosing Random again moves to another.
    if (key === 'box') setLook((now) => pickBox(id, id === RANDOM ? now : undefined));
    if (key === 'light') setLight((now) => pickLight(id, id === RANDOM ? now : undefined));
    // Choosing Custom, even again, opens what makes it.
    if (key === 'bubble' && id === CUSTOM) setMaking(true);
    setSettings((s) => ({ ...s, [key]: id }));
  };

  const fight = (arena: ThemeId, who = castFor(cast, arena)) => {
    setLobby(false);
    setOpen(false);
    setBout((b) => ({ arena, cast: who, round: (b?.round ?? 0) + 1 }));
  };
  const anotherArena = (not?: ThemeId) => {
    const others = THEME_IDS.filter((id) => id !== not);
    fight(others[Math.floor(Math.random() * others.length)]!);
  };
  const switchTo = (mode: Mode) => {
    setLobby(mode === 'showdown');
    setPool(mode === 'pool');
    // The chooser waits over the menu; 8-ball has a menu of its own.
    setOpen(mode !== 'pool');
  };
  const covered = preview !== null || making || lobby || bout !== null || pool;

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
        pulls={pulls}
        trails={trails}
        popSignal={popSignal}
        paused={covered}
        calm={calm}
        hints={!hinted}
        hush={open}
        onHinted={learned}
        onTouch={close}
      />
      <Tray
        mode="calm"
        hint="Shows the options"
        open={open && !covered}
        onToggle={() => setOpen((o) => !o)}
        onMode={switchTo}
        onPopAll={() => setPopSignal((n) => n + 1)}
        onTile={setPreview}
        tiles={ROWS.map(({ key, label, options }) => ({
          key,
          label,
          value: options.find((o) => o.id === settings[key])!.name,
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
          onWalls={setWalls}
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
      {lobby && (
        <Lobby
          rule={rule}
          onRule={setRule}
          count={count}
          onCount={setCount}
          cast={cast}
          onCast={setCast}
          onPick={(arena) => fight(arena)}
          onRandom={() => anotherArena()}
          onMode={switchTo}
          onClose={() => setLobby(false)}
        />
      )}
      {bout && (
        <Showdown
          key={bout.round}
          arena={THEMES[bout.arena]}
          cast={bout.cast}
          rule={RULES[rule]}
          count={Math.min(count, mostOf(bout.cast))}
          calm={calm}
          favourite={favourite}
          onFavourite={setFavourite}
          tally={tally}
          onWon={(name, called) => setTally((t) => addWin(t, name, called))}
          onAgain={() => fight(bout.arena, bout.cast)}
          onNext={() => anotherArena(bout.arena)}
          onLeave={() => setBout(null)}
        />
      )}
      {pool && (
        <Pool settings={poolSettings} calm={calm} onSettings={setPoolSettings} onMode={switchTo} />
      )}
    </GestureHandlerRootView>
  );
}
