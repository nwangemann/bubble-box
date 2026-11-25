import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/** The system Reduce Motion setting, followed live. */
export function useReduceMotion() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    let live = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => live && setOn(v));
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setOn);
    return () => {
      live = false;
      sub.remove();
    };
  }, []);
  return on;
}
