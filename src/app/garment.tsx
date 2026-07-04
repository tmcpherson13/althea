import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, Switch, TextInput, View } from 'react-native';

import { AButton } from '@/components/ui/button';
import { Swatch } from '@/components/ui/swatch';
import { Screen } from '@/components/ui/screen';
import { AText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { deleteGarment, fetchGarment, updateGarment } from '@/lib/data';
import { isLive } from '@/lib/supabase';
import { useTheme } from '@/hooks/use-theme';
import type { Garment, GarmentCategory } from '@/lib/types';

const CATEGORIES: GarmentCategory[] = ['top', 'bottom', 'dress', 'layer', 'shoe', 'accessory'];

function confirmDelete(onYes: () => void) {
  if (Platform.OS === 'web') {
    if (window.confirm('Remove this garment from your closet?')) onYes();
  } else {
    Alert.alert('Remove garment', 'Remove this garment from your closet?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: onYes },
    ]);
  }
}

export default function GarmentScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const editable = isLive && Boolean(user);

  const [garment, setGarment] = useState<Garment | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void fetchGarment(String(id)).then((g) => {
      if (active) {
        setGarment(g);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <Screen>
        <View style={{ paddingVertical: Spacing.six, alignItems: 'center' }}>
          <ActivityIndicator color={theme.rose} />
        </View>
      </Screen>
    );
  }

  if (!garment) {
    return (
      <Screen>
        <View style={{ paddingVertical: Spacing.five, gap: Spacing.two, alignItems: 'center' }}>
          <AText variant="title">Garment not found</AText>
          <AButton label="Back" kind="soft" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  const g = garment; // narrowed
  const set = (patch: Partial<Garment>) => setGarment({ ...g, ...patch });

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      await updateGarment(g.id, {
        name: g.name,
        category: g.category,
        fabric: g.fabric,
        formality: g.formality,
        coverage: g.coverage,
      });
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save.');
      setBusy(false);
    }
  };

  const remove = () =>
    confirmDelete(async () => {
      setBusy(true);
      try {
        await deleteGarment(g.id);
        router.back();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not remove.');
        setBusy(false);
      }
    });

  const inputStyle = {
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: Radius.md,
    padding: 12,
    fontSize: 15,
    color: theme.text,
    backgroundColor: theme.backgroundElement,
  } as const;

  return (
    <Screen>
      <View style={{ flexDirection: 'row', gap: Spacing.two, alignItems: 'center' }}>
        <Swatch garment={g} size={72} />
        <View style={{ flex: 1 }}>
          <AText style={{ fontWeight: '600' }}>{g.name}</AText>
          <AText variant="caption" color="secondary">
            {g.meta}
            {editable ? '' : ' · demo (read-only)'}
          </AText>
        </View>
      </View>

      <AText variant="eyebrow" color="secondary" style={{ marginTop: Spacing.three }}>
        Name
      </AText>
      <TextInput
        value={g.name}
        editable={editable}
        onChangeText={(name) => set({ name })}
        accessibilityLabel="Garment name"
        style={[inputStyle, { opacity: editable ? 1 : 0.6 }]}
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
              disabled={!editable}
              onPress={() => set({ category: cat })}
              style={{
                paddingHorizontal: 13,
                paddingVertical: 8,
                borderRadius: Radius.pill,
                borderWidth: 1,
                borderColor: sel ? theme.brand : theme.line,
                backgroundColor: sel ? theme.brand : theme.backgroundElement,
                opacity: editable || sel ? 1 : 0.6,
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
        value={g.fabric}
        editable={editable}
        onChangeText={(fabric) => set({ fabric })}
        placeholder="e.g. Linen"
        placeholderTextColor={theme.textSecondary}
        accessibilityLabel="Fabric"
        style={[inputStyle, { opacity: editable ? 1 : 0.6 }]}
      />

      <AText variant="eyebrow" color="secondary" style={{ marginTop: Spacing.three }}>
        Formality
      </AText>
      <View style={{ flexDirection: 'row', gap: 7 }}>
        {([1, 2, 3, 4, 5] as const).map((n) => {
          const sel = g.formality === n;
          return (
            <Pressable
              key={n}
              accessibilityRole="button"
              accessibilityLabel={`Formality ${n}`}
              disabled={!editable}
              onPress={() => set({ formality: n })}
              style={{
                width: 44,
                height: 40,
                borderRadius: Radius.md,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: sel ? theme.brand : theme.line,
                backgroundColor: sel ? theme.brand : theme.backgroundElement,
                opacity: editable || sel ? 1 : 0.6,
              }}>
              <AText color={sel ? 'onBrand' : 'primary'} style={{ fontWeight: '600' }}>
                {n}
              </AText>
            </Pressable>
          );
        })}
      </View>
      <AText variant="caption" color="secondary">
        1 = very casual · 5 = formal
      </AText>

      <AText variant="eyebrow" color="secondary" style={{ marginTop: Spacing.three }}>
        Coverage
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
              disabled={!editable}
              onValueChange={(v) => set({ coverage: { ...g.coverage, [key]: v } })}
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

      {editable && (
        <View style={{ marginTop: Spacing.four, gap: Spacing.two }}>
          <AButton label={busy ? 'Saving…' : 'Save changes'} onPress={save} disabled={busy} style={{ opacity: busy ? 0.6 : 1 }} />
          <AButton label="Remove from closet" kind="ghost" onPress={remove} disabled={busy} />
        </View>
      )}
    </Screen>
  );
}
