import React from 'react';
import { Stack } from 'expo-router';

export default function PartA3MiddleLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AmbitionCard" />
    </Stack>
  );
}
