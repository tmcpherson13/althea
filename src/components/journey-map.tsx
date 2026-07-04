import { View } from 'react-native';
import Svg, { Circle, Line, Polyline, Rect } from 'react-native-svg';

import { Radius } from '@/constants/theme';
import { projectPoints, type GeoPoint } from '@/lib/geo';
import { useTheme } from '@/hooks/use-theme';

/**
 * The journey route drawn in SVG — a dashed path through visited places with
 * pins, fitted to their bounds (no map tiles; that's a later Mapbox upgrade).
 * The final pin is emphasized, echoing "you are here".
 */
export function JourneyMap({
  points,
  width,
  height,
}: {
  points: GeoPoint[];
  width: number;
  height: number;
}) {
  const theme = useTheme();
  const inset = 14;
  const projected = projectPoints(points, width - inset * 2, height - inset * 2, 0.2).map((p) => ({
    x: p.x + inset,
    y: p.y + inset,
  }));
  const poly = projected.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <View style={{ borderRadius: Radius.lg, overflow: 'hidden' }}>
      <Svg width={width} height={height}>
        <Rect width={width} height={height} fill={theme.brandSoft} />

        {/* faint grid for a map feel */}
        {[0.25, 0.5, 0.75].map((f) => (
          <Line key={`v${f}`} x1={width * f} y1={0} x2={width * f} y2={height} stroke={theme.line} strokeWidth={1} />
        ))}
        {[0.33, 0.66].map((f) => (
          <Line key={`h${f}`} x1={0} y1={height * f} x2={width} y2={height * f} stroke={theme.line} strokeWidth={1} />
        ))}

        {projected.length > 1 && (
          <Polyline
            points={poly}
            fill="none"
            stroke={theme.rose}
            strokeWidth={2}
            strokeDasharray="1 6"
            strokeLinecap="round"
          />
        )}

        {projected.map((p, i) => {
          const last = i === projected.length - 1;
          return (
            <Circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={last ? 6 : 4}
              fill={last ? theme.brand : theme.rose}
              stroke={theme.background}
              strokeWidth={2}
            />
          );
        })}
      </Svg>
    </View>
  );
}
