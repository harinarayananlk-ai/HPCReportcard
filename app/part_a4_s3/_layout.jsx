import React from 'react';
import { Stack } from 'expo-router';

export default function PartA4Layout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ParentFeedback" />
    </Stack>
  );
}
