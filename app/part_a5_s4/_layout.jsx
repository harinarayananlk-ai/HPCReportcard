import React from 'react';
import { Stack } from 'expo-router';

export default function PartA5SecondaryLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CoCurricular" />
    </Stack>
  );
}
