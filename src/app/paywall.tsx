import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { AButton } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { AText } from '@/components/ui/text';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { PLUS, cancelPlus, startPlusCheckout, useEntitlement } from '@/lib/entitlement';
import { useTheme } from '@/hooks/use-theme';

/** Context-specific line explaining why the paywall appeared. */
const REASONS: Record<string, string> = {
  trips: "You've reached the free limit of one trip at a time.",
  wardrobe: "You've reached the free limit of 50 wardrobe items.",
};

export default function PaywallScreen() {
  const theme = useTheme();
  const { user } = useAuth();
  const { plus, refresh } = useEntitlement();
  const { reason } = useLocalSearchParams<{ reason?: string }>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upgrade = async () => {
    if (!user) {
      setError('Sign in to upgrade.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await startPlusCheckout(user.id);
      await refresh();
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start checkout.');
      setBusy(false);
    }
  };

  const downgrade = async () => {
    if (!user) return;
    setBusy(true);
    setError(null);
    try {
      await cancelPlus(user.id);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update.');
    }
    setBusy(false);
  };

  return (
    <Screen>
      <View style={{ alignItems: 'center', gap: 6, marginTop: Spacing.three }}>
        <Ionicons name="sparkles" size={30} color={theme.rose} />
        <AText variant="display" style={{ textAlign: 'center' }}>
          {PLUS.name}
        </AText>
        <AText variant="small" color="secondary" style={{ textAlign: 'center' }}>
          {PLUS.tagline}
        </AText>
      </View>

      {plus ? (
        <Card style={{ marginTop: Spacing.four, gap: Spacing.two, alignItems: 'center' }}>
          <Ionicons name="checkmark-circle" size={26} color={theme.good} />
          <AText style={{ fontWeight: '600' }}>You have Plus</AText>
          <AText variant="caption" color="secondary" style={{ textAlign: 'center' }}>
            All limits are lifted and ads are off. Thank you for supporting Althea.
          </AText>
        </Card>
      ) : (
        <>
          {reason && REASONS[reason] && (
            <Card style={{ marginTop: Spacing.three, backgroundColor: theme.accentSoft }}>
              <AText variant="small" style={{ color: theme.rose, fontWeight: '600' }}>
                {REASONS[reason]}
              </AText>
              <AText variant="caption" color="secondary">
                Upgrade to keep going, or free up room on the free plan.
              </AText>
            </Card>
          )}

          <View style={{ gap: Spacing.two, marginTop: Spacing.four }}>
            {PLUS.features.map((f) => (
              <View key={f} style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
                <Ionicons name="checkmark-circle" size={20} color={theme.rose} />
                <AText variant="small" style={{ flex: 1 }}>
                  {f}
                </AText>
              </View>
            ))}
          </View>

          <View style={{ alignItems: 'center', marginTop: Spacing.four, gap: 2 }}>
            <AText variant="title">
              {PLUS.priceMonthly}
              <AText variant="small" color="secondary">
                {' '}
                / month
              </AText>
            </AText>
            <AText variant="caption" color="secondary">
              or {PLUS.priceYearly} / year — save 33%
            </AText>
          </View>

          {error && (
            <AText variant="caption" style={{ color: theme.warn, marginTop: Spacing.two, textAlign: 'center' }}>
              {error}
            </AText>
          )}

          <View style={{ marginTop: Spacing.four, gap: Spacing.two }}>
            <AButton
              label={busy ? 'Starting…' : 'Start Plus'}
              onPress={upgrade}
              disabled={busy}
              style={{ opacity: busy ? 0.6 : 1 }}
            />
            <AButton label="Maybe later" kind="ghost" onPress={() => router.back()} disabled={busy} />
          </View>

          <AText variant="caption" color="secondary" style={{ textAlign: 'center', marginTop: Spacing.two }}>
            Checkout is a placeholder — in-app billing wires in with RevenueCat.
          </AText>
        </>
      )}

      {plus && (
        <View style={{ marginTop: Spacing.four, gap: Spacing.two }}>
          <AButton label="Done" onPress={() => router.back()} />
          <AButton label="Turn off Plus (test)" kind="ghost" onPress={downgrade} disabled={busy} />
        </View>
      )}
    </Screen>
  );
}
