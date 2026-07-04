import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, TextInput, View } from 'react-native';

import { AButton } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { AText } from '@/components/ui/text';
import { VoicePlayer, VoiceRecorder } from '@/components/voice-note';
import { Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import {
  addVoiceNote,
  createEntry,
  deleteEntry,
  fetchEntry,
  signedUrls,
  transcribeVoiceNote,
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
  const [audioUri, setAudioUri] = useState<string | null>(null); // create mode: recorded, not yet saved
  const [existingAudio, setExistingAudio] = useState<{ path: string; url: string }[]>([]);
  const [transcribing, setTranscribing] = useState<string | null>(null);

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
      const urls = await signedUrls([...entry.mediaPaths, ...entry.audioPaths]);
      if (active) {
        setExistingUrls(entry.mediaPaths.map((p) => urls[p]).filter(Boolean));
        setExistingAudio(entry.audioPaths.filter((p) => urls[p]).map((p) => ({ path: p, url: urls[p] })));
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

  const reloadAudio = async () => {
    if (!id) return;
    const entry = await fetchEntry(String(id));
    if (!entry) return;
    const urls = await signedUrls(entry.audioPaths);
    setExistingAudio(entry.audioPaths.filter((p) => urls[p]).map((p) => ({ path: p, url: urls[p] })));
  };

  const addRecordedToEntry = async (uri: string) => {
    if (!user || !id) return;
    setBusy(true);
    setError(null);
    try {
      await addVoiceNote(String(id), user.id, uri);
      await reloadAudio();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the voice note.');
    }
    setBusy(false);
  };

  const transcribe = async (path: string) => {
    setTranscribing(path);
    setError(null);
    try {
      const text = await transcribeVoiceNote(path);
      const merged = caption.trim() ? `${caption.trim()}\n\n${text}` : text;
      setCaption(merged);
      if (id) await updateEntry(String(id), { caption: merged });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not transcribe.');
    }
    setTranscribing(null);
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
          audioUri,
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

      <AText variant="eyebrow" color="secondary" style={{ marginTop: Spacing.three }}>
        Voice note
      </AText>
      <View style={{ gap: Spacing.two }}>
        {/* Existing notes (edit mode): play + transcribe into the note. */}
        {existingAudio.map((a, i) => (
          <View key={a.path} style={{ gap: 6 }}>
            <VoicePlayer uri={a.url} label={`Voice note ${i + 1}`} />
            <AButton
              label={transcribing === a.path ? 'Transcribing…' : 'Transcribe into note'}
              kind="ghost"
              onPress={() => void transcribe(a.path)}
              disabled={transcribing !== null}
            />
          </View>
        ))}

        {/* Create mode: preview the just-recorded clip before saving. */}
        {!editing && audioUri && <VoicePlayer uri={audioUri} label="New voice note" />}

        {/* Recorder: adds to the entry immediately in edit mode, or stages it in create mode. */}
        {editing ? (
          <VoiceRecorder onRecorded={(uri) => void addRecordedToEntry(uri)} />
        ) : (
          <VoiceRecorder onRecorded={setAudioUri} />
        )}
        <AText variant="caption" color="secondary">
          Narrate the moment — Althea can transcribe it into your note.
        </AText>
      </View>

      {error && (
        <AText variant="caption" style={{ color: theme.warn, marginTop: Spacing.two }}>
          {error}
        </AText>
      )}

      <View style={{ marginTop: Spacing.four, gap: Spacing.two }}>
        <AButton
          label={busy ? 'Saving…' : editing ? 'Save changes' : 'Add to journal'}
          onPress={save}
          disabled={busy || (!editing && picked.length === 0 && !place && !audioUri)}
          style={{ opacity: busy ? 0.6 : 1 }}
        />
        {editing && <AButton label="Delete moment" kind="ghost" onPress={remove} disabled={busy} />}
      </View>
    </Screen>
  );
}
