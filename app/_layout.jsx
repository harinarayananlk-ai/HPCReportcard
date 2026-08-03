import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { Stack } from "expo-router";
import { GlobalContextProvider } from "../context/GlobalContext";
import LogoLoadingScreen from "../components/LogoLoadingScreen";
import CornerLogo from "../components/CornerLogo";
import GearGroup from "../components/GearGroup";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts, Jost_300Light, Jost_400Regular, Jost_600SemiBold } from '@expo-google-fonts/jost';
import { Outfit_300Light, Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold } from '@expo-google-fonts/outfit';
import { Inter_300Light, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Jost_300Light,
    Jost_400Regular,
    Jost_600SemiBold,
    Outfit_300Light,
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Inter_300Light,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    'Outfit-Bold': Outfit_700Bold,
    'Outfit-Regular': Outfit_400Regular,
  });
  const [appReady, setAppReady] = useState(false);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GlobalContextProvider>
        <SafeAreaProvider>
          <View style={styles.container}>
          {/* Always render Stack so routes initialize correctly */}
          <View style={[styles.stackWrapper, { opacity: appReady ? 1 : 0 }]}>
            <Stack 
              screenOptions={{ 
                headerShown: false,
                animation: 'fade_from_bottom',
              }} 
            />
            {appReady && (
              <>
                <CornerLogo />
                <GearGroup />
              </>
            )}
          </View>

          {/* Overlay the loading screen */}
          {!appReady && (
            <LogoLoadingScreen onComplete={() => setAppReady(true)} />
          )}
          </View>
        </SafeAreaProvider>
      </GlobalContextProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  stackWrapper: {
    flex: 1,
  }
});