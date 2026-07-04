import Ionicons from '@expo/vector-icons/Ionicons';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { AText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** mm:ss from seconds. */
function clock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/**
 * Record a single voice note. Calls onRecorded with the local recording URI
 * when the user stops. Recording needs a mic permission and (on iOS) the
 * play-and-record audio session.
 */
export function VoiceRecorder({ onRecorded }: { onRecorded: (uri: string) => void }) {
  const theme = useTheme();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const state = useAudioRecorderState(recorder);
  const [error, setError] = useState<string | null>(null);

  const start = async () => {
    setError(null);
    const perm = await requestRecordingPermissionsAsync();
    if (!perm.granted) {
      setError('Please allow microphone access to record a voice note.');
      return;
    }
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
  };

  const stop = async () => {
    await recorder.stop();
    if (recorder.uri) onRecorded(recorder.uri);
  };

  return (
    <View style={{ gap: 6 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={state.isRecording ? 'Stop recording' : 'Record a voice note'}
        onPress={() => (state.isRecording ? void stop() : void start())}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: Spacing.two,
          paddingHorizontal: Spacing.three,
          paddingVertical: 12,
          borderRadius: Radius.md,
          borderWidth: 1,
          borderColor: state.isRecording ? theme.rose : theme.line,
          backgroundColor: state.isRecording ? theme.accentSoft : theme.backgroundElement,
          opacity: pressed ? 0.8 : 1,
        })}>
        <Ionicons
          name={state.isRecording ? 'stop-circle' : 'mic-outline'}
          size={22}
          color={theme.rose}
        />
        <AText variant="small" style={{ flex: 1, fontWeight: '600' }}>
          {state.isRecording ? 'Stop recording' : 'Record a voice note'}
        </AText>
        {state.isRecording && (
          <AText variant="small" color="secondary">
            {clock(state.durationMillis / 1000)}
          </AText>
        )}
      </Pressable>
      {error && (
        <AText variant="caption" style={{ color: theme.warn }}>
          {error}
        </AText>
      )}
    </View>
  );
}

/** Play a voice note from a URL (signed) or local URI, with a play/pause toggle. */
export function VoicePlayer({ uri, label }: { uri: string; label?: string }) {
  const theme = useTheme();
  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);

  const toggle = () => {
    if (status.playing) {
      player.pause();
      return;
    }
    if (status.didJustFinish || (status.duration > 0 && status.currentTime >= status.duration)) {
      void player.seekTo(0);
    }
    player.play();
  };

  const elapsed = status.playing || status.currentTime > 0 ? status.currentTime : status.duration;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.two,
        paddingHorizontal: Spacing.three,
        paddingVertical: 10,
        borderRadius: Radius.md,
        borderWidth: 1,
        borderColor: theme.line,
        backgroundColor: theme.backgroundElement,
      }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Play voice note" onPress={toggle}>
        <Ionicons name={status.playing ? 'pause-circle' : 'play-circle'} size={30} color={theme.rose} />
      </Pressable>
      <AText variant="small" style={{ flex: 1 }}>
        {label ?? 'Voice note'}
      </AText>
      <AText variant="caption" color="secondary">
        {clock(elapsed)}
      </AText>
    </View>
  );
}
