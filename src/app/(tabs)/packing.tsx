import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { AButton } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Swatch } from '@/components/ui/swatch';
import { Screen } from '@/components/ui/screen';
import { AText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useActiveTrip, usePlan } from '@/lib/data';
import type { Gap } from '@/lib/types';

function notify(title: string, message: string) {
  if (Platform.OS === 'web') window.alert(`${title}\n\n${message}`);
  else Alert.alert(title, message);
}

function GapCard({ gap }: { gap: Gap }) {
  const theme = useTheme();
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: theme.warn,
        borderRadius: Radius.lg,
        padding: Spacing.three,
        gap: 6,
      }}>
      <AText style={{ fontWeight: '600' }}>{gap.name}</AText>
      <AText variant="caption" color="secondary">
        {gap.why}
      </AText>
      <AButton
        label={gap.cta}
        onPress={() => notify('Shop the gap', 'Phase 1 wiring: opens size-filtered options via affiliate partners.')}
      />
    </View>
  );
}

export default function PackingScreen() {
  const theme = useTheme();
  const { plan, loading, needsWardrobe } = usePlan();
  const { refresh } = useActiveTrip();
  const [briefOpen, setBriefOpen] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  if (loading) {
    return (
      <Screen>
        <View style={{ paddingVertical: Spacing.six, alignItems: 'center' }}>
          <ActivityIndicator color={theme.rose} />
        </View>
      </Screen>
    );
  }

  if (needsWardrobe) {
    return (
      <Screen>
        <View style={{ paddingVertical: Spacing.five, gap: Spacing.two, alignItems: 'center' }}>
          <AText variant="title" style={{ textAlign: 'center' }}>
            Scan your closet first
          </AText>
          <AText variant="small" color="secondary" style={{ textAlign: 'center' }}>
            Althea packs from clothes you own — add a few garments and your capsule appears here.
          </AText>
          <AButton label="Scan a garment" onPress={() => router.push('/scan')} />
        </View>
      </Screen>
    );
  }

  if (!plan) {
    return (
      <Screen>
        <View style={{ paddingVertical: Spacing.five, gap: Spacing.two, alignItems: 'center' }}>
          <AText variant="title" style={{ textAlign: 'center' }}>
            No trip yet
          </AText>
          <AText variant="small" color="secondary" style={{ textAlign: 'center' }}>
            Tell Althea where you&apos;re going and she&apos;ll build your capsule.
          </AText>
          <AButton label="Plan a trip" onPress={() => router.push('/new-trip')} />
        </View>
      </Screen>
    );
  }

  const { trip, stats, groups, gaps, garments } = plan;

  return (
    <Screen>
      <AText variant="title" style={{ marginTop: Spacing.two }}>
        {trip.city} capsule
      </AText>
      <AText variant="small" color="secondary">
        {trip.startsOn} – {trip.endsOn} · {trip.highTempC}°/{trip.lowTempC}° ·{' '}
        {trip.activities.join(', ')}
      </AText>

      {/* Capsule stats — honest wearable count headline, combinatorial as "up to". */}
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
            [String(stats.wearableLooks), 'looks'],
            [stats.carryOnFit ? '100%' : 'checked', 'carry-on'],
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
        style={{ backgroundColor: theme.accentSoft, borderRadius: Radius.lg, padding: Spacing.three, gap: 6 }}>
        <AText variant="eyebrow" color="rose">
          ✦ Culture briefing · {trip.country || trip.city}
        </AText>
        <AText variant="small">{trip.cultureBrief.headline}</AText>
        {briefOpen &&
          trip.cultureBrief.details.map((line) => (
            <AText key={line} variant="small">
              {line}
            </AText>
          ))}
        {trip.cultureBrief.details.length > 0 && (
          <Pressable accessibilityRole="button" onPress={() => setBriefOpen((v) => !v)}>
            <AText variant="small" color="rose" style={{ fontWeight: '600' }}>
              {briefOpen ? 'Show less' : 'Read the full briefing'}
            </AText>
          </Pressable>
        )}
      </View>

      <AButton
        label={`View Lookbook — up to ${stats.combinatorialOutfits} combinations`}
        kind="soft"
        onPress={() => router.push('/lookbook')}
      />

      {/* Packing groups */}
      {groups.map((group) => (
        <View key={group.title}>
          <AText variant="eyebrow" color="secondary" style={{ marginBottom: Spacing.two }}>
            {group.title}
          </AText>
          <Card style={{ gap: Spacing.two }}>
            {group.lines.map((line) => {
              const garment = garments[line.garmentId];
              if (!garment) return null;
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

      {/* Gaps */}
      {gaps.length > 0 && (
        <>
          <AText variant="eyebrow" color="secondary">
            You don&apos;t own these yet
          </AText>
          <View style={{ gap: Spacing.two }}>
            {gaps.map((gap) => (
              <GapCard key={gap.name} gap={gap} />
            ))}
          </View>
        </>
      )}
    </Screen>
  );
}
