import React from 'react';
import { Stack } from 'expo-router';

export default function PartA2SecondaryLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SelfEvaluation" />
    </Stack>
  );
}
