import { useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  Platform,
  StatusBar,
  Alert,
  ActivityIndicator,
  Dimensions,
  LogBox,
} from "react-native";

LogBox.ignoreLogs(['timer exceeded', '6000ms']);
import Animated, { 
  FadeInDown, 
  FadeInUp, 
  Layout,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming
} from "react-native-reanimated";
import DigitBoxes from "../components/DigitBoxes";
import SoundButton from "../components/SoundButton";
import GemButton from "../components/GemButton";
import PremiumBackground from "../components/PremiumBackground";
import { useTheme, useAuth, API_URL } from "../context/GlobalContext";
import { BlurView } from "expo-blur";

import { Image } from "react-native";
import { useRef } from "react";
import Svg, { Rect, Defs, LinearGradient, Stop } from 'react-native-svg';

const { width, height } = Dimensions.get("window");

export default function LoginScreen() {
  const { theme } = useTheme();
  const { setUser, setProfile, setSchoolInfo, setTeacherInfo } = useAuth();
  const [role, setRole] = useState("student");
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Teacher Explicit Field States
  const [udise, setUdise] = useState("");
  const [teacherCode, setTeacherCode] = useState("");
  const [showTeacherMenu, setShowTeacherMenu] = useState(false);
  const [showStudentMenu, setShowStudentMenu] = useState(false);

  const styles = getStyles(theme);

  const handleLogin = async (bypassCreds = null) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
      setLoading(true);
      const loginPayload = bypassCreds || { username, password, role };
      
      console.log(`[Login] Hitting endpoint: ${API_URL}/login`);

      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginPayload),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        setUser(data.user);
        setProfile(data.profile || null);
        setSchoolInfo(data.schoolInfo || null);
        setTeacherInfo(data.teacherInfo || null);
        
        const targetRole = data.user.role || loginPayload.role;

        if (targetRole === "superadmin") {
          router.push("/superadmin/Dashboard");
        } else if (targetRole === "teacher") {
          router.push("/Teacher");
        } else {
          router.push("/StudentHomepage");
        }
      } else {
        Alert.alert("Login Failed", data.message || "Invalid credentials");
      }
    } catch (err) {
      setLoading(false);
      clearTimeout(timeoutId);
      console.error("[Login] Error:", err);
      const msg = err.name === 'AbortError' 
        ? "Request timed out. Is the backend running at " + API_URL + "?"
        : "Could not connect to server. Check your network or backend logs.";
      Alert.alert("Connection Error", msg);
    }
  };

  return (
    <View style={styles.rootContainer}>
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} />

      <PremiumBackground gemColor={theme.accent} />

      <View style={styles.contentContainer}>
        <Animated.View 
        entering={FadeInUp.duration(1000).springify()}
        style={styles.headerSection}
      >
        <Text style={styles.brandTitle}>ACADEMIA</Text>
        <View style={styles.brandLineWrapper}>
          <Svg height="2" width="40" preserveAspectRatio="none">
            <Defs>
              <LinearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <Stop offset="0%" stopColor="#D4AF37" />
                <Stop offset="100%" stopColor="#F9E29C" />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="40" height="2" fill="url(#goldGrad)" />
          </Svg>
        </View>
      </Animated.View>

      <Animated.View 
        entering={FadeInDown.delay(200).duration(1000).springify()}
        style={styles.card}
      >
        {Platform.OS !== 'web' && (
          <BlurView intensity={65} tint="light" style={StyleSheet.absoluteFill} />
        )}
        <Text style={styles.title}>
          {role === "teacher" ? "Teacher Portal" : role === "superadmin" ? "Admin Access" : "Student Login"}
        </Text>
        <Text style={styles.subtitle}>Please authenticate to continue</Text>

        {/* Role selector */}
        <View style={styles.roleSelector}>
          {["student", "teacher", "superadmin"].map((r) => (
            <SoundButton
              key={r}
              style={[
                styles.roleButton,
                role === r && styles.activeRoleButton,
              ]}
              onPress={() => setRole(r)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.roleText,
                  role === r && styles.activeRoleText,
                ]}
              >
                {r === 'superadmin' ? 'ADMIN' : r.toUpperCase()}
              </Text>
            </SoundButton>
          ))}
        </View>

        {/* Inputs */}
        <Animated.View layout={Layout.springify()} style={styles.inputContainer}>
          {role === "teacher" || role === "superadmin" ? (
            <>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>
                  {role === "superadmin" ? "ADMIN ID" : "UDISE CODE"}
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder={role === "superadmin" ? "Username" : "11-Digit UDISE"}
                  placeholderTextColor={theme.secondaryText + "80"}
                  value={role === "superadmin" ? username : udise}
                  onChangeText={role === "superadmin" ? setUsername : setUdise}
                />
              </View>
              {role === "teacher" && (
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Teacher Code</Text>
                  <DigitBoxes length={3} value={teacherCode} onValueChange={setTeacherCode} />
                </View>
              )}
            </>
          ) : (
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Registration Number</Text>
              <TextInput
                style={styles.input}
                placeholder="ROLL_NUMBER"
                placeholderTextColor={theme.secondaryText + "80"}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>
          )}

          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={theme.secondaryText + "80"}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>
        </Animated.View>

        {/* Login Button */}
        <GemButton
          onPress={() => handleLogin()}
          disabled={loading}
        >
          {loading ? (
             <ActivityIndicator color={theme.buttonText} />
          ) : (
             <Text style={styles.buttonText}>LOGIN</Text>
          )}
        </GemButton>

      </Animated.View>
      </View>

      {/* Tiny Bypass Buttons on Sides - Simplified */}
      <View style={styles.absoluteBypassLeft}>
        {showStudentMenu ? (
          <>
            <SoundButton style={[styles.tinyBypassBtn, { backgroundColor: '#F5F5F0', marginTop: 10 }]} onPress={() => handleLogin({ username: 's_ladoo', password: 'navy-2824-ladoo', role: 'student' })}>
              <Text style={[styles.tinyBypassText, {fontSize: 8}]}>SF</Text>
            </SoundButton>
            <SoundButton style={[styles.tinyBypassBtn, { backgroundColor: '#F5F5F0', marginTop: 10 }]} onPress={() => handleLogin({ username: 's_bittoo', password: 'dusk-4150-bittoo', role: 'student' })}>
              <Text style={[styles.tinyBypassText, {fontSize: 8}]}>SP</Text>
            </SoundButton>
            <SoundButton style={[styles.tinyBypassBtn, { backgroundColor: '#F5F5F0', marginTop: 10 }]} onPress={() => handleLogin({ username: 's_imli_6a', password: 'pearl-8573-imli', role: 'student' })}>
              <Text style={[styles.tinyBypassText, {fontSize: 8}]}>SM</Text>
            </SoundButton>
            <SoundButton style={[styles.tinyBypassBtn, { backgroundColor: '#F5F5F0', marginTop: 10 }]} onPress={() => handleLogin({ username: 's_urad_9a', password: 'ruby-5339-urad', role: 'student' })}>
              <Text style={[styles.tinyBypassText, {fontSize: 8}]}>SS</Text>
            </SoundButton>
          </>
        ) : (
          <SoundButton
            style={[styles.tinyBypassBtn, { backgroundColor: '#F5F5F0' }]}
            onPress={() => setShowStudentMenu(true)}
          >
            <Text style={styles.tinyBypassText}>S</Text>
          </SoundButton>
        )}
      </View>

      <View style={styles.absoluteBypassLeftRight}>
        {showTeacherMenu ? (
          <>
            <SoundButton style={[styles.tinyBypassBtn, { backgroundColor: '#F5F5F0', marginTop: 10 }]} onPress={() => handleLogin({ username: 't_murugan', password: 'pass123', role: 'teacher' })}>
              <Text style={[styles.tinyBypassText, {fontSize: 8}]}>TF</Text>
            </SoundButton>
            <SoundButton style={[styles.tinyBypassBtn, { backgroundColor: '#F5F5F0', marginTop: 10 }]} onPress={() => handleLogin({ username: 't_chai', password: 'pass123', role: 'teacher' })}>
              <Text style={[styles.tinyBypassText, {fontSize: 8}]}>TP</Text>
            </SoundButton>
            <SoundButton style={[styles.tinyBypassBtn, { backgroundColor: '#F5F5F0', marginTop: 10 }]} onPress={() => handleLogin({ username: 't_roti', password: 'pass123', role: 'teacher' })}>
              <Text style={[styles.tinyBypassText, {fontSize: 8}]}>TM</Text>
            </SoundButton>
            <SoundButton style={[styles.tinyBypassBtn, { backgroundColor: '#F5F5F0', marginTop: 10 }]} onPress={() => handleLogin({ username: 't_laddu', password: 'pass123', role: 'teacher' })}>
              <Text style={[styles.tinyBypassText, {fontSize: 8}]}>TS</Text>
            </SoundButton>
          </>
        ) : (
          <SoundButton
            style={[styles.tinyBypassBtn, { backgroundColor: '#F5F5F0', marginTop: 10 }]}
            onPress={() => setShowTeacherMenu(true)}
          >
            <Text style={styles.tinyBypassText}>T</Text>
          </SoundButton>
        )}
        <SoundButton
          style={[styles.tinyBypassBtn, { backgroundColor: '#F5F5F0', marginTop: 10 }]}
          onPress={() => handleLogin({ username: 'superadmin', password: 'admin123', role: 'superadmin' })}
        >
          <Text style={styles.tinyBypassText}>A</Text>
        </SoundButton>
      </View>
    </View>
  );
}

