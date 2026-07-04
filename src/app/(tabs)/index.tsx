import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { AButton } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { AText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth';
import { useActiveTrip, usePlan } from '@/lib/data';
import { draftTrip } from '@/lib/mock';
import { modules } from '@/lib/modules';
import type { Plan } from '@/lib/types';

/** First name from the signed-in email, if available. */
function greetingName(email?: string | null): string {
  if (!email) return '';
  const handle = email.split('@')[0].split(/[._]/)[0];
  return handle ? `, ${handle.charAt(0).toUpperCase()}${handle.slice(1)}` : '';
}

function QuickAction({
  icon,
  label,
  onPress,
  dim,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  dim?: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        alignItems: 'center',
        gap: 6,
        paddingVertical: 11,
        borderRadius: Radius.md,
        borderWidth: 1,
        borderColor: theme.line,
        backgroundColor: theme.backgroundElement,
        opacity: pressed ? 0.7 : 1,
      })}>
      <Ionicons name={icon} size={19} color={dim ? theme.textSecondary : theme.rose} />
      <AText variant="caption" color={dim ? 'secondary' : 'primary'}>
        {label}
      </AText>
    </Pressable>
  );
}

function TripHero({ plan }: { plan: Plan }) {
  const { trip, stats } = plan;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push('/packing')}
      style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}>
      <View style={{ borderRadius: Radius.xl, overflow: 'hidden' }}>
        <LinearGradient colors={['#E8B08A', '#D68C74', '#B96F6F', '#57455C']} style={{ height: 110 }} />
        <View style={{ backgroundColor: '#2C2638', padding: Spacing.three, gap: 3 }}>
          <AText variant="title" style={{ color: '#FBF6EC' }}>
            {trip.city}
            {trip.country ? `, ${trip.country}` : ''}
          </AText>
          <AText variant="caption" style={{ color: '#FBF6EC', opacity: 0.8 }}>
            {trip.startsOn} – {trip.endsOn} · {trip.nights} nights
            {trip.companions ? ` · ${trip.companions}` : ''}
          </AText>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 7,
              marginTop: 9,
              alignSelf: 'flex-start',
              borderWidth: 1,
              borderColor: 'rgba(251,246,236,0.3)',
              borderRadius: Radius.pill,
              paddingHorizontal: 12,
              paddingVertical: 6,
            }}>
            <View style={{ width: 7, height: 7, borderRadius: 99, backgroundColor: '#E3A6A6' }} />
            <AText variant="caption" style={{ color: '#FBF6EC', fontWeight: '600' }}>
              Capsule ready — {stats.items} items · {stats.wearableLooks} looks
              {stats.carryOnFit ? ' · carry-on' : ''}
            </AText>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function PromptHero({
  title,
  body,
  cta,
  to,
}: {
  title: string;
  body: string;
  cta: string;
  to: '/scan' | '/new-trip';
}) {
  return (
    <Card style={{ gap: Spacing.two, alignItems: 'flex-start' }}>
      <AText variant="title">{title}</AText>
      <AText variant="small" color="secondary">
        {body}
      </AText>
      <AButton label={cta} onPress={() => router.push(to)} style={{ marginTop: Spacing.one }} />
    </Card>
  );
}

export default function HomeScreen() {
  const theme = useTheme();
  const { requiresAuth, user } = useAuth();
  const { plan, needsWardrobe } = usePlan();
  const { refresh } = useActiveTrip();

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  return (
    <Screen>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginTop: Spacing.two,
        }}>
        <AText variant="display" style={{ flex: 1 }}>
          Good morning{greetingName(user?.email)} ☀
        </AText>
        {requiresAuth && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Profile and settings"
            onPress={() => router.push('/profile')}
            hitSlop={10}
            style={({ pressed }) => ({ padding: 4, opacity: pressed ? 0.6 : 1 })}>
            <Ionicons name="settings-outline" size={22} color={theme.textSecondary} />
          </Pressable>
        )}
      </View>
      <AText variant="small" color="secondary" style={{ marginBottom: Spacing.two }}>
        Where to next?
      </AText>

      {plan ? (
        <TripHero plan={plan} />
      ) : needsWardrobe ? (
        <PromptHero
          title="Scan your closet"
          body="Add a few garments and Althea will pack them for your next trip."
          cta="Scan a garment"
          to="/scan"
        />
      ) : (
        <PromptHero
          title="Plan your first trip"
          body="Tell Althea where you're going and she'll build your capsule."
          cta="Plan a trip"
          to="/new-trip"
        />
      )}

      {/* Quick actions */}
      <View style={{ flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.two }}>
        <QuickAction icon="briefcase-outline" label="Packing" onPress={() => router.push('/packing')} />
        <QuickAction icon="shirt-outline" label="Wardrobe" onPress={() => router.push('/wardrobe')} />
        <QuickAction icon="grid-outline" label="Lookbook" onPress={() => router.push('/lookbook')} />
      </View>

      {!requiresAuth && (
        <>
          <AText variant="eyebrow" color="secondary" style={{ marginTop: Spacing.four }}>
            Up next
          </AText>
          <Card style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <AText style={{ fontWeight: '600' }}>
                {draftTrip.city}, {draftTrip.country}
              </AText>
              <AText variant="caption" color="secondary">
                {draftTrip.status}
              </AText>
            </View>
            <Badge label="Draft" tone="rewear" />
          </Card>
        </>
      )}
      <AButton label="+ Plan a new trip" kind="soft" onPress={() => router.push('/new-trip')} />

      <AText variant="eyebrow" color="secondary" style={{ marginTop: Spacing.four }}>
        Modules — enable as you go
      </AText>
      <View style={{ gap: Spacing.two }}>
        {modules.map((m) => (
          <Card
            key={m.key}
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1, paddingRight: Spacing.two }}>
              <AText style={{ fontWeight: '600' }}>{m.name}</AText>
              <AText variant="caption" color="secondary">
                {m.description}
              </AText>
            </View>
            <Badge label={m.enabled ? 'On' : m.phase} tone={m.enabled ? 'ok' : 'locked'} />
          </Card>
        ))}
      </View>
    </Screen>
  );
}
