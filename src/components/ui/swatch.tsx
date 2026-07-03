import { View } from 'react-native';

import { Radius } from '@/constants/theme';
import type { Garment } from '@/lib/types';

/**
 * Garment visual: a two-tone fabric swatch. Production replaces this with
 * the background-removed photo cutout; the two-tone block keeps the demo
 * data-driven (colors come from the garment record, not an asset).
 */
export function Swatch({ garment, size = 52 }: { garment: Garment; size?: number }) {
  const [primary, secondary] = garment.colors;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: Radius.sm,
        backgroundColor: primary,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.08)',
      }}>
      <View
        style={{
          position: 'absolute',
          width: size * 2,
          height: size * 0.55,
          backgroundColor: secondary,
          bottom: -size * 0.18,
          left: -size * 0.5,
          transform: [{ rotate: '-14deg' }],
        }}
      />
    </View>
  );
}
