import { Text, type TextProps } from 'react-native';

import { Fonts, Type } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Variant = 'display' | 'title' | 'body' | 'small' | 'caption' | 'eyebrow';

type Props = TextProps & {
  variant?: Variant;
  color?: 'primary' | 'secondary' | 'rose' | 'brand' | 'onBrand';
};

export function AText({ variant = 'body', color = 'primary', style, ...rest }: Props) {
  const theme = useTheme();
  const colorValue = {
    primary: theme.text,
    secondary: theme.textSecondary,
    rose: theme.rose,
    brand: theme.brand,
    onBrand: theme.onBrand,
  }[color];

  const variantStyle = {
    display: {
      fontFamily: Fonts?.serif,
      fontSize: Type.display,
      fontWeight: '500' as const,
      lineHeight: Type.display * 1.22,
    },
    title: {
      fontFamily: Fonts?.serif,
      fontSize: Type.title,
      fontWeight: '500' as const,
      lineHeight: Type.title * 1.25,
    },
    body: { fontSize: Type.body, lineHeight: Type.body * 1.45 },
    small: { fontSize: Type.small, lineHeight: Type.small * 1.45 },
    caption: { fontSize: Type.caption, lineHeight: Type.caption * 1.4 },
    eyebrow: {
      fontSize: Type.eyebrow,
      fontWeight: '700' as const,
      letterSpacing: 2.2,
      textTransform: 'uppercase' as const,
    },
  }[variant];

  return <Text style={[{ color: colorValue }, variantStyle, style]} {...rest} />;
}
