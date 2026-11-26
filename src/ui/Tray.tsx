import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { MODE_SWITCH, type Mode } from '@/config/modes';
import { TUNING } from '@/config/tuning';
import { ModeSwitch } from './ModeSwitch';

const M = TUNING.menu;

/** `hint`, if given, is what a tap on this tile does, in place of the menu's. */
type Tile<K> = { key: K; label: string; value: string; hint?: string };
type Props<K> = {
  /** Whose menu it is. */
  mode: Mode;
  open: boolean;
  onToggle: () => void;
  tiles: Tile<K>[];
  /** What a tap on a tile does, read aloud. */
  hint: string;
  onTile: (key: K) => void;
  /** Left out, there is no Clear. */
  onPopAll?: () => void;
  onMode: (mode: Mode) => void;
};

/** One small dot that opens a tile for each setting, showing what is chosen. */
export function Tray<K extends string>({
  mode,
  open,
  onToggle,
  tiles,
  hint,
  onTile,
  onPopAll,
  onMode,
}: Props<K>) {
  const { width, height } = useWindowDimensions();
  const grid = Math.min(width - M.side * 2, M.widest);
  const tile = {
    width: Math.floor((grid - M.gap * (M.columns - 1)) / M.columns),
    minHeight: M.height,
  };
  return (
    <View style={styles.wrap} pointerEvents="box-none">
      {open && (
        <Animated.View
          entering={FadeIn.duration(350)}
          exiting={FadeOut.duration(250)}
          style={[styles.panel, { maxHeight: height - MODE_SWITCH.bottom - MODE_SWITCH.above }]}
        >
          {(tiles.length > 0 || onPopAll) && (
            <ScrollView
              alwaysBounceVertical={false}
              style={styles.scroll}
              contentContainerStyle={[styles.grid, { width: grid }]}
            >
              {tiles.map(({ key, label, value, hint: own }) => (
                <Pressable
                  key={key}
                  onPress={() => onTile(key)}
                  accessibilityRole="button"
                  accessibilityLabel={label}
                  accessibilityValue={{ text: value }}
                  accessibilityHint={own ?? hint}
                  style={({ pressed }) => [styles.tile, tile, pressed && styles.pressed]}
                >
                  <Text numberOfLines={1} style={styles.label}>
                    {label}
                  </Text>
                  <Text numberOfLines={1} adjustsFontSizeToFit style={styles.value}>
                    {value}
                  </Text>
                </Pressable>
              ))}
              {onPopAll && (
                <Pressable
                  onPress={onPopAll}
                  accessibilityRole="button"
                  accessibilityLabel="Clear all bubbles"
                  style={({ pressed }) => [
                    styles.tile,
                    styles.clear,
                    tile,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text numberOfLines={1} adjustsFontSizeToFit style={styles.value}>
                    Clear
                  </Text>
                </Pressable>
              )}
            </ScrollView>
          )}
          <ModeSwitch mode={mode} onMode={onMode} />
        </Animated.View>
      )}
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityLabel={open ? 'Close options' : 'Open options'}
        style={styles.handle}
      >
        <View style={[styles.dot, open && styles.dotOn]} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 22, alignItems: 'center' },
  // The foot puts the switch at MODE_SWITCH.bottom, as in the chooser.
  panel: {
    alignSelf: 'stretch',
    backgroundColor: 'rgba(5,8,20,0.74)',
    paddingTop: 14,
    paddingBottom: 6,
  },
  scroll: { flexGrow: 0, flexShrink: 1, marginBottom: 14 },
  grid: { alignSelf: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: M.gap },
  tile: {
    borderRadius: M.corner,
    paddingHorizontal: 12,
    paddingVertical: 8,
    justifyContent: 'center',
    gap: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  // An action, not a setting: an outline with nothing in it.
  clear: { backgroundColor: 'transparent', alignItems: 'center' },
  pressed: { transform: [{ scale: 0.96 }], backgroundColor: 'rgba(255,255,255,0.2)' },
  label: { color: 'rgba(255,255,255,0.68)', fontSize: 12, letterSpacing: 0.4 },
  value: { color: '#fff', fontSize: 16, fontWeight: '500', letterSpacing: 0.2 },
  handle: { width: 64, height: 44, alignItems: 'center', justifyContent: 'center' },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.6)',
    boxShadow: '0 0 4px rgba(5,8,20,0.6)',
  },
  dotOn: { backgroundColor: '#fff' },
});
