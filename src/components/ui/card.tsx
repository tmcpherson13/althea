import { View, type ViewProps } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function Card({ style, ...rest }: ViewProps) {
  const theme = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: theme.backgroundElement,
          borderColor: theme.line,
          borderWidth: 1,
          borderRadius: Radius.lg,
          padding: Spacing.three,
        },
        style,
      ]}
      {...rest}
    />
  );
}
