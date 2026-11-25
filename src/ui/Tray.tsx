import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

type Row = {
  label: string;
  options: { id: string; name: string }[];
  value: string;
  onPick: (id: string) => void;
  onPreview: () => void;
};
type Props = { open: boolean; onToggle: () => void; rows: Row[]; onPopAll: () => void };

/** One small dot that opens quiet rows of names. */
export function Tray({ open, onToggle, rows, onPopAll }: Props) {
  return (
    <View style={styles.wrap} pointerEvents="box-none">
      {open && (
        <Animated.View
          entering={FadeIn.duration(350)}
          exiting={FadeOut.duration(250)}
          style={styles.panel}
        >
          {rows.map((row) => (
            <View key={row.label} style={styles.row}>
              <Pressable
                onPress={row.onPreview}
                accessibilityRole="button"
                accessibilityLabel={`Preview ${row.label}`}
                hitSlop={6}
                style={({ pressed }) => [styles.title, pressed && styles.titlePressed]}
              >
                <Text style={styles.label}>{row.label}</Text>
              </Pressable>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.names}
                accessibilityLabel={row.label}
              >
                {row.options.map((o) => (
                  <Pressable
                    key={o.id}
                    onPress={() => row.onPick(o.id)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: o.id === row.value }}
                    hitSlop={4}
                    style={styles.option}
                  >
                    <Text style={[styles.name, o.id === row.value && styles.on]}>{o.name}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ))}
          <Pressable onPress={onPopAll} accessibilityRole="button" style={styles.clear}>
            <Text style={styles.name}>Let them all go</Text>
          </Pressable>
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
  panel: { alignSelf: 'stretch', backgroundColor: 'rgba(5,8,20,0.35)', paddingVertical: 6 },
  row: { flexDirection: 'row', alignItems: 'center', paddingLeft: 18 },
  names: { alignItems: 'center', paddingLeft: 8, paddingRight: 22 },
  // A raised white button, unlike the plain names beside it: it opens the previews.
  title: {
    width: 72,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    boxShadow:
      '0 4px 8px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.4), inset 0 -3px 0 rgba(20,26,56,0.2)',
  },
  titlePressed: {
    transform: [{ translateY: 2 }],
    backgroundColor: '#e6e9f4',
    boxShadow: '0 1px 2px rgba(0,0,0,0.5)',
  },
  label: { color: '#0b1024', fontSize: 13, fontWeight: '700' },
  option: { paddingHorizontal: 10, minHeight: 44, justifyContent: 'center' },
  name: { color: 'rgba(255,255,255,0.6)', fontSize: 15, fontWeight: '300', letterSpacing: 0.3 },
  on: { color: '#fff', fontWeight: '500' },
  clear: { paddingHorizontal: 22, minHeight: 44, justifyContent: 'center' },
  handle: { width: 64, height: 44, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.4)' },
  dotOn: { backgroundColor: '#fff' },
});
