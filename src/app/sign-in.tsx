import { useState } from 'react';
import { KeyboardAvoidingView, Platform, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AButton } from '@/components/ui/button';
import { AText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/hooks/use-theme';

export default function SignInScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    setNotice(null);
    const action = mode === 'in' ? signIn : signUp;
    const { error: err } = await action(email.trim(), password);
    setBusy(false);
    if (err) {
      setError(err);
    } else if (mode === 'up') {
      setNotice('Check your email to confirm your account, then sign in.');
      setMode('in');
    }
    // On successful sign-in the auth listener redirects; nothing to do here.
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: theme.background }}>
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          paddingHorizontal: Spacing.four,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          gap: Spacing.two,
          maxWidth: 460,
          width: '100%',
          alignSelf: 'center',
        }}>
        <AText variant="caption" color="rose" style={{ letterSpacing: 4, textAlign: 'center' }}>
          ✦ ALTHEA
        </AText>
        <AText variant="display" style={{ textAlign: 'center' }}>
          Travel Beautifully
        </AText>
        <AText
          variant="small"
          color="secondary"
          style={{ textAlign: 'center', marginBottom: Spacing.three }}>
          {mode === 'in' ? 'Welcome back.' : 'Create your account.'}
        </AText>

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor={theme.textSecondary}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          accessibilityLabel="Email"
          style={{
            borderWidth: 1,
            borderColor: theme.line,
            borderRadius: Radius.md,
            padding: 13,
            fontSize: 15,
            color: theme.text,
            backgroundColor: theme.backgroundElement,
          }}
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor={theme.textSecondary}
          secureTextEntry
          autoComplete="password"
          accessibilityLabel="Password"
          onSubmitEditing={submit}
          style={{
            borderWidth: 1,
            borderColor: theme.line,
            borderRadius: Radius.md,
            padding: 13,
            fontSize: 15,
            color: theme.text,
            backgroundColor: theme.backgroundElement,
          }}
        />

        {error && (
          <AText variant="caption" style={{ color: theme.warn }}>
            {error}
          </AText>
        )}
        {notice && (
          <AText variant="caption" color="rose">
            {notice}
          </AText>
        )}

        <AButton
          label={busy ? 'One moment…' : mode === 'in' ? 'Sign in' : 'Create account'}
          onPress={submit}
          disabled={busy || !email || !password}
          style={{ marginTop: Spacing.two, opacity: busy || !email || !password ? 0.6 : 1 }}
        />
        <AButton
          label={mode === 'in' ? 'New here? Create an account' : 'Have an account? Sign in'}
          kind="ghost"
          onPress={() => {
            setMode((m) => (m === 'in' ? 'up' : 'in'));
            setError(null);
            setNotice(null);
          }}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
