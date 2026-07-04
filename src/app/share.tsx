import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useRef, useState } from 'react';
import { Platform, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

import { ShareCard } from '@/components/share-card';
import { AButton } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { AText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { usePlan } from '@/lib/data';
import { shareBlock } from '@/lib/share';
import { useTheme } from '@/hooks/use-theme';

export default function ShareScreen() {
  const theme = useTheme();
  const { plan } = usePlan();
  const cardRef = useRef<View>(null);
  const [status, setStatus] = useState<string | null>(null);

  if (!plan) {
    return (
      <Screen>
        <View style={{ paddingVertical: Spacing.five, gap: Spacing.two, alignItems: 'center' }}>
          <AText variant="title" style={{ textAlign: 'center' }}>
            Nothing to share yet
          </AText>
          <AText variant="small" color="secondary" style={{ textAlign: 'center' }}>
            Build a capsule for a trip, then share your board.
          </AText>
          <AButton label="Back" kind="soft" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  const caption = shareBlock(plan);

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
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: 'Share your Althea board',
      });
      setStatus('Caption copied to your clipboard — paste it with your post.');
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Could not share.');
    }
  };

  return (
    <Screen>
      <View style={{ alignItems: 'center', gap: Spacing.three, paddingTop: Spacing.two }}>
        <ShareCard ref={cardRef} plan={plan} />

        <View style={{ width: '100%', gap: Spacing.two }}>
          <AButton label="Share your board" onPress={share} />
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
