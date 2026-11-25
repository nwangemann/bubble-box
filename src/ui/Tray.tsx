import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

type Row = {
  label: string;
  options: { id: string; name: string }[];
  value: string;
  onPick: (id: string) => void;
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
            <ScrollView
              key={row.label}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.row}
              accessibilityLabel={row.label}
            >
              <Text style={styles.label}>{row.label}</Text>
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
  row: { alignItems: 'center', paddingHorizontal: 22 },
  label: { color: 'rgba(255,255,255,0.45)', fontSize: 12, width: 62 },
  option: { paddingHorizontal: 10, minHeight: 44, justifyContent: 'center' },
  name: { color: 'rgba(255,255,255,0.6)', fontSize: 15, fontWeight: '300', letterSpacing: 0.3 },
  on: { color: '#fff', fontWeight: '500' },
  clear: { paddingHorizontal: 22, minHeight: 44, justifyContent: 'center' },
  handle: { width: 64, height: 44, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.4)' },
  dotOn: { backgroundColor: '#fff' },
});
