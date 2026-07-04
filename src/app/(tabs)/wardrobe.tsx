import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { AButton } from '@/components/ui/button';
import { Swatch } from '@/components/ui/swatch';
import { Screen } from '@/components/ui/screen';
import { AText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useWardrobe } from '@/lib/data';

export default function WardrobeScreen() {
  const theme = useTheme();
  const { items, loading, live, refresh } = useWardrobe();

  // Re-fetch when returning from the scan flow so a new garment shows up.
  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  return (
    <Screen>
      <AText variant="small" color="secondary">
        {items.length} {items.length === 1 ? 'item' : 'items'} catalogued
        {live ? '' : ' · demo closet'}
      </AText>

      <AButton label="Scan a garment" onPress={() => router.push('/scan')} />

      <AText variant="eyebrow" color="secondary" style={{ marginTop: Spacing.three }}>
        {live ? 'Your closet' : 'Recently added'}
      </AText>

      {loading ? (
        <View style={{ paddingVertical: Spacing.five, alignItems: 'center' }}>
          <ActivityIndicator color={theme.rose} />
        </View>
      ) : items.length === 0 ? (
        <View
          style={{
            paddingVertical: Spacing.five,
            paddingHorizontal: Spacing.three,
            alignItems: 'center',
            gap: Spacing.two,
          }}>
          <AText variant="title" style={{ textAlign: 'center' }}>
            Your closet is empty
          </AText>
          <AText variant="small" color="secondary" style={{ textAlign: 'center' }}>
            Scan a few garments and Althea will pack them for your next trip.
          </AText>
        </View>
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two }}>
          {items.map((g) => (
            <View
              key={g.id}
              style={{
                width: '31.5%',
                minWidth: 100,
                borderWidth: 1,
                borderColor: theme.line,
                borderRadius: Radius.md,
                overflow: 'hidden',
                backgroundColor: theme.backgroundElement,
              }}>
              <Swatch garment={g} size={104} />
              <View style={{ padding: 8, gap: 2 }}>
                <AText variant="caption" style={{ fontWeight: '600' }} numberOfLines={1}>
                  {g.name}
                </AText>
                <AText variant="caption" color="secondary" numberOfLines={1}>
                  {g.meta}
                </AText>
              </View>
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}
