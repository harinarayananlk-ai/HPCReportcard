import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import SoundButton from "../components/SoundButton";
import { useTheme, useAuth } from "../context/GlobalContext";

const { width } = Dimensions.get("window");

export default function TeacherHome() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuth();

  // Specifically requested boxes
  const actionBoxes = [
    { title: "Start Registration", icon: "→", path: "/part_a1/StudentRegistration", primary: true },
    { title: "Manage Class", icon: "≡", path: "/TeacherTracking", primary: false },
  ];

  const styles = getStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} />
      
      {/* ── HEADER ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome Back,</Text>
          <Text style={styles.teacherName}>{user?.full_name || user?.username || "Guest Teacher"}</Text>
        </View>
        <SoundButton 
          onPress={() => router.push("/TeacherProfile")}
          style={styles.avatarContainer}
          activeOpacity={0.7}
        >
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>T</Text>
          </View>
          <View style={styles.editBadge}>
            <Text style={styles.editBadgeText}>✎</Text>
          </View>
        </SoundButton>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.sectionTitle}>Control Center</Text>

        {/* ── ACTION GRID ── */}
        <View style={styles.grid}>
          {actionBoxes.map((box, i) => (
            <SoundButton 
              key={i} 
              style={[styles.boxCard, box.primary && styles.primaryBoxCard]}
              onPress={() => router.push(box.path)}
              activeOpacity={0.7}
            >
              <Text style={[styles.boxIcon, box.primary && styles.primaryBoxIcon]}>{box.icon}</Text>
              <Text style={[styles.boxTitle, box.primary && styles.primaryBoxTitle]}>{box.title}</Text>
            </SoundButton>
          ))}
        </View>

        {/* ── LOGOUT ── */}
        <SoundButton 
          style={styles.logoutButton} 
          onPress={() => router.push("/")}
          activeOpacity={0.7}
        >
          <Text style={styles.logoutText}>Sign Out</Text>
        </SoundButton>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 30,
  },
  greeting: {
    fontSize: 14,
    color: theme.secondaryText,
    fontWeight: "600",
  },
  teacherName: {
    fontSize: 22,
    fontWeight: "800",
    color: theme.text,
    marginTop: 2,
  },
  avatarContainer: {
    position: "relative",
  },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.surface,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.border,
  },
  avatarText: {
    color: theme.text,
    fontWeight: "bold",
    fontSize: 18,
  },
  editBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: theme.background,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.border,
  },
  editBadgeText: {
    color: theme.text,
    fontSize: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: theme.secondaryText,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 20,
    marginLeft: 4,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  boxCard: {
    backgroundColor: theme.card,
    width: (width - 60) / 2,
    padding: 24,
    borderRadius: 24,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.border,
    minHeight: 130,
    justifyContent: "center",
  },
  primaryBoxCard: {
    backgroundColor: theme.primary,
    borderColor: theme.border,
  },
  boxIcon: {
    fontSize: 24,
    color: theme.secondaryText,
    marginBottom: 12,
  },
  primaryBoxIcon: {
    color: theme.buttonText,
  },
  boxTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: theme.text,
  },
  primaryBoxTitle: {
    color: theme.buttonText,
  },
  logoutButton: {
    marginTop: 40,
    backgroundColor: "transparent",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  logoutText: {
    color: theme.secondaryText,
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});
