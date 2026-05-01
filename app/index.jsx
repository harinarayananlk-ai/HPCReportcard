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
} from "react-native";
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
import { useTheme, useAuth, API_URL } from "../context/GlobalContext";

import { useVideoPlayer, VideoView } from "expo-video";
import { useRef } from "react";

const { width, height } = Dimensions.get("window");

export default function LoginScreen() {
  const { theme } = useTheme();
  const { setUser, setProfile } = useAuth();
  const [role, setRole] = useState("student");
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const player = useVideoPlayer(require("../assets/images/Background_animation_forest.mp4"), (p) => {
    p.loop = true;
    p.play();
    p.muted = true;
  });
  
  // Teacher Explicit Field States
  const [udise, setUdise] = useState("");
  const [teacherCode, setTeacherCode] = useState("");

  const styles = getStyles(theme);

  const handleLogin = async (bypassCreds = null) => {
    try {
      setLoading(true);
      const loginPayload = bypassCreds || { username, password, role };
      
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginPayload)
      });
      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        setUser(data.user);
        setProfile(data.profile || null);
        
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
      Alert.alert("Error", "Could not connect to server. Ensure 'python Backend/main.py' is running!");
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} />

      {/* Cinematic Video Background */}
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls={false}
      />
      {/* Glass Overlay for Depth */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.isDark ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.3)" }]} />

      <Animated.View 
        entering={FadeInUp.duration(1000).springify()}
        style={styles.headerSection}
      >
        <Text style={styles.brandTitle}>ACADEMIA</Text>
        <View style={styles.brandLine} />
      </Animated.View>

      <Animated.View 
        entering={FadeInDown.delay(200).duration(1000).springify()}
        style={styles.card}
      >
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
        <SoundButton
          style={[styles.button, { backgroundColor: theme.accent }]}
          onPress={() => handleLogin()}
          activeOpacity={0.8}
          disabled={loading}
        >
          {loading ? (
             <ActivityIndicator color={theme.buttonText} />
          ) : (
             <Text style={styles.buttonText}>LOGIN</Text>
          )}
        </SoundButton>

        {/* Quick Login - More subtle */}
        <View style={styles.bypassContainer}>
          <Text style={styles.bypassHeader}>DEBUG_BYPASS</Text>
          <View style={styles.bypassRow}>
            <SoundButton
              style={[styles.smallBypassBtn, { backgroundColor: theme.surface }]}
              onPress={() => handleLogin({ username: 's_ladoo', password: 'pass123', role: 'student' })}
            >
              <Text style={[styles.smallBypassText, { color: theme.text }]}>LADOO</Text>
            </SoundButton>
            
            <SoundButton
              style={[styles.smallBypassBtn, { backgroundColor: theme.surface }]}
              onPress={() => handleLogin({ username: 't_murugan', password: 'pass123', role: 'teacher' })}
            >
              <Text style={[styles.smallBypassText, { color: theme.text }]}>MURUGAN</Text>
            </SoundButton>

            <SoundButton
              style={[styles.smallBypassBtn, { backgroundColor: theme.surface }]}
              onPress={() => handleLogin({ username: 'superadmin', password: 'admin123', role: 'superadmin' })}
            >
              <Text style={[styles.smallBypassText, { color: theme.text }]}>ADMIN</Text>
            </SoundButton>
          </View>
        </View>

      </Animated.View>
    </View>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: theme.background,
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 40,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: theme.text,
    letterSpacing: 4,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  brandLine: {
    width: 40,
    height: 4,
    backgroundColor: theme.accent,
    marginTop: 8,
    borderRadius: 2,
  },
  card: {
    backgroundColor: theme.glass || theme.card,
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    borderColor: theme.border,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.2,
        shadowRadius: 24,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  title: {
    fontSize: 18,
    fontWeight: "900",
    color: theme.text,
    textAlign: "center",
    marginBottom: 4,
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  subtitle: {
    fontSize: 10,
    color: theme.secondaryText,
    textAlign: "center",
    marginBottom: 32,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  roleSelector: {
    flexDirection: "row",
    backgroundColor: theme.background,
    borderRadius: 14,
    padding: 4,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: theme.border,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  activeRoleButton: {
    backgroundColor: theme.accent,
  },
  roleText: {
    fontSize: 10,
    fontWeight: "800",
    color: theme.secondaryText,
    letterSpacing: 1,
  },
  activeRoleText: {
    color: theme.buttonText,
  },
  inputContainer: {
    marginBottom: 10,
  },
  inputWrapper: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 9,
    fontWeight: "900",
    color: theme.secondaryText,
    letterSpacing: 2,
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: theme.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 18,
    backgroundColor: theme.inputBackground,
    color: theme.text,
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  button: {
    paddingVertical: 18,
    borderRadius: 12,
    marginTop: 12,
    shadowColor: theme.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: theme.buttonText,
    fontSize: 13,
    textAlign: "center",
    fontWeight: "900",
    letterSpacing: 2,
  },
  bypassContainer: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    alignItems: "center",
  },
  bypassHeader: {
    fontSize: 8,
    fontWeight: "900",
    color: theme.secondaryText,
    letterSpacing: 3,
    marginBottom: 16,
  },
  bypassRow: {
    flexDirection: "row",
    gap: 12,
  },
  smallBypassBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 90,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.border,
  },
  smallBypassText: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
  },
});