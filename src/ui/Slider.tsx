import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';

type Props = { label: string; value: number; onChange: (value: number) => void };

const STEPS = 50;
const KNOB = 16;

/** A quiet slider from 0 to 1. */
export function Slider({ label, value, onChange }: Props) {
  const [width, setWidth] = useState(1);
  const set = (x: number) => {
    const k = Math.min(1, Math.max(0, (x - KNOB / 2) / Math.max(1, width - KNOB)));
    const next = Math.round(k * STEPS) / STEPS;
    if (next !== value) onChange(next);
  };
  const nudge = (by: number) => onChange(Math.min(1, Math.max(0, value + by)));
  const pan = usePanGesture({
    minDistance: 0,
    shouldCancelWhenOutside: false,
    onBegin: (e) => {
      'worklet';
      scheduleOnRN(set, e.x);
    },
    onUpdate: (e) => {
      'worklet';
      scheduleOnRN(set, e.x);
    },
  });
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <GestureDetector gesture={pan}>
        <View
          style={styles.touch}
          collapsable={false}
          onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={label}
          accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={(e) =>
            nudge(e.nativeEvent.actionName === 'increment' ? 0.1 : -0.1)
          }
        >
          <View style={styles.track} />
          <View style={[styles.knob, { left: value * (width - KNOB) }]} />
        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  label: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginRight: 8 },
  touch: { flex: 1, height: 44, justifyContent: 'center' },
  track: { height: 2, borderRadius: 1, backgroundColor: 'rgba(255,255,255,0.35)' },
  knob: {
    position: 'absolute',
    width: KNOB,
    height: KNOB,
    borderRadius: KNOB / 2,
    backgroundColor: '#fff',
    boxShadow: '0 1px 3px rgba(0,0,0,0.5)',
  },
});
