import { useState } from 'react';
import { ActivityIndicator, Pressable, TextInput, View } from 'react-native';

import { AButton } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { AText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { STYLE_OPTIONS, updateProfile, useProfile, type Profile } from '@/lib/data';
import { useTheme } from '@/hooks/use-theme';

const SIZE_FIELDS: { key: keyof Profile['sizes']; label: string }[] = [
  { key: 'tops', label: 'Tops' },
  { key: 'bottoms', label: 'Bottoms' },
  { key: 'dress', label: 'Dresses' },
  { key: 'shoes', label: 'Shoes' },
];

export default function ProfileScreen() {
  const theme = useTheme();
  const { user, requiresAuth, signOut } = useAuth();
  const { profile, loading, live } = useProfile();

  const [form, setForm] = useState<Profile>(profile);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  // Re-seed the form whenever a freshly-loaded profile arrives. `profile` only
  // changes reference on load/refresh, so this never clobbers in-progress edits.
  const [seededFrom, setSeededFrom] = useState(profile);
  if (seededFrom !== profile) {
    setSeededFrom(profile);
    setForm(profile);
  }

  const inputStyle = {
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: Radius.md,
    padding: 12,
    fontSize: 15,
    color: theme.text,
    backgroundColor: theme.backgroundElement,
  } as const;

  const save = async () => {
    if (!user) return;
    setBusy(true);
    setStatus(null);
    try {
      await updateProfile(user.id, form);
      setStatus('Saved. Your next capsule will use these.');
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Could not save.');
    }
    setBusy(false);
  };

  if (!live) {
    return (
      <Screen>
        <View style={{ paddingVertical: Spacing.five, gap: Spacing.two, alignItems: 'center' }}>
          <AText variant="title">Your profile</AText>
          <AText variant="small" color="secondary" style={{ textAlign: 'center' }}>
            Set your style and sizes in the signed-in app — Althea uses them to tailor every
            capsule and fill gaps in your size.
          </AText>
        </View>
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

  return (
    <Screen>
      <AText variant="eyebrow" color="secondary" style={{ marginTop: Spacing.two }}>
        Name
      </AText>
      <TextInput
        value={form.displayName}
        onChangeText={(displayName) => setForm({ ...form, displayName })}
        placeholder="Your name"
        placeholderTextColor={theme.textSecondary}
        accessibilityLabel="Name"
        style={inputStyle}
      />

      <AText variant="eyebrow" color="secondary" style={{ marginTop: Spacing.three }}>
        Home city
      </AText>
      <TextInput
        value={form.homeCity}
        onChangeText={(homeCity) => setForm({ ...form, homeCity })}
        placeholder="Where you usually fly from"
        placeholderTextColor={theme.textSecondary}
        accessibilityLabel="Home city"
        style={inputStyle}
      />

      <AText variant="eyebrow" color="secondary" style={{ marginTop: Spacing.three }}>
        Your style
      </AText>
      <AText variant="caption" color="secondary">
        Sets how dressed-up your capsules lean.
      </AText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
        {STYLE_OPTIONS.map((s) => {
          const sel = form.styleRegister === s;
          return (
            <Pressable
              key={s}
              accessibilityRole="button"
              onPress={() => setForm({ ...form, styleRegister: s })}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 9,
                borderRadius: Radius.pill,
                borderWidth: 1,
                borderColor: sel ? theme.brand : theme.line,
                backgroundColor: sel ? theme.brand : theme.backgroundElement,
              }}>
              <AText
                variant="small"
                color={sel ? 'onBrand' : 'primary'}
                style={{ fontWeight: sel ? '600' : '400', textTransform: 'capitalize' }}>
                {s.replace('-', ' ')}
              </AText>
            </Pressable>
          );
        })}
      </View>

      <AText variant="eyebrow" color="secondary" style={{ marginTop: Spacing.three }}>
        Your sizes
      </AText>
      <AText variant="caption" color="secondary">
        Used to filter shopping links when a capsule has a gap.
      </AText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two }}>
        {SIZE_FIELDS.map((f) => (
          <View key={f.key} style={{ width: '47%', minWidth: 130 }}>
            <AText variant="caption" color="secondary" style={{ marginBottom: 4 }}>
              {f.label}
            </AText>
            <TextInput
              value={form.sizes[f.key] ?? ''}
              onChangeText={(v) => setForm({ ...form, sizes: { ...form.sizes, [f.key]: v } })}
              placeholder="e.g. M / 8 / 38"
              placeholderTextColor={theme.textSecondary}
              accessibilityLabel={`${f.label} size`}
              style={inputStyle}
            />
          </View>
        ))}
      </View>

      {status && (
        <AText variant="caption" color="rose" style={{ marginTop: Spacing.two }}>
          {status}
        </AText>
      )}

      <View style={{ marginTop: Spacing.four, gap: Spacing.two }}>
        <AButton label={busy ? 'Saving…' : 'Save profile'} onPress={save} disabled={busy} style={{ opacity: busy ? 0.6 : 1 }} />
        {requiresAuth && user && (
          <AButton label="Sign out" kind="ghost" onPress={() => void signOut()} />
        )}
      </View>
    </Screen>
  );
}
