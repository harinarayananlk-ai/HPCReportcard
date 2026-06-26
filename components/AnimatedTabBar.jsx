import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../context/GlobalContext';
import { gems } from '../colour_themes';

export default function AnimatedTabBar({ tabs, activeIndex, onTabChange }) {
  const { theme } = useTheme();
  const [containerWidth, setContainerWidth] = useState(0);
  const indicatorTranslateX = useSharedValue(0);

  const handleLayout = (event) => {
    const { width } = event.nativeEvent.layout;
    setContainerWidth(width);
    // Initial indicator position
    indicatorTranslateX.value = activeIndex * (width / tabs.length);
  };

  const handleTabPress = (index) => {
    onTabChange(index);
    if (containerWidth > 0) {
      const tabWidth = containerWidth / tabs.length;
      indicatorTranslateX.value = withSpring(index * tabWidth, {
        damping: 18,
        stiffness: 120,
      });
    }
  };

  // Sync indicator position if activeIndex changes from parent
  React.useEffect(() => {
    if (containerWidth > 0) {
      const tabWidth = containerWidth / tabs.length;
      indicatorTranslateX.value = withSpring(activeIndex * tabWidth, {
        damping: 18,
        stiffness: 120,
      });
    }
  }, [activeIndex, containerWidth, tabs.length]);

  const indicatorStyle = useAnimatedStyle(() => {
    const tabWidth = containerWidth ? containerWidth / tabs.length : 0;
    return {
      width: tabWidth,
      transform: [{ translateX: indicatorTranslateX.value }],
    };
  });

  return (
    <View
      style={[
        styles.tabBarContainer,
        {
          backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
          borderColor: theme.border,
        },
      ]}
      onLayout={handleLayout}
    >
      {/* Sliding Background Indicator */}
      {containerWidth > 0 && (
        <Animated.View
          style={[
            styles.indicator,
            indicatorStyle,
            { backgroundColor: gems.sapphire },
          ]}
        />
      )}

      {/* Tabs */}
      {tabs.map((tab, index) => {
        const isActive = activeIndex === index;
        return (
          <TouchableOpacity
            key={index}
            style={styles.tab}
            onPress={() => handleTabPress(index)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color: isActive
                    ? '#FFFFFF'
                    : theme.secondaryText,
                  fontWeight: isActive ? '700' : '400',
                },
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    padding: 3,
    position: 'relative',
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  indicator: {
    position: 'absolute',
    top: 3,
    bottom: 3,
    borderRadius: 21,
  },
  tab: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  tabText: {
    fontSize: 12,
    letterSpacing: 1,
    fontFamily: 'Outfit_600SemiBold',
    textTransform: 'uppercase',
  },
});
