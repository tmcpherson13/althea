import { View } from 'react-native';

import { AText } from '@/components/ui/text';
import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  label: string;
  tone: 'culture' | 'rewear' | 'ok' | 'warn' | 'locked';
};

export function Badge({ label, tone }: Props) {
  const theme = useTheme();
  const palette = {
    culture: { bg: theme.accentSoft, fg: theme.rose },
    rewear: { bg: theme.brandSoft, fg: theme.brand },
    ok: { bg: theme.brandSoft, fg: theme.good },
    warn: { bg: theme.accentSoft, fg: theme.warn },
    locked: { bg: theme.accentSoft, fg: theme.rose },
  }[tone];

  return (
    <View
      style={{
        backgroundColor: palette.bg,
        borderRadius: Radius.pill,
        paddingHorizontal: 9,
        paddingVertical: 4,
        alignSelf: 'flex-start',
      }}>
      <AText variant="caption" style={{ color: palette.fg, fontWeight: '700' }}>
        {label}
      </AText>
    </View>
  );
}
