import { LinearGradient } from 'expo-linear-gradient';
import { forwardRef } from 'react';
import { View } from 'react-native';

import { Swatch } from '@/components/ui/swatch';
import { AText } from '@/components/ui/text';
import { Fonts, Radius } from '@/constants/theme';
import type { Plan } from '@/lib/types';

/**
 * The 4:5 outfit-board card that gets captured and shared. Deliberately
 * self-contained styling (not theme-dependent) so the exported image looks
 * identical regardless of the viewer's light/dark setting.
 */
export const ShareCard = forwardRef<View, { plan: Plan }>(({ plan }, ref) => {
  const { trip, stats, garments } = plan;
  const swatches = Object.values(garments).slice(0, 9);

  return (
    <View
      ref={ref}
      collapsable={false}
      style={{ width: 320, height: 400, borderRadius: Radius.xl, overflow: 'hidden', backgroundColor: '#F6F2EB' }}>
      <LinearGradient colors={['#E8B08A', '#D68C74', '#B96F6F', '#57455C']} style={{ height: 76 }} />

      <View style={{ padding: 18, flex: 1 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: -46 }}>
          <AText style={{ fontFamily: Fonts?.serif, fontSize: 22, color: '#FBF6EC' }}>
            {trip.city}
          </AText>
          <AText style={{ fontSize: 11, color: '#FBF6EC', opacity: 0.9 }}>
            {trip.startsOn} – {trip.endsOn}
          </AText>
        </View>

        {/* Capsule grid — a small "sudoku" of the packed pieces. */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 34 }}>
          {swatches.map((g) => (
            <View key={g.id} style={{ width: 92, height: 62, borderRadius: 10, overflow: 'hidden' }}>
              <Swatch garment={g} size={92} />
            </View>
          ))}
        </View>

        <View style={{ flex: 1 }} />

        <View style={{ flexDirection: 'row', gap: 18, alignItems: 'baseline' }}>
          <Stat value={String(stats.items)} label="PIECES" />
          <Stat value={String(stats.wearableLooks)} label="LOOKS" />
          <Stat value={stats.carryOnFit ? 'CARRY-ON' : 'CHECKED'} label="" />
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 }}>
          <AText style={{ color: '#C98F8F', fontSize: 13 }}>✦</AText>
          <AText style={{ fontFamily: Fonts?.serif, fontSize: 18, color: '#22304A' }}>althea</AText>
          <AText style={{ fontSize: 9, letterSpacing: 2, color: '#B96F6F', marginLeft: 4 }}>
            TRAVEL BEAUTIFULLY
          </AText>
        </View>
      </View>
    </View>
  );
});

ShareCard.displayName = 'ShareCard';

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View>
      <AText style={{ fontSize: 22, fontWeight: '700', color: '#B96F6F' }}>{value}</AText>
      {label ? <AText style={{ fontSize: 9, letterSpacing: 1, color: '#8A8578' }}>{label}</AText> : null}
    </View>
  );
}
