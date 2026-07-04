import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, TextInput, View } from 'react-native';

import { AButton } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { AText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import {
  createEntry,
  deleteEntry,
  fetchEntry,
  signedUrls,
  updateEntry,
} from '@/lib/journal';
import { useTheme } from '@/hooks/use-theme';

function confirmDelete(onYes: () => void) {
  if (Platform.OS === 'web') {
    if (window.confirm('Delete this moment?')) onYes();
  } else {
    Alert.alert('Delete moment', 'Delete this moment?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: onYes },
    ]);
  }
}

type Picked = { uri: string; base64: string };

export default function JournalEntryScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { user } = useAuth();
  const editing = Boolean(id);

  const [loading, setLoading] = useState(editing);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [place, setPlace] = useState('');
  const [caption, setCaption] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [picked, setPicked] = useState<Picked[]>([]);
  const [existingUrls, setExistingUrls] = useState<string[]>([]);

  useEffect(() => {
    if (!editing || !id) return;
    let active = true;
    void (async () => {
      const entry = await fetchEntry(String(id));
      if (!active || !entry) {
        if (active) setLoading(false);
        return;
      }
      setPlace(entry.placeName);
      setCaption(entry.caption);
      setDate(entry.takenAt.slice(0, 10) || date);
      const urls = await signedUrls(entry.mediaPaths);
      if (active) {
        setExistingUrls(entry.mediaPaths.map((p) => urls[p]).filter(Boolean));
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, editing]);

  const pickPhotos = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setError('Please allow photo access to add photos.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 4,
      quality: 0.5,
      base64: true,
    });
    if (res.canceled) return;
    setPicked(
      res.assets
        .filter((a) => a.base64)
        .map((a) => ({ uri: a.uri, base64: a.base64 as string }))
    );
  };

  const save = async () => {
    if (!user) return;
    setBusy(true);
    setError(null);
    try {
      const takenAt = `${date}T12:00:00.000Z`;
      if (editing && id) {
        await updateEntry(String(id), { placeName: place, caption, takenAt });
      } else {
        await createEntry(user.id, {
          placeName: place,
          caption,
          takenAt,
          photosBase64: picked.map((p) => p.base64),
        });
      }
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save.');
      setBusy(false);
    }
  };

  const remove = () =>
    confirmDelete(async () => {
      if (!id) return;
      setBusy(true);
      try {
        await deleteEntry(String(id));
        router.back();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not delete.');
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

  if (loading) {
    return (
      <Screen>
        <View style={{ paddingVertical: Spacing.six, alignItems: 'center' }}>
          <ActivityIndicator color={theme.rose} />
        </View>
      </Screen>
    );
  }

  const thumbs = editing ? existingUrls : picked.map((p) => p.uri);

  return (
    <Screen>
      {!editing && (
        <>
          <AButton label={picked.length ? `${picked.length} photo${picked.length > 1 ? 's' : ''} selected` : 'Add photos'} kind="soft" onPress={pickPhotos} />
        </>
      )}

      {thumbs.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two }}>
          {thumbs.map((uri) => (
            <Image
              key={uri}
              source={{ uri }}
              style={{ width: 80, height: 80, borderRadius: Radius.md }}
              contentFit="cover"
            />
          ))}
        </View>
      )}

      <AText variant="eyebrow" color="secondary" style={{ marginTop: Spacing.three }}>
        Where?
      </AText>
      <TextInput
        value={place}
        onChangeText={setPlace}
        placeholder="e.g. Jardin Majorelle, Marrakech"
        placeholderTextColor={theme.textSecondary}
        accessibilityLabel="Place"
        style={inputStyle}
      />

      <AText variant="eyebrow" color="secondary" style={{ marginTop: Spacing.three }}>
        Date
      </AText>
      <TextInput
        value={date}
        onChangeText={setDate}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={theme.textSecondary}
        accessibilityLabel="Date"
        autoCapitalize="none"
        style={inputStyle}
      />

      <AText variant="eyebrow" color="secondary" style={{ marginTop: Spacing.three }}>
        Note
      </AText>
      <TextInput
        value={caption}
        onChangeText={setCaption}
        placeholder="What happened here?"
        placeholderTextColor={theme.textSecondary}
        accessibilityLabel="Note"
        multiline
        style={[inputStyle, { minHeight: 90, textAlignVertical: 'top' }]}
      />

      {error && (
        <AText variant="caption" style={{ color: theme.warn, marginTop: Spacing.two }}>
          {error}
        </AText>
      )}

      <View style={{ marginTop: Spacing.four, gap: Spacing.two }}>
        <AButton
          label={busy ? 'Saving…' : editing ? 'Save changes' : 'Add to journal'}
          onPress={save}
          disabled={busy || (!editing && picked.length === 0 && !place)}
          style={{ opacity: busy ? 0.6 : 1 }}
        />
        {editing && <AButton label="Delete moment" kind="ghost" onPress={remove} disabled={busy} />}
      </View>
    </Screen>
  );
}
