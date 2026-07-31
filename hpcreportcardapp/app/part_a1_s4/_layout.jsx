import React from 'react';
import { Stack } from 'expo-router';

export default function PartA1SecondaryLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="GeneralInformation" />
    </Stack>
  );
}
