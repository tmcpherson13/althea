import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, Switch, TextInput, View } from 'react-native';

import { AButton } from '@/components/ui/button';
import { Swatch } from '@/components/ui/swatch';
import { Screen } from '@/components/ui/screen';
import { AText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { saveGarment, scanGarment, useWardrobe, type ScannedGarment } from '@/lib/data';
import { FREE_LIMITS, useEntitlement } from '@/lib/entitlement';
import { isLive } from '@/lib/supabase';
import { useTheme } from '@/hooks/use-theme';
import type { Garment, GarmentCategory } from '@/lib/types';

const CATEGORIES: GarmentCategory[] = ['top', 'bottom', 'dress', 'layer', 'shoe', 'accessory'];

type Phase = 'pick' | 'scanning' | 'confirm' | 'saving';

/** Adapt a scanned garment into the Garment shape the Swatch preview expects. */
function toPreview(g: ScannedGarment): Garment {
  return {
    id: 'preview',
    name: g.name,
    category: g.category,
    colors: [g.colors?.[0] ?? '#C9C3B6', g.colors?.[1] ?? g.colors?.[0] ?? '#9A948A'],
    fabric: g.fabric ?? '',
    breathability: 3,
    formality: 3,
    coverage: g.coverage,
    meta: g.fabric ?? '',
  };
}

export default function ScanScreen() {
  const theme = useTheme();
  const { user } = useAuth();
  const { items } = useWardrobe();
  const { plus } = useEntitlement();
  const [phase, setPhase] = useState<Phase>('pick');
  const [error, setError] = useState<string | null>(null);
  const [g, setG] = useState<ScannedGarment | null>(null);

  const canScan = isLive && Boolean(user);
  const atItemLimit = canScan && !plus && items.length >= FREE_LIMITS.wardrobeItems;

  const runScan = async (source: 'camera' | 'library') => {
    setError(null);
    const perm =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setError('Please allow photo access to scan a garment.');
      return;
    }
    const opts: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.5,
      base64: true,
    };
    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync(opts)
        : await ImagePicker.launchImageLibraryAsync(opts);
    if (result.canceled || !result.assets[0]?.base64) return;

    setPhase('scanning');
    try {
      const scanned = await scanGarment(result.assets[0].base64);
      setG(scanned);
      setPhase('confirm');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Scan failed.');
      setPhase('pick');
    }
  };

  const save = async () => {
    if (!g || !user) return;
    setPhase('saving');
    setError(null);
    try {
      await saveGarment(user.id, g);
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save.');
      setPhase('confirm');
    }
  };

  // Demo mode / signed-out: scanning needs the live backend.
  if (!canScan) {
    return (
      <Screen>
        <View style={{ paddingVertical: Spacing.five, gap: Spacing.two, alignItems: 'center' }}>
          <AText variant="title" style={{ textAlign: 'center' }}>
            Scanning needs the live app
          </AText>
          <AText variant="small" color="secondary" style={{ textAlign: 'center' }}>
            Wardrobe scanning uploads to your private closet, so it runs in the signed-in app
            rather than the demo.
          </AText>
          <AButton label="Back" kind="soft" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  if (phase === 'scanning' || phase === 'saving') {
    return (
      <Screen>
        <View style={{ paddingVertical: Spacing.six, alignItems: 'center', gap: Spacing.three }}>
          <ActivityIndicator color={theme.rose} />
          <AText variant="small" color="secondary">
            {phase === 'scanning' ? 'Reading the garment…' : 'Saving to your closet…'}
          </AText>
        </View>
      </Screen>
    );
  }

  if (phase === 'confirm' && g) {
    return (
      <Screen>
        <View style={{ flexDirection: 'row', gap: Spacing.two, alignItems: 'center' }}>
          <Swatch garment={toPreview(g)} size={64} />
          <View style={{ flex: 1 }}>
            <AText variant="eyebrow" color="secondary">
              Confirm & save
            </AText>
            <AText variant="small" color="secondary">
              Tweak anything Althea got wrong, then save.
            </AText>
          </View>
        </View>

        <AText variant="eyebrow" color="secondary" style={{ marginTop: Spacing.three }}>
          Name
        </AText>
        <TextInput
          value={g.name}
          onChangeText={(name) => setG({ ...g, name })}
          accessibilityLabel="Garment name"
          style={{
            borderWidth: 1,
            borderColor: theme.line,
            borderRadius: Radius.md,
            padding: 12,
            fontSize: 15,
            color: theme.text,
            backgroundColor: theme.backgroundElement,
          }}
        />

        <AText variant="eyebrow" color="secondary" style={{ marginTop: Spacing.three }}>
          Category
        </AText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
          {CATEGORIES.map((cat) => {
            const sel = g.category === cat;
            return (
              <Pressable
                key={cat}
                accessibilityRole="button"
                onPress={() => setG({ ...g, category: cat })}
                style={{
                  paddingHorizontal: 13,
                  paddingVertical: 8,
                  borderRadius: Radius.pill,
                  borderWidth: 1,
                  borderColor: sel ? theme.brand : theme.line,
                  backgroundColor: sel ? theme.brand : theme.backgroundElement,
                }}>
                <AText
                  variant="small"
                  color={sel ? 'onBrand' : 'primary'}
                  style={{ fontWeight: sel ? '600' : '400', textTransform: 'capitalize' }}>
                  {cat}
                </AText>
              </Pressable>
            );
          })}
        </View>

        <AText variant="eyebrow" color="secondary" style={{ marginTop: Spacing.three }}>
          Fabric
        </AText>
        <TextInput
          value={g.fabric ?? ''}
          onChangeText={(fabric) => setG({ ...g, fabric })}
          placeholder="e.g. Linen"
          placeholderTextColor={theme.textSecondary}
          accessibilityLabel="Fabric"
          style={{
            borderWidth: 1,
            borderColor: theme.line,
            borderRadius: Radius.md,
            padding: 12,
            fontSize: 15,
            color: theme.text,
            backgroundColor: theme.backgroundElement,
          }}
        />

        <AText variant="eyebrow" color="secondary" style={{ marginTop: Spacing.three }}>
          Coverage — matters for culture-aware packing
        </AText>
        <View style={{ gap: Spacing.two }}>
          {(['shoulders', 'knees'] as const).map((key) => (
            <View
              key={key}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderWidth: 1,
                borderColor: theme.line,
                borderRadius: Radius.md,
                paddingHorizontal: Spacing.three,
                paddingVertical: 10,
                backgroundColor: theme.backgroundElement,
              }}>
              <AText variant="small" style={{ textTransform: 'capitalize' }}>
                Covers {key}
              </AText>
              <Switch
                value={g.coverage[key]}
                onValueChange={(v) => setG({ ...g, coverage: { ...g.coverage, [key]: v } })}
                trackColor={{ true: theme.rose, false: theme.line }}
              />
            </View>
          ))}
        </View>

        {error && (
          <AText variant="caption" style={{ color: theme.warn, marginTop: Spacing.two }}>
            {error}
          </AText>
        )}

        <View style={{ marginTop: Spacing.four, gap: Spacing.two }}>
          <AButton label="Save to closet" onPress={save} />
          <AButton label="Discard" kind="ghost" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  // phase === 'pick'
  if (atItemLimit) {
    return (
      <Screen>
        <View style={{ paddingVertical: Spacing.five, gap: Spacing.two, alignItems: 'center' }}>
          <AText variant="title" style={{ textAlign: 'center' }}>
            Your free closet is full
          </AText>
          <AText variant="small" color="secondary" style={{ textAlign: 'center' }}>
            The free plan holds up to {FREE_LIMITS.wardrobeItems} items. Remove a few you don&apos;t
            travel with, or go Plus for an unlimited wardrobe.
          </AText>
          <AButton label="Go Plus ✦" onPress={() => router.push('/paywall?reason=wardrobe')} />
          <AButton label="Back" kind="ghost" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <AText variant="display" style={{ marginTop: Spacing.two }}>
        Scan a garment
      </AText>
      <AText variant="small" color="secondary" style={{ marginBottom: Spacing.three }}>
        Photograph one item — flat or hanging. Althea reads its colour, fabric and coverage.
      </AText>

      {Platform.OS !== 'web' && (
        <AButton label="Take a photo" onPress={() => runScan('camera')} />
      )}
      <AButton label="Choose from library" kind="soft" onPress={() => runScan('library')} />

      {error && (
        <AText variant="caption" style={{ color: theme.warn, marginTop: Spacing.two }}>
          {error}
        </AText>
      )}
    </Screen>
  );
}
