import { router } from 'expo-router';
import { BayaDialog } from '../ui/BayaDialog';
import React, { useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { Colors, FontFamily, Spacing } from '../../constants/theme';
import { AppButton } from '../ui/AppButton';
import {
  AppTextInput,
  type AppControlDensity,
} from '../ui/AppTextInput';
import { localLearnerService } from '../../database/services/localLearnerService';
import { isOpfsLockConflictError } from '../../database/connection';

type ProfileSetupFormProps = {
  density?: AppControlDensity;
  onContinue: () => void;
};

const NAME_REQUIRED_ERROR = 'Please enter your name.';

export function isValidLearnerName(value: string) {
  return value.trim().length > 0;
}

/** Saves the learner profile locally before entering the learner area. */
export function ProfileSetupForm({
  density = 'regular',
  onContinue,
}: ProfileSetupFormProps) {
  const [confirmIndependent, setConfirmIndependent] = useState(false);
  const [name, setName] = useState('');
  const [workspaceId, setWorkspaceId] = useState('');
  const [nameError, setNameError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const workspaceInputRef = useRef<TextInput>(null);
  const submissionLockedRef = useRef(false);

  const handleNameChange = (value: string) => {
    setName(value);
    if (nameError && isValidLearnerName(value)) {
      setNameError(undefined);
    }
  };

  const handleSubmit = async () => {
    if (submissionLockedRef.current) {
      return;
    }

    const trimmedName = name.trim();
    if (!isValidLearnerName(trimmedName)) {
      setNameError(NAME_REQUIRED_ERROR);
      return;
    }

    setName(trimmedName);
    setWorkspaceId(workspaceId.trim().toUpperCase());
    setNameError(undefined);
    submissionLockedRef.current = true;
    setIsSubmitting(true);
    try {
      await localLearnerService.saveProfile(trimmedName, workspaceId);
      setIsSubmitting(false);
      if (workspaceId.trim()) router.push({ pathname: '/learner/workspaces', params: { code: workspaceId.trim().toUpperCase() } });
      else setConfirmIndependent(true);
    } catch (error) {
      if (__DEV__) console.warn('[BAYA] Could not save learner profile', error);
      if (isOpfsLockConflictError(error)) {
        setNameError('Storage is busy in another window. Please close other BAYA tabs and try again.');
      } else {
        setNameError('Could not save your profile. Please try again.');
      }
      submissionLockedRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <View
      style={[
        styles.form,
        density === 'mobile' && styles.formMobile,
        density === 'compact' && styles.formCompact,
        density === 'landscapeCompact' && styles.formLandscapeCompact,
      ]}
    >
      <BayaDialog visible={confirmIndependent} title="Continue as an Independent Learner?"
        description="Your progress will stay on this device until you join a workspace."
        onDismiss={() => { setConfirmIndependent(false); submissionLockedRef.current = false; }}
        primaryAction={{ label: 'YES, CONTINUE', onPress: () => { setConfirmIndependent(false); onContinue(); } }}
        secondaryAction={{ label: 'NO, ENTER WORKSPACE ID', onPress: () => { setConfirmIndependent(false); router.push('/learner/workspaces'); } }} />
      <AppTextInput
        autoCapitalize="words"
        autoComplete="name"
        density={density}
        error={nameError}
        label="Your Name"
        onChangeText={handleNameChange}
        onSubmitEditing={() => workspaceInputRef.current?.focus()}
        placeholder="Enter your name"
        required
        returnKeyType="next"
        value={name}
      />

      <AppTextInput
        ref={workspaceInputRef}
        autoCapitalize="characters"
        autoCorrect={false}
        density={density}
        helperText="Have a Workspace ID? We’ll save it on this device for future mentor connection."
        label="Workspace ID"
        onBlur={() => setWorkspaceId((current) => current.trim().toUpperCase())}
        onChangeText={setWorkspaceId}
        onSubmitEditing={handleSubmit}
        optional
        placeholder="E.G. BAYA-1234"
        returnKeyType="done"
        value={workspaceId}
      />

      <View
        style={[
          styles.actionArea,
          density !== 'regular' && styles.actionAreaMobile,
          density === 'landscapeCompact' && styles.actionAreaLandscapeCompact,
        ]}
      >
        <AppButton
          accessibilityLabel="Continue learner profile setup"
          compact={density !== 'regular'}
          density={density === 'landscapeCompact' ? 'compact' : density}
          disabled={isSubmitting}
          icon="forward"
          label="CONTINUE"
          onPress={handleSubmit}
          style={density === 'landscapeCompact' ? styles.continueButtonLandscapeCompact : undefined}
        />
        <Text
          style={[
            styles.independentMessage,
            density !== 'regular' && styles.independentMessageMobile,
            density === 'compact' && styles.independentMessageCompact,
            density === 'landscapeCompact' && styles.independentMessageLandscapeCompact,
          ]}
        >
          No Workspace ID? You can continue independently.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: Spacing.sm,
    width: '100%',
  },
  formMobile: {
    gap: 12,
  },
  formCompact: {
    gap: 10,
  },
  formLandscapeCompact: {
    gap: 6,
  },
  actionArea: {
    marginTop: Spacing.sm,
  },
  actionAreaMobile: {
    marginTop: 8,
  },
  actionAreaLandscapeCompact: {
    marginTop: 6,
  },
  continueButtonLandscapeCompact: {
    height: 48,
    minHeight: 48,
  },
  independentMessage: {
    color: Colors.textMuted,
    fontFamily: FontFamily.body,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 12,
    textAlign: 'center',
  },
  independentMessageMobile: {
    fontSize: 14,
    lineHeight: 19,
    marginTop: Spacing.sm,
  },
  independentMessageCompact: {
    fontSize: 13,
    lineHeight: 17,
    marginTop: 6,
  },
  independentMessageLandscapeCompact: {
    fontSize: 12,
    lineHeight: 14,
    marginTop: 4,
  },
});
