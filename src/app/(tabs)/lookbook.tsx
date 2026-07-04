import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { AButton } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Swatch } from '@/components/ui/swatch';
import { Screen } from '@/components/ui/screen';
import { AText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { validateOutfit } from '@/lib/engine';
import { usePlan } from '@/lib/data';
import type { DayPlan, Garment, OutfitSlot, Plan } from '@/lib/types';

/** One day's outfit with tap-to-swap slots, validated live by the engine. */
function DayCard({
  day,
  garments,
  alternates,
}: {
  day: DayPlan;
  garments: Record<string, Garment>;
  alternates: Plan['slotAlternates'];
}) {
  const theme = useTheme();
  const [slots, setSlots] = useState(day.slots);

  const items = Object.values(slots)
    .map((id) => (id ? garments[id] : undefined))
    .filter((g): g is Garment => Boolean(g));
  const verdict = validateOutfit(items, day);

  const swap = (slot: OutfitSlot) => {
    const pool = alternates[slot];
    if (!pool || pool.length < 2) return;
    setSlots((current) => {
      const currentId = current[slot];
      const idx = currentId ? pool.indexOf(currentId) : -1;
      return { ...current, [slot]: pool[(idx + 1) % pool.length] };
    });
  };

  const slotKeys = Object.keys(slots) as OutfitSlot[];

  return (
    <Card style={{ gap: Spacing.two }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <AText variant="title" style={{ fontSize: 17 }}>
          {day.title}
        </AText>
        <AText variant="caption" color="secondary">
          {day.isEvening ? '🌙' : '☀'} {day.tempC}°
        </AText>
      </View>

      <View
        style={{
          flexDirection: 'row',
          gap: Spacing.two,
          backgroundColor: theme.background,
          borderRadius: Radius.md,
          padding: Spacing.two,
        }}>
        {slotKeys.map((slot) => {
          const id = slots[slot];
          const garment = id ? garments[id] : undefined;
          if (!garment) return null;
          return (
            <Pressable
              key={slot}
              accessibilityRole="button"
              accessibilityLabel={`Swap ${slot}: ${garment.name}`}
              onPress={() => swap(slot)}
              style={({ pressed }) => ({
                flex: 1,
                alignItems: 'center',
                gap: 5,
                transform: [{ scale: pressed ? 0.96 : 1 }],
              })}>
              <Swatch garment={garment} size={72} />
              <AText variant="caption" color="secondary" numberOfLines={1}>
                {garment.name.split(' ').slice(-2).join(' ')}
              </AText>
            </Pressable>
          );
        })}
      </View>

      <Badge label={`${verdict.level === 'ok' ? '✓' : '△'} ${verdict.message}`} tone={verdict.level} />
    </Card>
  );
}

export default function LookbookScreen() {
  const theme = useTheme();
  const { plan, loading, needsWardrobe } = usePlan();

  if (loading) {
    return (
      <Screen>
        <View style={{ paddingVertical: Spacing.six, alignItems: 'center' }}>
          <ActivityIndicator color={theme.rose} />
        </View>
      </Screen>
    );
  }

  if (!plan) {
    return (
      <Screen>
        <View style={{ paddingVertical: Spacing.five, gap: Spacing.two, alignItems: 'center' }}>
          <AText variant="title" style={{ textAlign: 'center' }}>
            {needsWardrobe ? 'Scan your closet first' : 'No trip yet'}
          </AText>
          <AText variant="small" color="secondary" style={{ textAlign: 'center' }}>
            {needsWardrobe
              ? 'Add a few garments and your outfits appear here.'
              : 'Plan a trip and Althea styles each day.'}
          </AText>
          <AButton
            label={needsWardrobe ? 'Scan a garment' : 'Plan a trip'}
            onPress={() => router.push(needsWardrobe ? '/scan' : '/new-trip')}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <AText variant="small" color="secondary">
        Tap any piece to swap it — Althea re-checks weather &amp; dress norms live.
      </AText>
      {plan.trip.days.map((day) => (
        <DayCard key={day.id} day={day} garments={plan.garments} alternates={plan.slotAlternates} />
      ))}
    </Screen>
  );
}
