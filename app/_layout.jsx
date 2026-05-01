import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { Stack } from "expo-router";
import { GlobalContextProvider } from "../context/GlobalContext";
import LogoLoadingScreen from "../components/LogoLoadingScreen";
import CornerLogo from "../components/CornerLogo";
import GearGroup from "../components/GearGroup";

import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false);

  return (
    <GlobalContextProvider>
      <SafeAreaProvider>
        <View style={styles.container}>
        {/* Always render Stack so routes initialize correctly */}
        <View style={[styles.stackWrapper, { display: appReady ? "flex" : "none" }]}>
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