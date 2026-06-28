import { View, StyleSheet, Platform, Pressable } from "react-native";
import Svg, { Rect, G } from "react-native-svg";
import { useTheme } from "../context/GlobalContext";
import { useRouter } from "expo-router";

// Mathematically perfect logo coordinates matching LogoLoadingScreen
const VIEWBOX_WIDTH = 240;
const VIEWBOX_HEIGHT = 150;
const STROKE_WIDTH = 13;
const CORNER_RADIUS = 15;
const FRAME_WIDTH = 160;
const FRAME_HEIGHT = 120;
const FRAME_X = 20;
const FRAME_Y = 15;

// Inside background coordinates
const INSIDE_GAP = 15;
const INSIDE_X = FRAME_X + INSIDE_GAP;
const INSIDE_Y = FRAME_Y + INSIDE_GAP;
const INSIDE_WIDTH = FRAME_WIDTH - (2 * INSIDE_GAP);
const INSIDE_HEIGHT = FRAME_HEIGHT - (2 * INSIDE_GAP);
const INSIDE_RADIUS = 8;

export default function CornerLogo() {
  const { theme } = useTheme();
  const router = useRouter();

  const isDark = theme && (theme.isDark === true || (theme.name && theme.name.toLowerCase().includes("dark")));
  const logoColor = "#2E5894"; // Permanently Sapphire Blue
  const bgColor = isDark ? "#0A0A0A" : "#FFFFFF";
  const insideBarColor = bgColor; // White in light mode, black in dark mode

  return (
    <Pressable 
      style={styles.container} 
      onPress={() => router.push("/credits")}
    >
      <Svg width={40} height={30} viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}>
        {/* Shift X by 65 and skewX by -29 for a perfectly contained slanted parallelogram */}
        <G transform="translate(65, 0) skewX(-29)">
          {/* 1. Perfect Rounded Parallelogram Frame Outline */}
          <Rect
            x={FRAME_X}
            y={FRAME_Y}
            width={FRAME_WIDTH}
            height={FRAME_HEIGHT}
            rx={CORNER_RADIUS}
            ry={CORNER_RADIUS}
            fill="none"
            stroke={logoColor}
            strokeWidth={STROKE_WIDTH}
          />

          {/* 2. The Inside Background Fill (Separated by a perfect gap) */}
          <Rect
            x={INSIDE_X}
            y={INSIDE_Y}
            width={INSIDE_WIDTH}
            height={INSIDE_HEIGHT}
            rx={INSIDE_RADIUS}
            ry={INSIDE_RADIUS}
            fill={logoColor}
          />

          {/* 3. Symmetrical Bars (Sharp corners, colored with background color inside) */}
          {/* Slot 1 is left empty! */}
          
          {/* Slot 2 (Bar 1) */}
          <Rect
            x={64}
            y={100}
            width={20}
            height={20}
            fill={insideBarColor}
          />
          {/* Slot 3 (Bar 2) */}
          <Rect
            x={90}
            y={80}
            width={20}
            height={40}
            fill={insideBarColor}
          />
          {/* Slot 4 (Bar 3) */}
          <Rect
            x={116}
            y={60}
            width={20}
            height={60}
            fill={insideBarColor}
          />
          {/* Slot 5 (Bar 4) */}
          <Rect
            x={142}
            y={40}
            width={20}
            height={80}
            fill={insideBarColor}
          />
        </G>
      </Svg>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: Platform.OS === 'ios' ? 56 : 36,
    right: 20,
    zIndex: 1000,
    opacity: 1.0,
  }
});
