import { useEffect } from 'react';
import {
  SensorType,
  useAnimatedReaction,
  useAnimatedSensor,
  type SharedValue,
} from 'react-native-reanimated';
import { TUNING } from '@/config/tuning';
import type { Vec3 } from '@/core/types';

/** Listens to which way is down while mounted. Draws nothing. */
export function Tilt({ gravity }: { gravity: SharedValue<Vec3 | null> }) {
  const { sensor } = useAnimatedSensor(SensorType.GRAVITY, { interval: TUNING.tilt.interval });
  useAnimatedReaction(
    () => sensor.value,
    (g, before) => {
      // The first value is left over from before, or empty.
      if (before === null) return;
      // On both platforms the sensor has y up and z towards the viewer; the box has y down and z away.
      gravity.value = { x: g.x, y: -g.y, z: -g.z };
    },
  );
  useEffect(() => () => gravity.set(null), [gravity]);
  return null;
}
