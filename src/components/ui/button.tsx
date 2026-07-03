import { Pressable, type PressableProps } from 'react-native';

import { AText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = Omit<PressableProps, 'children'> & {
  label: string;
  kind?: 'primary' | 'soft' | 'ghost';
};

export function AButton({ label, kind = 'primary', style, ...rest }: Props) {
  const theme = useTheme();
  const background = {
    primary: theme.brand,
    soft: theme.accentSoft,
    ghost: 'transparent',
  }[kind];
  const labelColor = kind === 'primary' ? 'onBrand' : 'rose';

  return (
    <Pressable
      accessibilityRole="button"
      style={(state) => [
        {
          backgroundColor: background,
          borderRadius: Radius.md,
          paddingVertical: 13,
          paddingHorizontal: Spacing.three,
          alignItems: 'center',
          opacity: state.pressed ? 0.85 : 1,
        },
        typeof style === 'function' ? style(state) : style,
      ]}
      {...rest}>
      <AText variant="body" color={labelColor} style={{ fontWeight: '700' }}>
        {label}
      </AText>
    </Pressable>
  );
}
