import { Text } from '../../localization/components';
import { useBayaToast } from '../ui/BayaNotifications';
import React, { useEffect, useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { AppTextInput } from '../ui/AppTextInput';
import { AppButton } from './MentorButton';
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
  const toast = useBayaToast();
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
    if (result.kind === 'authenticated') { toast('You’re signed in.'); router.replace('/mentor/workspaces'); }
    else if (result.kind === 'otp') { setChallenge(result.challenge); toast('Verification code requested. Check your email.'); }
    else
      op.setMessage(
        'If confirmation is needed, check your email. If you already have an account, log in or use Forgot Password.',
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
    let next;
    if (mode === 'reset') {
      next = { email: emailError(values.email) };
    } else {
      next = authErrors(values, register, services.policy);
    }
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;
    if (mode === 'reset')
      void op.run(
        () => services.auth.resetPassword(normalizeEmail(values.email)),
        () => {
          toast('If an eligible account exists, check your email for reset instructions.', 'information');
          if (services.auth.completePasswordReset) setResetEmail(normalizeEmail(values.email));
          op.setMessage(
            'If an eligible account exists, check your email for reset instructions.',
          );
        },
      );
    else
      void op.run(
        () =>
          {
          if (register) {
            return services.auth.register(
                values.name.trim(),
                normalizeEmail(values.email),
                values.password,
              );
          } else {
            return services.auth.login(
                normalizeEmail(values.email),
                values.password,
              );
          }
        },
        outcome,
      );
  };
  const email = (
    <AppTextInput
      density="landscapeCompact"
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
        (() => {
          if (mode === 'login') {
            return (
          <TextAction
            label="Don’t have a mentor account? Create Account"
            onPress={() => router.replace('/mentor/register')}
          />
        );
          } else {
            return undefined;
          }
        })()
      }
      wide={register}
      title={
        (() => {
          if (register) {
            return 'CREATE MENTOR ACCOUNT';
          } else {
            if (mode === 'reset') {
              return 'RESET PASSWORD';
            } else {
              return 'MENTOR LOGIN';
            }
          }
        })()
      }
      subtitle={
        (() => {
          if (register) {
            return 'Set up your mentor account for managing learner workspaces.';
          } else {
            if (mode === 'reset') {
              return 'Enter your email to request password reset instructions.';
            } else {
              return 'Access your workspaces and learner progress.';
            }
          }
        })()
      }
      onBack={() =>
        router.replace((() => {
          if (register || mode === 'reset') {
            return '/mentor';
          } else {
            return '/';
          }
        })())
      }
    >
      {(() => {
        if (register) {
          return (
        <View style={(() => {
          if (width >= 600) {
            return s.row;
          } else {
            return { gap: 8 };
          }
        })()}>
          <View style={s.field}>
            <AppTextInput
              density="landscapeCompact"
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
      );
        } else {
          return (
        email
      );
        }
      })()}
      {mode !== 'reset' && (
        <View style={(() => {
          if (register && width >= 600) {
            return s.row;
          } else {
            return { gap: 8 };
          }
        })()}>
          <View style={s.field}>
            <PasswordField
              labelAction={
                (() => {
                  if (mode === 'login') {
                    return (
                  <TextAction
                    label="Forgot Password?"
                    onPress={() => router.push('/mentor/reset-password')}
                  />
                );
                  } else {
                    return undefined;
                  }
                })()
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
      <AppButton density="landscapeCompact" compact
        style={s.action}
        accessibilityLabel={
          (() => {
            if (register) {
              return 'Create Account';
            } else {
              if (mode === 'reset') {
                return 'Request reset';
              } else {
                return 'Log In';
              }
            }
          })()
        }
        label={
          (() => {
            if (op.busy) {
              return 'PLEASE WAIT…';
            } else {
              if (register) {
                return 'CREATE ACCOUNT';
              } else {
                if (mode === 'reset') {
                  return 'REQUEST RESET';
                } else {
                  return 'LOG IN';
                }
              }
            }
          })()
        }
        disabled={op.busy}
        icon="arrowRight"
        onPress={submit}
      />
      {register && (
        <TextAction
          label={
            (() => {
              if (register) {
                return 'Already have a mentor account? Log in';
              } else {
                return 'Don’t have a mentor account? Create Account';
              }
            })()
          }
          onPress={() =>
            router.replace((() => {
              if (register) {
                return '/mentor';
              } else {
                return '/mentor/register';
              }
            })())
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
  const toast = useBayaToast();
  const services = useCloudServices();
  const op = useOperation();
  const [current, setCurrent] = useState(challenge);
  const [resendAt, setResendAt] = useState(() => Date.now() + 60000);
  const [remainingSeconds, setRemainingSeconds] = useState(60);
  useEffect(() => {
    if (!current) return;
    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((resendAt - Date.now()) / 1000));
      setRemainingSeconds(remaining);
      if (remaining === 0) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [current, resendAt]);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  return (
    <FeatureScreen
      title="VERIFY YOUR EMAIL"
      subtitle={
        (() => {
          if (current) {
            return `Enter the verification code sent to ${current.email}.`;
          } else {
            return 'Start from Mentor Login to request a verification code.';
          }
        })()
      }
      onBack={onBack}
    >
      <AppTextInput
        density="landscapeCompact"
        label="VERIFICATION CODE"
        required
        value={code}
        onChangeText={setCode}
        error={error}
        autoComplete="one-time-code"
        editable={!!current && !op.busy}
      />
      <Notice text={op.message} busy={op.busy} />
      {current && <Text style={s.notice}>
        {(() => {
          if (remainingSeconds > 0) {
            return `You can request another code in ${Math.floor(remainingSeconds / 60)}:${String(remainingSeconds % 60).padStart(2, '0')}.`;
          } else {
            return 'You can now request another code.';
          }
        })()}
      </Text>}
      <AppButton density="landscapeCompact" compact
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
        disabled={!current || op.busy || remainingSeconds > 0}
        onPress={() => {
          if (Date.now() < resendAt) return;
          void op.run(
            () => services.auth.resend(current!.id),
            (next) => {
              setCurrent(next);
              setCode('');
              setResendAt(Date.now() + 60000);
              setRemainingSeconds(60);
              toast('Verification code requested. Check your email.');
            },
          );
        }}
      />
    </FeatureScreen>
  );
}

function RecoveryScreen({ email, onBack }: { email: string; onBack: () => void }) {
  const toast = useBayaToast();
  const services = useCloudServices();
  const op = useOperation();
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  return <FeatureScreen title="RESET PASSWORD" subtitle={(() => {
    if (done) {
      return 'Your password has been updated. Log in with your new password.';
    } else {
      return `If an eligible account exists, a reset code was sent to ${email}.`;
    }
  })()} onBack={onBack}>
    {(() => {
      if (done) {
        return <AppButton density="landscapeCompact" compact label="GO TO LOGIN" accessibilityLabel="Go to login" onPress={() => router.replace('/mentor')} />;
      } else {
        return <>
      <AppTextInput density="landscapeCompact" label="RESET CODE" required value={code} onChangeText={setCode} autoComplete="one-time-code" editable={!op.busy} />
      <PasswordField label="NEW PASSWORD" value={password} onChangeText={setPassword} disabled={op.busy} />
      <PasswordField label="CONFIRM PASSWORD" value={confirm} onChangeText={setConfirm} disabled={op.busy} />
      <Notice text={error || op.message} busy={op.busy} />
      <AppButton density="landscapeCompact" compact label="UPDATE PASSWORD" accessibilityLabel="Update password" disabled={op.busy} onPress={() => {
        let issue;
        if (!code.trim()) {
          issue = 'Enter the reset code.';
        } else {
          if (!password) {
            issue = 'Enter a new password.';
          } else {
            issue = services.policy.passwordError?.(password) || ((() => {
          if (password !== confirm) {
            return 'Passwords must match.';
          } else {
            return '';
          }
        })());
          }
        }
        setError(issue || '');
        if (issue) return;
        void op.run(() => services.auth.completePasswordReset!(email, code.trim(), password), () => {
          toast('Password updated.');
          setPassword(''); setConfirm(''); setCode(''); setDone(true);
        });
      }} />
      <TextAction label="Request another code" onPress={onBack} disabled={op.busy} />
    </>;
      }
    })()}
  </FeatureScreen>;
}
