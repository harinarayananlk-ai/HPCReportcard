import React from 'react';
import { Stack } from 'expo-router';

export default function PartA4SecondaryLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ParentFeedback" />
    </Stack>
  );
}
