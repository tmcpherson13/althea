import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Swatch } from '@/components/ui/swatch';
import { Screen } from '@/components/ui/screen';
import { AText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { validateOutfit } from '@/lib/engine';
import { garmentById, slotAlternates, trip } from '@/lib/mock';
import type { DayPlan, OutfitSlot } from '@/lib/types';

/** One day's outfit with tap-to-swap slots, validated live by the engine. */
function DayCard({ day }: { day: DayPlan }) {
  const theme = useTheme();
  const [slots, setSlots] = useState(day.slots);

  const items = Object.values(slots).map((id) => garmentById(id!));
  const verdict = validateOutfit(items, day);

  const swap = (slot: OutfitSlot) => {
    const pool = slotAlternates[slot];
    if (!pool) return;
    setSlots((current) => {
      const currentId = current[slot]!;
      const next = pool[(pool.indexOf(currentId) + 1) % pool.length];
      return { ...current, [slot]: next };
    });
  };

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
        {(Object.keys(slots) as OutfitSlot[]).map((slot) => {
          const garment = garmentById(slots[slot]!);
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

      <Badge
        label={`${verdict.level === 'ok' ? '✓' : '△'} ${verdict.message}`}
        tone={verdict.level}
      />
    </Card>
  );
}

export default function LookbookScreen() {
  return (
    <Screen>
      <AText variant="small" color="secondary">
        Tap any piece to swap it — Althea re-checks weather &amp; dress norms live.
      </AText>
      {trip.days.map((day) => (
        <DayCard key={day.id} day={day} />
      ))}
    </Screen>
  );
}
