import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, Pressable, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { AButton } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Swatch } from '@/components/ui/swatch';
import { Screen } from '@/components/ui/screen';
import { AText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { capsuleStats } from '@/lib/engine';
import { garmentById, packingGap, packingGroups, trip, wardrobe } from '@/lib/mock';

const packedGarments = wardrobe.filter((g) => g.category !== 'accessory');

export default function PackingScreen() {
  const theme = useTheme();
  const [briefOpen, setBriefOpen] = useState(false);
  const stats = capsuleStats(packedGarments);

  return (
    <Screen>
      <AText variant="small" color="secondary">
        {trip.startsOn} – {trip.endsOn} · {trip.highTempC}°/{trip.lowTempC}° ·{' '}
        {trip.activities.join(', ')}
      </AText>

      {/* Capsule stats */}
      <View
        style={{
          flexDirection: 'row',
          borderWidth: 1,
          borderColor: theme.line,
          borderRadius: Radius.lg,
          overflow: 'hidden',
        }}>
        {(
          [
            [String(stats.items), 'items'],
            [String(stats.outfits), 'outfits'],
            ['100%', 'carry-on'],
          ] as const
        ).map(([value, label], i) => (
          <View
            key={label}
            style={{
              flex: 1,
              paddingVertical: 12,
              alignItems: 'center',
              backgroundColor: theme.backgroundElement,
              borderLeftWidth: i === 0 ? 0 : 1,
              borderLeftColor: theme.line,
            }}>
            <AText variant="title" color="rose" style={{ fontWeight: '700' }}>
              {value}
            </AText>
            <AText variant="caption" color="secondary">
              {label.toUpperCase()}
            </AText>
          </View>
        ))}
      </View>

      {/* Culture briefing */}
      <View
        style={{
          backgroundColor: theme.accentSoft,
          borderRadius: Radius.lg,
          padding: Spacing.three,
          gap: 6,
        }}>
        <AText variant="eyebrow" color="rose">
          ✦ Culture briefing · {trip.country}
        </AText>
        <AText variant="small">{trip.cultureBrief.headline}</AText>
        {briefOpen &&
          trip.cultureBrief.details.map((line) => (
            <AText key={line} variant="small">
              {line}
            </AText>
          ))}
        <Pressable accessibilityRole="button" onPress={() => setBriefOpen((v) => !v)}>
          <AText variant="small" color="rose" style={{ fontWeight: '600' }}>
            {briefOpen ? 'Show less' : 'Read the full briefing'}
          </AText>
        </Pressable>
      </View>

      <AButton
        label={`View Lookbook — ${stats.outfits} looks, mix & match`}
        kind="soft"
        onPress={() => router.push('/lookbook')}
      />

      {/* Packing groups */}
      {packingGroups.map((group) => (
        <View key={group.title}>
          <AText variant="eyebrow" color="secondary" style={{ marginBottom: Spacing.two }}>
            {group.title}
          </AText>
          <Card style={{ gap: Spacing.two }}>
            {group.lines.map((line) => {
              const garment = garmentById(line.garmentId);
              return (
                <View
                  key={line.garmentId}
                  style={{ flexDirection: 'row', gap: Spacing.two, alignItems: 'center' }}>
                  <Swatch garment={garment} />
                  <View style={{ flex: 1 }}>
                    <AText style={{ fontWeight: '600' }}>{garment.name}</AText>
                    <AText variant="caption" color="secondary">
                      {line.why}
                    </AText>
                  </View>
                  {line.badge === 'culture' && <Badge label="Culture-ready" tone="culture" />}
                  {line.badge === 'rewear' && <Badge label="Re-wears" tone="rewear" />}
                </View>
              );
            })}
          </Card>
        </View>
      ))}

      {/* Gap list */}
      <AText variant="eyebrow" color="secondary">
        You don&apos;t own these yet
      </AText>
      <View
        style={{
          borderWidth: 1,
          borderColor: theme.warn,
          borderRadius: Radius.lg,
          padding: Spacing.three,
          gap: 6,
        }}>
        <AText style={{ fontWeight: '600' }}>{packingGap.name}</AText>
        <AText variant="caption" color="secondary">
          {packingGap.why}
        </AText>
        <AButton
          label={packingGap.cta}
          onPress={() => {
            const msg =
              'Phase 1 wiring: opens size-filtered options via affiliate partners.';
            if (Platform.OS === 'web') {
              window.alert(msg);
            } else {
              Alert.alert('Shop the gap', msg);
            }
          }}
        />
      </View>
    </Screen>
  );
}
