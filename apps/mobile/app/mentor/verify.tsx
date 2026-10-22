import React from "react";
import { router } from "expo-router";
import { OtpScreen } from "../../components/mentor/AuthScreen";
export default function Verify() {
  return (
    <OtpScreen onBack={() => router.replace("/mentor")} onOutcome={() => {}} />
  );
}