const getStyles = (theme) => StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: theme.background,
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 48,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: "300", // Sleek minimalist thinner font
    color: theme.text,
    letterSpacing: 8,
    fontFamily: "Jost_300Light",
    textShadowColor: "rgba(0,0,0,0.2)", // Neutral subtle shadow
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  brandLineWrapper: {
    marginTop: 12,
    alignItems: "center",
  },
  card: {
    backgroundColor: theme.isDark ? "rgba(30, 30, 30, 0.5)" : "rgba(255, 255, 255, 0.45)", // Frosted glass translucent fill
    borderRadius: 16,
    padding: 32,
    overflow: 'hidden', // Contain the BlurView bounds
    borderWidth: 1,
    borderColor: theme.primary + '80', // Gold/Accent border
    ...Platform.select({
      ios: {
        shadowColor: theme.isDark ? "#000" : theme.secondaryText,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.text,
    textAlign: "center",
    marginBottom: 6,
    letterSpacing: 3,
    fontFamily: "Jost_600SemiBold",
  },
  subtitle: {
    fontSize: 10,
    color: theme.secondaryText,
    textAlign: "center",
    marginBottom: 32,
    fontWeight: "400",
    textTransform: "uppercase",
    letterSpacing: 2,
    fontFamily: "Jost_400Regular",
  },
  roleSelector: {
    flexDirection: "row",
    backgroundColor: 'transparent',
    borderRadius: 8,
    padding: 2,
    marginBottom: 36,
    borderWidth: 1,
    borderColor: theme.primary + '50', // Gold highlight
  },
  roleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: "center",
  },
  activeRoleButton: {
    backgroundColor: theme.background,
    shadowColor: theme.accent, // Frugal sapphire highlight
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9, // MORE SHINE
    shadowRadius: 16, // MORE SHINE
    borderColor: theme.accent, // Subtle sapphire border
    borderWidth: 1,
  },
  roleText: {
    fontSize: 9,
    fontWeight: "500",
    color: theme.secondaryText,
    letterSpacing: 1.5,
    fontFamily: "Jost_400Regular",
  },
  activeRoleText: {
    color: theme.text,
    fontWeight: "700",
  },
  inputContainer: {
    marginBottom: 10,
  },
  inputWrapper: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 9,
    fontWeight: "600",
    color: theme.secondaryText,
    letterSpacing: 2,
    marginBottom: 8,
    fontFamily: "Jost_600SemiBold",
  },
  input: {
    height: 48,
    borderBottomWidth: 1,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderColor: "#2E5894", // Sapphire Blue Underline
    paddingHorizontal: 8,
    backgroundColor: 'transparent',
    color: theme.text,
    fontSize: 14,
    fontFamily: "Jost_400Regular",
  },
  button: {
    paddingVertical: 16,
    borderRadius: 8, // Sleek radius
    marginTop: 12,
    shadowColor: theme.isDark ? "#000" : theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
    backgroundColor: theme.primary,
  },
  buttonText: {
    color: theme.buttonText,
    fontSize: 12,
    textAlign: "center",
    fontWeight: "700",
    letterSpacing: 3,
    fontFamily: "Jost_600SemiBold",
  },
  absoluteBypassLeft: {
    position: 'absolute',
    left: 20,
    bottom: 40,
    zIndex: 10,
    flexDirection: 'column-reverse',
  },
  absoluteBypassLeftRight: {
    position: 'absolute',
    left: 70, // Positioned side-by-side with student bypass button
    bottom: 40, // Same bottom level to align horizontally
    zIndex: 10,
    flexDirection: 'column-reverse',
  },

  tinyBypassBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: '#B89336', // Gold border
    elevation: 0, // Remove shadow
    shadowOpacity: 0, // Remove shadow
  },
  tinyBypassText: {
    fontSize: 10,
    fontWeight: "800",
    color: '#B89336', // Gold text
  },
});