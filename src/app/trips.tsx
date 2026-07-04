import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { AButton } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { AText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { deleteTrip, formatShort, setActiveTrip, useTrips, type TripRecord } from '@/lib/data';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/hooks/use-theme';

function confirmDelete(destination: string, onYes: () => void) {
  const msg = `Delete your trip to ${destination}? This can't be undone.`;
  if (Platform.OS === 'web') {
    if (window.confirm(msg)) onYes();
  } else {
    Alert.alert('Delete trip', msg, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: onYes },
    ]);
  }
}

/** Human label for the trip's lifecycle status. */
function statusLabel(status: string): string {
  return { draft: 'Draft', planned: 'Planned', packed: 'Packed', active: 'Traveling', done: 'Past' }[
    status
  ] ?? status;
}

function TripRow({
  trip,
  isActive,
  busy,
  onActivate,
  onDelete,
}: {
  trip: TripRecord;
  isActive: boolean;
  busy: boolean;
  onActivate: () => void;
  onDelete: () => void;
}) {
  const theme = useTheme();
  return (
    <Card style={{ gap: Spacing.two, borderColor: isActive ? theme.brand : theme.line, borderWidth: 1 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Make ${trip.destination} the active trip`}
        disabled={busy || isActive}
        onPress={onActivate}
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1, paddingRight: Spacing.two }}>
            <AText style={{ fontWeight: '600' }}>{trip.destination}</AText>
            <AText variant="caption" color="secondary">
              {formatShort(trip.startsOn)} – {formatShort(trip.endsOn)} · {trip.nights} nights
            </AText>
          </View>
          {isActive ? (
            <Badge label="Current" tone="ok" />
          ) : (
            <Badge label={statusLabel(trip.status)} tone="rewear" />
          )}
        </View>
      </Pressable>

      <View style={{ flexDirection: 'row', gap: Spacing.two, alignItems: 'center' }}>
        {isActive ? (
          <AButton
            label="View packing"
            kind="soft"
            onPress={() => router.push('/packing')}
            style={{ flex: 1 }}
          />
        ) : (
          <AButton label="Make active" onPress={onActivate} disabled={busy} style={{ flex: 1 }} />
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Delete trip to ${trip.destination}`}
          disabled={busy}
          onPress={onDelete}
          hitSlop={8}
          style={({ pressed }) => ({
            paddingHorizontal: 14,
            paddingVertical: 11,
            borderRadius: Radius.md,
            borderWidth: 1,
            borderColor: theme.line,
            opacity: pressed ? 0.6 : 1,
          })}>
          <AText variant="small" style={{ color: theme.warn, fontWeight: '600' }}>
            Delete
          </AText>
        </Pressable>
      </View>
    </Card>
  );
}

export default function TripsScreen() {
  const theme = useTheme();
  const { user } = useAuth();
  const { trips, activeId, loading, live, refresh } = useTrips();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activate = async (trip: TripRecord) => {
    if (!user || trip.id === activeId) return;
    setBusyId(trip.id);
    setError(null);
    try {
      await setActiveTrip(user.id, trip.id);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not switch trips.');
    }
    setBusyId(null);
  };

  const remove = (trip: TripRecord) =>
    confirmDelete(trip.destination, async () => {
      setBusyId(trip.id);
      setError(null);
      try {
        await deleteTrip(trip.id);
        await refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not delete.');
      }
      setBusyId(null);
    });

  if (!live) {
    return (
      <Screen>
        <View style={{ paddingVertical: Spacing.five, gap: Spacing.two, alignItems: 'center' }}>
          <AText variant="title">Your trips</AText>
          <AText variant="small" color="secondary" style={{ textAlign: 'center' }}>
            Sign in to save trips, switch between them, and keep your capsules for each one.
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
      <AText variant="small" color="secondary" style={{ marginTop: Spacing.two }}>
        Tap a trip to make it active — Home, Packing, and Lookbook follow the active trip.
      </AText>

      {error && (
        <AText variant="caption" style={{ color: theme.warn, marginTop: Spacing.two }}>
          {error}
        </AText>
      )}

      {trips.length === 0 ? (
        <Card style={{ gap: Spacing.two, alignItems: 'flex-start', marginTop: Spacing.three }}>
          <AText variant="title">No trips yet</AText>
          <AText variant="small" color="secondary">
            Plan your first trip and Althea will build a capsule from your closet.
          </AText>
          <AButton
            label="Plan a trip"
            onPress={() => router.push('/new-trip')}
            style={{ marginTop: Spacing.one }}
          />
        </Card>
      ) : (
        <View style={{ gap: Spacing.two, marginTop: Spacing.three }}>
          {trips.map((t) => (
            <TripRow
              key={t.id}
              trip={t}
              isActive={t.id === activeId}
              busy={busyId === t.id}
              onActivate={() => void activate(t)}
              onDelete={() => remove(t)}
            />
          ))}
          <AButton label="+ Plan a new trip" kind="soft" onPress={() => router.push('/new-trip')} />
        </View>
      )}
    </Screen>
  );
}
