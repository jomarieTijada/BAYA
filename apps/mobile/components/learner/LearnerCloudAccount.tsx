import React, { useCallback, useState } from 'react';
import { router } from 'expo-router';
import { Text } from 'react-native';
import { useCloudServices, failureMessage, type Challenge } from '../../modules/cloud/services';
import { useCloudRead } from '../../modules/progress/useCloudRead';
import { useOperation } from '../../modules/cloud/useOperation';
import { emailError } from '../../modules/cloud/validation';
import { AppTextInput } from '../ui/AppTextInput';
import { AppButton } from '../ui/AppButton';
import { FeatureScreen, Notice, TextAction, s } from '../mentor/FeatureScreen';

export function LearnerCloudAccount({ children }: React.PropsWithChildren) {
  const {learnerAuth} = useCloudServices();
  const op = useOperation();
  const [email,setEmail] = useState('');
  const [code,setCode] = useState('');
  const [challenge,setChallenge] = useState<Challenge>();
  const [error,setError] = useState<string>();
  const {result,refresh} = useCloudRead(useCallback(() => learnerAuth ? learnerAuth.session() : Promise.resolve({ok:false as const,code:'unavailable' as const}),[learnerAuth]));
  if (result?.ok && result.data) {
    if (children) return <>{children}</>;
    return <FeatureScreen title="LEARNER CLOUD ACCOUNT" subtitle={result.data.email} onBack={() => router.replace('/learner/settings')}>
      <Text style={s.notice}>Your learner account is verified. Saved learning stays on this device when you sign out.</Text>
      <AppButton label="JOIN WORKSPACE" accessibilityLabel="Join workspace" onPress={() => router.push('/learner/workspaces/join')} />
      <TextAction label="Sign out learner" disabled={op.busy} onPress={() => { void op.run(() => learnerAuth!.signOut(),refresh); }} />
      <Notice text={op.message} busy={op.busy} />
    </FeatureScreen>;
  }
  return <FeatureScreen title="LEARNER CLOUD ACCOUNT" subtitle="Verify your learner email to join a workspace and share progress. Offline learning remains available." onBack={() => router.replace('/learner/home')}>
    {!result ? <Notice busy text="Checking your learner account…" /> : !result.ok ? <><Notice text={failureMessage[result.code]} />{learnerAuth && <TextAction label="Clear learner sign-in" disabled={op.busy} onPress={() => {void op.run(() => learnerAuth.signOut(),refresh);}} />}<Notice text={op.message} busy={op.busy} /><TextAction label="Retry account" onPress={refresh} /><TextAction label="Return to learner profile" onPress={() => router.replace('/learner/home')} /></> : <>
      <Text style={s.notice}>Use a separate email for each learner. Use a different email from your mentor account. This local profile stays linked to its first verified learner account.</Text>
      <AppTextInput density="form" label="LEARNER EMAIL" keyboardType="email-address" autoCapitalize="none" autoComplete="email" value={email} onChangeText={setEmail} editable={!op.busy && !challenge} error={!challenge ? error : undefined} />
      {challenge && <AppTextInput density="form" label="VERIFICATION CODE" autoComplete="one-time-code" keyboardType="number-pad" value={code} onChangeText={setCode} editable={!op.busy} error={error} />}
      <Notice busy={op.busy} text={op.message} />
      <AppButton label={challenge ? 'VERIFY EMAIL' : 'SEND CODE'} accessibilityLabel={challenge ? 'Verify learner email' : 'Send learner code'} disabled={op.busy} onPress={() => {
        const issue = challenge ? (!code.trim() ? 'Enter the code from your email.' : undefined) : emailError(email); setError(issue); if(issue) return;
        if(challenge) void op.run(() => learnerAuth!.verify(challenge.id,code.trim()),() => {setCode('');setChallenge(undefined);refresh();});
        else void op.run(() => learnerAuth!.request(email),setChallenge);
      }} />
      {challenge && <><TextAction label="Resend learner code" disabled={op.busy} onPress={() => {void op.run(() => learnerAuth!.request(challenge.email),next => {setChallenge(next);setCode('');op.setMessage('A new code has been sent.');});}} /><TextAction label="Use another email" disabled={op.busy} onPress={() => {setChallenge(undefined);setCode('');setError(undefined);}} /></>}
    </>}
  </FeatureScreen>;
}

