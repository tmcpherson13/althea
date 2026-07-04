import { forwardRef } from 'react';
import { View } from 'react-native';

import { JourneyMap } from '@/components/journey-map';
import { AText } from '@/components/ui/text';
import { Fonts, Radius } from '@/constants/theme';
import type { GeoPoint } from '@/lib/geo';

/** The shareable journey recap card (map + stats), captured to an image. */
export const JourneyCard = forwardRef<
  View,
  { points: GeoPoint[]; places: number; photos: number; dateLabel: string; title: string }
>(({ points, places, photos, dateLabel, title }, ref) => {
  return (
    <View
      ref={ref}
      collapsable={false}
      style={{ width: 320, height: 400, borderRadius: Radius.xl, overflow: 'hidden', backgroundColor: '#22304A', padding: 16 }}>
      <AText style={{ fontFamily: Fonts?.serif, fontSize: 20, color: '#FBF6EC' }}>{title}</AText>
      <AText style={{ fontSize: 11, color: '#FBF6EC', opacity: 0.8, marginBottom: 10 }}>{dateLabel}</AText>

      <JourneyMap points={points} width={288} height={244} />

      <View style={{ flexDirection: 'row', gap: 20, marginTop: 14, alignItems: 'baseline', flex: 1 }}>
        <Stat value={String(places)} label={places === 1 ? 'PLACE' : 'PLACES'} />
        <Stat value={String(photos)} label={photos === 1 ? 'MOMENT' : 'MOMENTS'} />
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <AText style={{ color: '#C98F8F', fontSize: 13 }}>✦</AText>
        <AText style={{ fontFamily: Fonts?.serif, fontSize: 18, color: '#FBF6EC' }}>althea</AText>
        <AText style={{ fontSize: 9, letterSpacing: 2, color: '#D9A2A2', marginLeft: 4 }}>TRAVEL BEAUTIFULLY</AText>
      </View>
    </View>
  );
});

JourneyCard.displayName = 'JourneyCard';

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View>
      <AText style={{ fontSize: 24, fontWeight: '700', color: '#D9A2A2' }}>{value}</AText>
      <AText style={{ fontSize: 9, letterSpacing: 1, color: '#9BA0AC' }}>{label}</AText>
    </View>
  );
}
