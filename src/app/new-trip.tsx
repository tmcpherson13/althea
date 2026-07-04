import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { AButton } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { AText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth';
import { createTrip } from '@/lib/data';

const ACTIVITIES = ['City walking', 'Nice dinners', 'Beach', 'Hiking', 'Business', 'Religious sites'];
const LUGGAGE: { label: string; value: string }[] = [
  { label: 'Carry-on only', value: 'carry-on' },
  { label: 'Checked bag', value: 'checked' },
  { label: 'Weekender', value: 'weekender' },
];
const WHEN: { label: string; offset: number }[] = [
  { label: 'In 2 weeks', offset: 14 },
  { label: 'Next month', offset: 45 },
  { label: 'In 3 months', offset: 90 },
];

function addDaysISO(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{
        paddingHorizontal: 13,
        paddingVertical: 8,
        borderRadius: Radius.pill,
        borderWidth: 1,
        borderColor: selected ? theme.brand : theme.line,
        backgroundColor: selected ? theme.brand : theme.backgroundElement,
      }}>
      <AText
        variant="small"
        color={selected ? 'onBrand' : 'primary'}
        style={{ fontWeight: selected ? '600' : '400' }}>
        {label}
      </AText>
    </Pressable>
  );
}

export default function NewTripScreen() {
  const theme = useTheme();
  const { requiresAuth, user } = useAuth();
  const live = requiresAuth && Boolean(user);

  const [destination, setDestination] = useState('Lisbon, Portugal');
  const [activities, setActivities] = useState<string[]>(['City walking', 'Nice dinners']);
  const [luggage, setLuggage] = useState('carry-on');
  const [whenOffset, setWhenOffset] = useState(14);
  const [nights, setNights] = useState(5);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const build = async () => {
    // Demo mode: no persistence — walk through the Marrakech plan.
    if (!live || !user) {
      router.back();
      router.push('/packing');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const startISO = addDaysISO(whenOffset);
      const endISO = addDaysISO(whenOffset + nights);
      await createTrip(user.id, { destination, startISO, endISO, activities, luggage });
      router.back();
      router.push('/packing');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create the trip.');
      setBusy(false);
    }
  };

  return (
    <Screen>
      <AText variant="eyebrow" color="secondary" style={{ marginTop: Spacing.two }}>
        Destination
      </AText>
      <TextInput
        value={destination}
        onChangeText={setDestination}
        placeholder="City, Country"
        placeholderTextColor={theme.textSecondary}
        accessibilityLabel="Destination"
        style={{
          borderWidth: 1,
          borderColor: theme.line,
          borderRadius: Radius.md,
          padding: 12,
          fontSize: 14,
          color: theme.text,
          backgroundColor: theme.backgroundElement,
        }}
      />

      <AText variant="eyebrow" color="secondary" style={{ marginTop: Spacing.three }}>
        When?
      </AText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
        {WHEN.map((w) => (
          <Chip
            key={w.label}
            label={w.label}
            selected={whenOffset === w.offset}
            onPress={() => setWhenOffset(w.offset)}
          />
        ))}
      </View>

      <AText variant="eyebrow" color="secondary" style={{ marginTop: Spacing.three }}>
        Nights
      </AText>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.three }}>
        <AButton label="–" kind="soft" onPress={() => setNights((n) => Math.max(1, n - 1))} style={{ paddingHorizontal: 22 }} />
        <AText variant="title" style={{ minWidth: 32, textAlign: 'center' }}>
          {nights}
        </AText>
        <AButton label="+" kind="soft" onPress={() => setNights((n) => Math.min(30, n + 1))} style={{ paddingHorizontal: 22 }} />
      </View>

      <AText variant="eyebrow" color="secondary" style={{ marginTop: Spacing.three }}>
        What kind of days?
      </AText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
        {ACTIVITIES.map((a) => (
          <Chip
            key={a}
            label={a}
            selected={activities.includes(a)}
            onPress={() =>
              setActivities((cur) => (cur.includes(a) ? cur.filter((x) => x !== a) : [...cur, a]))
            }
          />
        ))}
      </View>

      <AText variant="eyebrow" color="secondary" style={{ marginTop: Spacing.three }}>
        Luggage
      </AText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
        {LUGGAGE.map((l) => (
          <Chip key={l.value} label={l.label} selected={luggage === l.value} onPress={() => setLuggage(l.value)} />
        ))}
      </View>

      {error && (
        <AText variant="caption" style={{ color: theme.warn, marginTop: Spacing.two }}>
          {error}
        </AText>
      )}

      <View style={{ marginTop: Spacing.four, gap: Spacing.two }}>
        <AButton
          label={busy ? 'Building your capsule…' : 'Build my capsule ✦'}
          onPress={build}
          disabled={busy}
          style={{ opacity: busy ? 0.6 : 1 }}
        />
        {!live && (
          <AText variant="caption" color="secondary" style={{ textAlign: 'center' }}>
            Demo: the engine walkthrough uses the Marrakech plan.
          </AText>
        )}
      </View>
    </Screen>
  );
}
