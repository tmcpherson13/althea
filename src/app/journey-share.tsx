import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useRef, useState } from 'react';
import { Platform, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

import { JourneyCard } from '@/components/journey-card';
import { AButton } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { AText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { formatShort } from '@/lib/data';
import { useJournal } from '@/lib/journal';
import { journeyBlock } from '@/lib/share';
import { useTheme } from '@/hooks/use-theme';
import type { GeoPoint } from '@/lib/geo';

export default function JourneyShareScreen() {
  const theme = useTheme();
  const { entries } = useJournal();
  const cardRef = useRef<View>(null);
  const [status, setStatus] = useState<string | null>(null);

  const points: GeoPoint[] = entries
    .filter((e) => e.latitude != null && e.longitude != null)
    .map((e) => ({ latitude: e.latitude as number, longitude: e.longitude as number }));
  const places = entries.filter((e) => e.placeName).map((e) => e.placeName);
  const photos = entries.reduce((n, e) => n + e.mediaPaths.length, 0);

  const dates = entries.map((e) => e.takenAt.slice(0, 10)).filter(Boolean).sort();
  const dateLabel =
    dates.length > 0
      ? dates.length === 1 || dates[0] === dates[dates.length - 1]
        ? formatShort(dates[0])
        : `${formatShort(dates[0])} – ${formatShort(dates[dates.length - 1])}`
      : '';
  const title = places.length > 1 ? `${places[0].split(',')[0]} → ${places[places.length - 1].split(',')[0]}` : 'My journey';

  if (entries.length === 0) {
    return (
      <Screen>
        <View style={{ paddingVertical: Spacing.five, gap: Spacing.two, alignItems: 'center' }}>
          <AText variant="title">Nothing to share yet</AText>
          <AText variant="small" color="secondary" style={{ textAlign: 'center' }}>
            Add a few moments to your journal, then share your journey.
          </AText>
          <AButton label="Back" kind="soft" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  const caption = journeyBlock({ places, photoCount: photos });

  const copy = async () => {
    await Clipboard.setStringAsync(caption);
    setStatus('Caption copied — paste it with your post.');
  };

  const share = async () => {
    setStatus(null);
    try {
      if (Platform.OS === 'web') {
        const nav = (globalThis as { navigator?: { share?: (d: { text: string }) => Promise<void> } })
          .navigator;
        if (nav?.share) await nav.share({ text: caption });
        else await copy();
        return;
      }
      const uri = await captureRef(cardRef, { format: 'png', quality: 0.95 });
      if (!(await Sharing.isAvailableAsync())) {
        setStatus('Sharing is unavailable on this device.');
        return;
      }
      await Clipboard.setStringAsync(caption);
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share your journey' });
      setStatus('Caption copied to your clipboard — paste it with your post.');
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Could not share.');
    }
  };

  return (
    <Screen>
      <View style={{ alignItems: 'center', gap: Spacing.three, paddingTop: Spacing.two }}>
        <JourneyCard ref={cardRef} points={points} places={places.length} photos={photos} dateLabel={dateLabel} title={title} />

        <View style={{ width: '100%', gap: Spacing.two }}>
          <AButton label="Share your journey" onPress={share} />
          <AButton label="Copy caption" kind="soft" onPress={copy} />
          {status && (
            <AText variant="caption" color="rose" style={{ textAlign: 'center' }}>
              {status}
            </AText>
          )}
        </View>

        <View
          style={{
            width: '100%',
            borderWidth: 1,
            borderColor: theme.line,
            borderRadius: Radius.md,
            padding: Spacing.three,
            backgroundColor: theme.backgroundElement,
          }}>
          <AText variant="eyebrow" color="secondary" style={{ marginBottom: 6 }}>
            Caption
          </AText>
          <AText variant="caption" color="secondary" selectable>
            {caption}
          </AText>
        </View>
      </View>
    </Screen>
  );
}
