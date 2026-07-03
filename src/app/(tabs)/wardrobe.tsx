import { Alert, Platform, View } from 'react-native';

import { AButton } from '@/components/ui/button';
import { Swatch } from '@/components/ui/swatch';
import { Screen } from '@/components/ui/screen';
import { AText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { wardrobe } from '@/lib/mock';
import { isLive } from '@/lib/supabase';

function notify(title: string, message: string) {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
}

export default function WardrobeScreen() {
  const theme = useTheme();
  return (
    <Screen>
      <AText variant="small" color="secondary">
        {wardrobe.length} items catalogued · 11 packed for Marrakech
        {isLive ? '' : ' · demo data'}
      </AText>

      <AButton
        label="Scan a garment"
        onPress={() =>
          notify(
            'Wardrobe scanning',
            'Phase 1 wiring: the camera opens, Althea photographs the garment and the scan-item function returns category, colors, fabric and coverage for one-tap confirm.'
          )
        }
      />

      <AText variant="eyebrow" color="secondary" style={{ marginTop: Spacing.three }}>
        Recently added
      </AText>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two }}>
        {wardrobe.map((g) => (
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
    </Screen>
  );
}
