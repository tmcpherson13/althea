import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { AButton } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { AText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const ACTIVITIES = ['City walking', 'Nice dinners', 'Beach', 'Hiking', 'Business'];
const LUGGAGE = ['Carry-on only', 'Checked bag', 'Weekender'];

function ChipRow({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (option: string) => void;
}) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
      {options.map((option) => {
        const isSelected = selected.includes(option);
        return (
          <Pressable
            key={option}
            accessibilityRole="button"
            onPress={() => onToggle(option)}
            style={{
              paddingHorizontal: 13,
              paddingVertical: 8,
              borderRadius: Radius.pill,
              borderWidth: 1,
              borderColor: isSelected ? theme.brand : theme.line,
              backgroundColor: isSelected ? theme.brand : theme.backgroundElement,
            }}>
            <AText
              variant="small"
              color={isSelected ? 'onBrand' : 'primary'}
              style={{ fontWeight: isSelected ? '600' : '400' }}>
              {option}
            </AText>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function NewTripScreen() {
  const theme = useTheme();
  const [destination, setDestination] = useState('Lisbon, Portugal');
  const [activities, setActivities] = useState<string[]>(['City walking', 'Nice dinners']);
  const [luggage, setLuggage] = useState<string[]>(['Carry-on only']);

  return (
    <Screen>
      <AText variant="eyebrow" color="secondary" style={{ marginTop: Spacing.two }}>
        Destination
      </AText>
      <TextInput
        value={destination}
        onChangeText={setDestination}
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
        What kind of days?
      </AText>
      <ChipRow
        options={ACTIVITIES}
        selected={activities}
        onToggle={(option) =>
          setActivities((current) =>
            current.includes(option)
              ? current.filter((a) => a !== option)
              : [...current, option]
          )
        }
      />

      <AText variant="eyebrow" color="secondary" style={{ marginTop: Spacing.three }}>
        Luggage
      </AText>
      <ChipRow options={LUGGAGE} selected={luggage} onToggle={(option) => setLuggage([option])} />

      <View style={{ marginTop: Spacing.four, gap: Spacing.two }}>
        <AButton
          label="Build my capsule ✦"
          onPress={() => {
            router.back();
            router.push('/packing');
          }}
        />
        <AText variant="caption" color="secondary" style={{ textAlign: 'center' }}>
          Demo: the engine walkthrough uses the Marrakech plan.
        </AText>
      </View>
    </Screen>
  );
}
