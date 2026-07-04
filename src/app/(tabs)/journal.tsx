import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { JourneyMap } from '@/components/journey-map';
import { AButton } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { AText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatShort } from '@/lib/data';
import { signedUrls, useJournal, type JournalEntry } from '@/lib/journal';
import type { GeoPoint } from '@/lib/geo';

/** A little illustrative journey so the demo tab isn't empty. */
const DEMO_POINTS: GeoPoint[] = [
  { latitude: 31.63, longitude: -8.0 }, // Marrakech
  { latitude: 38.72, longitude: -9.14 }, // Lisbon
  { latitude: 40.63, longitude: 14.6 }, // Amalfi
  { latitude: 36.39, longitude: 25.46 }, // Santorini
];

function EntryCard({ entry, url }: { entry: JournalEntry; url?: string }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/journal-entry', params: { id: entry.id } })}
      style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
      <Card style={{ flexDirection: 'row', gap: Spacing.two, alignItems: 'center', padding: Spacing.two }}>
        <View style={{ width: 60, height: 60, borderRadius: Radius.md, overflow: 'hidden', backgroundColor: theme.brandSoft }}>
          {url ? (
            <Image source={{ uri: url }} style={{ width: 60, height: 60 }} contentFit="cover" transition={150} />
          ) : null}
        </View>
        <View style={{ flex: 1 }}>
          <AText style={{ fontWeight: '600' }} numberOfLines={1}>
            {entry.placeName || 'Untitled moment'}
          </AText>
          <AText variant="caption" color="secondary">
            {entry.takenAt ? formatShort(entry.takenAt.slice(0, 10)) : ''}
          </AText>
          {entry.caption ? (
            <AText variant="caption" color="secondary" numberOfLines={2} style={{ marginTop: 2 }}>
              {entry.caption}
            </AText>
          ) : null}
        </View>
      </Card>
    </Pressable>
  );
}

export default function JournalScreen() {
  const theme = useTheme();
  const { entries, loading, live, refresh } = useJournal();
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [width, setWidth] = useState(320);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  useEffect(() => {
    const paths = entries.flatMap((e) => e.mediaPaths);
    if (paths.length === 0) return;
    let active = true;
    void signedUrls(paths).then((m) => {
      if (active) setUrls(m);
    });
    return () => {
      active = false;
    };
  }, [entries]);

  // Demo: show an illustrative journey and explain the feature.
  if (!live) {
    return (
      <Screen>
        <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
          <JourneyMap points={DEMO_POINTS} width={width} height={200} />
        </View>
        <AText variant="title" style={{ marginTop: Spacing.three }}>
          Your travel journal
        </AText>
        <AText variant="small" color="secondary">
          Record moments as you go — a photo, a place, a note — and Althea maps your journey and
          turns it into a share-ready recap. Available in the signed-in app.
        </AText>
      </Screen>
    );
  }

  if (loading) {
    return (
      <Screen>
        <View style={{ paddingVertical: Spacing.six, alignItems: 'center' }}>
          <ActivityIndicator color={theme.rose} />
        </View>
      </Screen>
    );
  }

  const points: GeoPoint[] = entries
    .filter((e) => e.latitude != null && e.longitude != null)
    .map((e) => ({ latitude: e.latitude as number, longitude: e.longitude as number }));

  return (
    <Screen>
      <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {points.length > 0 ? (
          <JourneyMap points={points} width={width} height={200} />
        ) : (
          <View
            style={{
              height: 160,
              borderRadius: Radius.lg,
              borderWidth: 1,
              borderColor: theme.line,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: theme.brandSoft,
            }}>
            <AText variant="small" color="secondary">
              Your map fills in as you add moments.
            </AText>
          </View>
        )}
      </View>

      <View style={{ flexDirection: 'row', gap: Spacing.two }}>
        <View style={{ flex: 1 }}>
          <AButton label="+ Add moment" onPress={() => router.push('/journal-entry')} />
        </View>
        {entries.length > 0 && (
          <View style={{ flex: 1 }}>
            <AButton label="Share journey ✦" kind="soft" onPress={() => router.push('/journey-share')} />
          </View>
        )}
      </View>

      {entries.length === 0 ? (
        <View style={{ paddingVertical: Spacing.four, alignItems: 'center', gap: Spacing.one }}>
          <AText variant="title" style={{ textAlign: 'center' }}>
            Start your journal
          </AText>
          <AText variant="small" color="secondary" style={{ textAlign: 'center' }}>
            Add your first moment — a photo and where you were.
          </AText>
        </View>
      ) : (
        <View style={{ gap: Spacing.two }}>
          {entries.map((e) => (
            <EntryCard key={e.id} entry={e} url={e.mediaPaths[0] ? urls[e.mediaPaths[0]] : undefined} />
          ))}
        </View>
      )}
    </Screen>
  );
}
