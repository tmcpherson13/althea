/**
 * Journal (trip recording) data layer — Polarsteps-style moments. Photos land
 * in the private `journal` storage bucket (owner-scoped by user id); display
 * uses short-lived signed URLs. Geocoding a typed place name gives the map
 * pin its coordinates, reusing the weather module's geocoder.
 */

import { decode } from 'base64-arraybuffer';
import { File } from 'expo-file-system';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { useAuth } from '@/lib/auth';
import { isLive, supabase } from '@/lib/supabase';
import { geocode } from '@/lib/weather';

export type JournalEntry = {
  id: string;
  tripId: string | null;
  takenAt: string; // ISO
  placeName: string;
  latitude: number | null;
  longitude: number | null;
  caption: string;
  mediaPaths: string[];
  audioPaths: string[];
  orderIndex: number;
};

function rowToEntry(row: Record<string, unknown>): JournalEntry {
  return {
    id: String(row.id),
    tripId: row.trip_id ? String(row.trip_id) : null,
    takenAt: String(row.taken_at ?? ''),
    placeName: String(row.place_name ?? ''),
    latitude: row.latitude != null ? Number(row.latitude) : null,
    longitude: row.longitude != null ? Number(row.longitude) : null,
    caption: String(row.caption ?? ''),
    mediaPaths: Array.isArray(row.media_paths) ? (row.media_paths as string[]) : [],
    audioPaths: Array.isArray(row.audio_paths) ? (row.audio_paths as string[]) : [],
    orderIndex: Number(row.order_index ?? 0),
  };
}

async function uploadPhoto(userId: string, base64: string, i: number): Promise<string> {
  const path = `${userId}/${Date.now()}-${i}.jpg`;
  const { error } = await supabase!.storage
    .from('journal')
    .upload(path, decode(base64), { contentType: 'image/jpeg', upsert: false });
  if (error) throw new Error(error.message);
  return path;
}

/**
 * Upload a recorded voice note. The recorder hands back a local URI: `file://`
 * on native (read to base64 → bytes) and a `blob:` URL on web (fetched to a
 * Blob). HIGH_QUALITY records m4a on native and webm on web.
 */
async function uploadAudio(userId: string, uri: string): Promise<string> {
  const web = Platform.OS === 'web';
  const ext = web ? 'webm' : 'm4a';
  const contentType = web ? 'audio/webm' : 'audio/mp4';
  const path = `${userId}/audio-${Date.now()}.${ext}`;
  const body: ArrayBuffer | Blob = web
    ? await (await fetch(uri)).blob()
    : decode(await new File(uri).base64());
  const { error } = await supabase!.storage
    .from('journal')
    .upload(path, body, { contentType, upsert: false });
  if (error) throw new Error(error.message);
  return path;
}

/** Attach a voice note to an existing moment (edit mode). */
export async function addVoiceNote(id: string, userId: string, uri: string): Promise<void> {
  if (!supabase) throw new Error('The demo journal is read-only.');
  const path = await uploadAudio(userId, uri);
  const { data } = await supabase
    .from('journal_entries')
    .select('audio_paths')
    .eq('id', id)
    .maybeSingle();
  const existing = Array.isArray(data?.audio_paths) ? (data.audio_paths as string[]) : [];
  const { error } = await supabase
    .from('journal_entries')
    .update({ audio_paths: [...existing, path] })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

/**
 * Transcribe a stored voice note via the `transcribe-audio` edge function.
 * Returns the transcript text, or throws with a friendly message when the
 * function isn't configured (no speech-to-text key set yet).
 */
export async function transcribeVoiceNote(path: string): Promise<string> {
  if (!supabase) throw new Error('Sign in to transcribe.');
  const { data, error } = await supabase.functions.invoke('transcribe-audio', { body: { path } });
  if (error) throw new Error(error.message);
  if (!data?.configured) throw new Error(data?.message ?? 'Transcription isn’t set up yet.');
  return String(data.text ?? '');
}

export async function fetchEntry(id: string): Promise<JournalEntry | null> {
  if (!supabase) return null;
  const { data } = await supabase.from('journal_entries').select('*').eq('id', id).maybeSingle();
  return data ? rowToEntry(data) : null;
}

export async function listEntries(userId: string): Promise<JournalEntry[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', userId)
    .order('taken_at', { ascending: true });
  return (data ?? []).map(rowToEntry);
}

export async function createEntry(
  userId: string,
  args: {
    placeName: string;
    caption: string;
    takenAt: string;
    tripId?: string | null;
    photosBase64: string[];
    audioUri?: string | null;
  }
): Promise<void> {
  if (!supabase) throw new Error('Sign in to record your trip.');
  let latitude: number | null = null;
  let longitude: number | null = null;
  if (args.placeName.trim()) {
    const place = await geocode(args.placeName.trim());
    if (place) {
      latitude = place.latitude;
      longitude = place.longitude;
    }
  }
  const media_paths: string[] = [];
  for (let i = 0; i < args.photosBase64.length; i++) {
    media_paths.push(await uploadPhoto(userId, args.photosBase64[i], i));
  }
  const audio_paths: string[] = [];
  if (args.audioUri) audio_paths.push(await uploadAudio(userId, args.audioUri));
  const { error } = await supabase.from('journal_entries').insert({
    user_id: userId,
    trip_id: args.tripId ?? null,
    taken_at: args.takenAt,
    place_name: args.placeName.trim() || null,
    latitude,
    longitude,
    caption: args.caption.trim() || null,
    media_paths,
    audio_paths,
  });
  if (error) throw new Error(error.message);
}

export async function updateEntry(
  id: string,
  patch: { placeName?: string; caption?: string; takenAt?: string }
): Promise<void> {
  if (!supabase) throw new Error('The demo journal is read-only.');
  const update: Record<string, unknown> = {};
  if (patch.caption !== undefined) update.caption = patch.caption.trim() || null;
  if (patch.takenAt !== undefined) update.taken_at = patch.takenAt;
  if (patch.placeName !== undefined) {
    update.place_name = patch.placeName.trim() || null;
    const place = patch.placeName.trim() ? await geocode(patch.placeName.trim()) : null;
    update.latitude = place?.latitude ?? null;
    update.longitude = place?.longitude ?? null;
  }
  const { error } = await supabase.from('journal_entries').update(update).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteEntry(id: string): Promise<void> {
  if (!supabase) throw new Error('The demo journal is read-only.');
  const { error } = await supabase.from('journal_entries').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

/** Batch short-lived signed URLs for private media, keyed by storage path. */
export async function signedUrls(paths: string[]): Promise<Record<string, string>> {
  if (!supabase || paths.length === 0) return {};
  const { data } = await supabase.storage.from('journal').createSignedUrls(paths, 3600);
  const map: Record<string, string> = {};
  for (const entry of data ?? []) {
    if (entry.path && entry.signedUrl) map[entry.path] = entry.signedUrl;
  }
  return map;
}

export function useJournal(): {
  entries: JournalEntry[];
  loading: boolean;
  live: boolean;
  refresh: () => Promise<void>;
} {
  const { user } = useAuth();
  const live = isLive && Boolean(user);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(live);

  const load = useCallback(async (): Promise<JournalEntry[]> => {
    if (!live || !user) return [];
    return listEntries(user.id);
  }, [live, user]);

  const refresh = useCallback(async () => {
    const next = await load();
    setEntries(next);
    setLoading(false);
  }, [load]);

  useEffect(() => {
    let active = true;
    void load().then((next) => {
      if (active) {
        setEntries(next);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [load]);

  return { entries, loading, live, refresh };
}
