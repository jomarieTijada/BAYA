import React, { useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { AppTextInput } from '../ui/AppTextInput';
import { AppButton } from '../ui/AppButton';
import {
  useCloudServices,
  type AuthOutcome,
  type Challenge,
} from '../../modules/cloud/services';
import {
  authErrors,
  emailError,
  normalizeEmail,
} from '../../modules/cloud/validation';
import { useOperation } from '../../modules/cloud/useOperation';
import { FeatureScreen, Notice, TextAction, s } from './FeatureScreen';
import { PasswordField } from './PasswordField';
export function AuthScreen({
  mode = 'login',
}: {
  mode?: 'login' | 'register' | 'reset';
}) {
  const services = useCloudServices();
  const op = useOperation();
  const { width } = useWindowDimensions();
  const [values, setValues] = useState({
    name: '',
    email: '',
    password: '',
    confirm: '',
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof typeof values, string>>
  >({});
  const [challenge, setChallenge] = useState<Challenge>();
  const [resetEmail, setResetEmail] = useState<string>();
  const register = mode === 'register';
  const set = (key: keyof typeof values) => (value: string) =>
    setValues((current) => ({ ...current, [key]: value }));
  const outcome = (result: AuthOutcome) => {
    setValues((current) => ({ ...current, password: '', confirm: '' }));
    if (result.kind === 'authenticated') router.replace('/mentor/workspaces');
    else if (result.kind === 'otp') setChallenge(result.challenge);
    else
      op.setMessage(
        'Check your email to finish verifying your account, then log in.',
      );
  };
  if (challenge)
    return (
      <OtpScreen
        key={challenge.id}
        challenge={challenge}
        onBack={() => setChallenge(undefined)}
        onOutcome={outcome}
      />
    );
  if (resetEmail && services.auth.completePasswordReset) return (
    <RecoveryScreen email={resetEmail} onBack={() => setResetEmail(undefined)} />
  );
  const submit = () => {
    const next =
      mode === 'reset'
        ? { email: emailError(values.email) }
        : authErrors(values, register, services.policy);
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;
    if (mode === 'reset')
      void op.run(
        () => services.auth.resetPassword(normalizeEmail(values.email)),
        () => {
          if (services.auth.completePasswordReset) setResetEmail(normalizeEmail(values.email));
          op.setMessage(
            'If an eligible account exists, check your email for reset instructions.',
          );
        },
      );
    else
      void op.run(
        () =>
          register
            ? services.auth.register(
                values.name.trim(),
                normalizeEmail(values.email),
                values.password,
              )
            : services.auth.login(
                normalizeEmail(values.email),
                values.password,
              ),
        outcome,
      );
  };
  const email = (
    <AppTextInput
      density="form"
      label="EMAIL ADDRESS"
      required
      value={values.email}
      onChangeText={set('email')}
      error={errors.email}
      editable={!op.busy}
      keyboardType="email-address"
      autoComplete="email"
      placeholder="mentor@school.edu.ph"
    />
  );
  return (
    <FeatureScreen
      footer={
        mode === 'login' ? (
          <TextAction
            label="Don’t have a mentor account? Create Account"
            onPress={() => router.replace('/mentor/register')}
          />
        ) : undefined
      }
      wide={register}
      title={
        register
          ? 'CREATE MENTOR ACCOUNT'
          : mode === 'reset'
            ? 'RESET PASSWORD'
            : 'MENTOR LOGIN'
      }
      subtitle={
        register
          ? 'Set up your mentor account for managing learner workspaces.'
          : mode === 'reset'
            ? 'Enter your email to request password reset instructions.'
            : 'Access your workspaces and learner progress.'
      }
      onBack={() =>
        router.replace(register || mode === 'reset' ? '/mentor' : '/')
      }
    >
      {register ? (
        <View style={width >= 900 ? s.row : { gap: 22 }}>
          <View style={s.field}>
            <AppTextInput
              density="form"
              label="FULL NAME"
              required
              value={values.name}
              onChangeText={set('name')}
              error={errors.name}
              editable={!op.busy}
              autoCapitalize="words"
              autoComplete="name"
              placeholder="e.g. Maria Santos"
            />
          </View>
          <View style={s.field}>{email}</View>
        </View>
      ) : (
        email
      )}
      {mode !== 'reset' && (
        <View style={register && width >= 900 ? s.row : { gap: 22 }}>
          <View style={s.field}>
            <PasswordField
              labelAction={
                mode === 'login' ? (
                  <TextAction
                    label="Forgot Password?"
                    onPress={() => router.push('/mentor/reset-password')}
                  />
                ) : undefined
              }
              label="PASSWORD"
              value={values.password}
              onChangeText={set('password')}
              error={errors.password}
              disabled={op.busy}
            />
          </View>
          {register && (
            <View style={s.field}>
              <PasswordField
                label="CONFIRM PASSWORD"
                value={values.confirm}
                onChangeText={set('confirm')}
                error={errors.confirm}
                disabled={op.busy}
              />
            </View>
          )}
        </View>
      )}

      <Notice busy={op.busy} text={op.message} />
      <AppButton
        style={s.action}
        accessibilityLabel={
          register
            ? 'Create Account'
            : mode === 'reset'
              ? 'Request reset'
              : 'Log In'
        }
        label={
          op.busy
            ? 'PLEASE WAIT…'
            : register
              ? 'CREATE ACCOUNT'
              : mode === 'reset'
                ? 'REQUEST RESET'
                : 'LOG IN'
        }
        disabled={op.busy}
        icon="arrowRight"
        onPress={submit}
      />
      {register && (
        <TextAction
          label={
            register
              ? 'Already have a mentor account? Log in'
              : 'Don’t have a mentor account? Create Account'
          }
          onPress={() =>
            router.replace(register ? '/mentor' : '/mentor/register')
          }
        />
      )}
    </FeatureScreen>
  );
}
export function OtpScreen({
  challenge,
  onBack,
  onOutcome,
}: {
  challenge?: Challenge;
  onBack: () => void;
  onOutcome: (result: AuthOutcome) => void;
}) {
  const services = useCloudServices();
  const op = useOperation();
  const [current, setCurrent] = useState(challenge);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  return (
    <FeatureScreen
      title="VERIFY YOUR EMAIL"
      subtitle={
        current
          ? `Enter the verification code sent to ${current.email}.`
          : 'Start from Mentor Login to request a verification code.'
      }
      onBack={onBack}
    >
      <AppTextInput
        density="form"
        label="VERIFICATION CODE"
        required
        value={code}
        onChangeText={setCode}
        error={error}
        autoComplete="one-time-code"
        editable={!!current && !op.busy}
      />
      <Notice text={op.message} busy={op.busy} />
      <AppButton
        label="VERIFY"
        accessibilityLabel="Verify code"
        disabled={!current || op.busy}
        onPress={() => {
          if (!code.trim()) {
            setError('Enter your verification code.');
            return;
          }
          setError('');
          void op.run(
            () => services.auth.verify(current!.id, code.trim()),
            onOutcome,
          );
        }}
      />
      <TextAction
        label="Resend code"
        disabled={!current || op.busy}
        onPress={() => {
          void op.run(
            () => services.auth.resend(current!.id),
            (next) => {
              setCurrent(next);
              setCode('');
              op.setMessage('A new code has been sent.');
            },
          );
        }}
      />
    </FeatureScreen>
  );
}

function RecoveryScreen({ email, onBack }: { email: string; onBack: () => void }) {
  const services = useCloudServices();
  const op = useOperation();
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  return <FeatureScreen title="RESET PASSWORD" subtitle={done ? 'Your password has been updated. Log in with your new password.' : `If an eligible account exists, a reset code was sent to ${email}.`} onBack={onBack}>
    {done ? <AppButton label="GO TO LOGIN" accessibilityLabel="Go to login" onPress={() => router.replace('/mentor')} /> : <>
      <AppTextInput density="form" label="RESET CODE" required value={code} onChangeText={setCode} autoComplete="one-time-code" editable={!op.busy} />
      <PasswordField label="NEW PASSWORD" value={password} onChangeText={setPassword} disabled={op.busy} />
      <PasswordField label="CONFIRM PASSWORD" value={confirm} onChangeText={setConfirm} disabled={op.busy} />
      <Notice text={error || op.message} busy={op.busy} />
      <AppButton label="UPDATE PASSWORD" accessibilityLabel="Update password" disabled={op.busy} onPress={() => {
        const issue = !code.trim() ? 'Enter the reset code.' : !password ? 'Enter a new password.' : services.policy.passwordError?.(password) || (password !== confirm ? 'Passwords must match.' : '');
        setError(issue || '');
        if (issue) return;
        void op.run(() => services.auth.completePasswordReset!(email, code.trim(), password), () => {
          setPassword(''); setConfirm(''); setCode(''); setDone(true);
        });
      }} />
      <TextAction label="Request another code" onPress={onBack} disabled={op.busy} />
    </>}
  </FeatureScreen>;
}
