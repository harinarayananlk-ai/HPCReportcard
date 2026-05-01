import React from 'react';
import { StyleSheet, View, Dimensions, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

const { width, height } = Dimensions.get('window');

const PaperPlaneAnimation = () => {
  // Use the high-quality HTML asset from the project
  const htmlAsset = require('../assets/images/paper_plane_journey.html');

  return (
    <View style={styles.container} pointerEvents="none">
      <WebView
        originWhitelist={['*']}
        source={htmlAsset}
        style={styles.webview}
        scrollEnabled={false}
        transparent={false} // Faster rendering when not transparent
        containerStyle={{ backgroundColor: '#111' }} // Match HTML background
        javaScriptEnabled={true}
        domStorageEnabled={true}
        scalesPageToFit={false} // Disable auto-scaling for performance
        mixedContentMode="always"
        allowFileAccess={true}
        androidLayerType="hardware" // Explicitly force hardware acceleration on Android
      />
      <View style={styles.overlay} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#111',
  },
  webview: {
    width: width,
    height: height,
    backgroundColor: '#111',
    opacity: 0.99, // Force hardware acceleration
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.05)', // Reduced opacity for better performance
  },
});

export default PaperPlaneAnimation;
