import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Dimensions,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Animated, { 
  FadeInDown, 
  FadeInRight,
  FadeInUp,
  Layout,
  SlideInRight
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import SoundButton from "../components/SoundButton";
import { useTheme, useAuth, API_URL } from "../context/GlobalContext";
import { useEffect, useState, useRef } from "react";
import { Image } from "react-native";
import { gems } from "../colour_themes";
import PremiumBackground from "../components/PremiumBackground";
import GemCutCard from "../components/GemCutCard";

// ── Sparkle Decoration ────────────────────────────────────────────────
const Sparkle = ({ style, size = 15, color = '#FFF', delay = 0 }) => (
    <Animated.View 
        entering={FadeInDown.delay(delay).springify()}
        style={[{ position: 'absolute', zIndex: 10 }, style]}
    >
        <Ionicons name="sparkles" size={size} color={color} style={{ opacity: 0.8 }} />
    </Animated.View>
);

const { width } = Dimensions.get("window");

const SEEDED_PASSWORDS = {
  s_ladoo: 'navy-2824-ladoo',
  s_bittoo: 'dusk-4150-bittoo',
  s_imli_6a: 'pearl-8573-imli',
  s_urad_9a: 'ruby-5339-urad',
  s_paplu: 'pass123',
  s_golgappa: 'pass123',
  s_bunty: 'pass123',
  s_bablu: 'pass123',
  s_pinky: 'pass123',
  s_chintu: 'pass123',
  s_guddu: 'pass123',
  s_munna: 'pass123',
  s_pappu: 'pass123',
};

export default function StudentHomepage() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user, profile, setProfile, activeStudentId, userPassword, logout } = useAuth();
  const [reports, setReports] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const styles = getStyles(theme);
  const accentColor = gems.sapphire;

  const targetUserId = activeStudentId || user?.id;

  useEffect(() => {
    if (targetUserId) {
      fetchReports();
      fetchProfile();
    }
  }, [targetUserId]);

  const fetchProfile = async () => {
    try {
      const resp = await fetch(`${API_URL}/students/profile/${targetUserId}`);
      const data = await resp.json();
      if (data && data.registration_number) {
        setProfile(data);
      }
    } catch (e) {
      console.warn("Home profile fetch error", e);
    }
  };

  const fetchReports = async () => {
    try {
      const resp = await fetch(`${API_URL}/students/reports/${targetUserId}`);
      const data = await resp.json();
      setReports(data || []);
    } catch (e) {
      console.error("Fetch reports error", e);
    }
  };

  const displayPassword = userPassword || SEEDED_PASSWORDS[profile?.username || user?.username] || 'pass123';
  const isTeacher = user?.role === 'teacher' || user?.role === 'superadmin';

  return (
    <View style={styles.container}>
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} />
      
      <PremiumBackground gemColor={accentColor} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header Section */}
        <Animated.View 
          entering={FadeInUp.duration(1000).springify()} 
          style={[
            styles.header, 
            { 
              backgroundColor: theme.isDark ? "rgba(40, 40, 45, 0.7)" : "rgba(255, 255, 255, 0.7)",
              borderColor: gems.silver + '40'
            }
          ]}
        >
          <View style={styles.welcomeRow}>
            <View>
              <Text style={styles.greeting}>✨ Hello ✨</Text>
              <Text style={styles.userName}>{profile?.full_name || user?.username || "Adventurer"}</Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <SoundButton
                onPress={() => {
                  logout();
                  router.replace('/');
                }}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 20,
                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                  borderWidth: 1,
                  borderColor: 'rgba(239, 68, 68, 0.3)',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Ionicons name="log-out-outline" size={14} color="#ef4444" />
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#ef4444', fontFamily: 'Outfit_600SemiBold' }}>
                  LOGOUT
                </Text>
              </SoundButton>

              <View style={[styles.avatar, { borderColor: gems.silver }]}>
                 <Text style={styles.avatarText}>{(profile?.full_name || user?.username || "S")[0].toUpperCase()}</Text>
              </View>
            </View>
          </View>
          <Sparkle style={{ top: 20, right: 80 }} color={gems.silver} />

          {/* Premium Basic Details Card */}
          <GemCutCard 
            borderColor={accentColor + '60'} 
            style={styles.detailsCard}
            contentStyle={{ padding: 16 }}
          >
            <Text style={styles.detailsTitle}>💡 PROFILE CARD</Text>
            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>USERNAME</Text>
                <Text style={[styles.detailVal, { color: theme.text }]} selectable>{profile?.username || user?.username || "N/A"}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>PASSWORD</Text>
                <View style={styles.passwordRow}>
                  <Text style={[styles.detailVal, { color: theme.text }]} selectable>
                    {showPassword ? displayPassword : "••••••••"}
                  </Text>
                  <SoundButton onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={16} color={accentColor} />
                  </SoundButton>
                </View>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>CLASS / GRADE</Text>
                <Text style={[styles.detailVal, { color: theme.text }]}>{profile?.class_name || "Unassigned"}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>TEACHER</Text>
                <Text style={[styles.detailVal, { color: theme.text }]}>{profile?.teacher_name || "Unassigned"}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>REGISTRATION NO.</Text>
                <Text style={[styles.detailVal, { color: theme.text }]} selectable>{profile?.registration_number || "---"}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>SCHOOL</Text>
                <Text style={[styles.detailVal, { color: theme.text }]}>{profile?.school || "---"}</Text>
              </View>
            </View>
          </GemCutCard>
        </Animated.View>

        {/* Content Section */}
        <View style={styles.content}>
          <Animated.Text entering={FadeInRight.delay(200)} style={styles.sectionTitle}>Quick Actions</Animated.Text>
          
          <View style={styles.actionList}>
            <Animated.View entering={FadeInDown.delay(300).duration(800).springify()}>
              <GemCutCard borderColor={gems.sapphire + '60'} contentStyle={{ padding: 0 }}>
                <SoundButton 
                  style={styles.actionCard}
                  onPress={() => router.push("/part_a1/StudentRegistration")}
                >
                  <View style={[styles.actionIconContainer, { backgroundColor: gems.sapphire + "15" }]}>
                    <Ionicons name="card-outline" size={24} color={gems.sapphire} />
                  </View>
                  <View style={styles.actionTextContent}>
                    <Text style={[styles.actionTitle, { color: theme.text }]}>Go to HPC Card</Text>
                    <Text style={styles.actionDesc}>View your Holistic Progress Card. (Self, Parent & Peer edits allowed)</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={theme.secondaryText} />
                </SoundButton>
              </GemCutCard>
            </Animated.View>
          </View>

          {/* Report History */}
          <View style={styles.historySection}>
            <Animated.Text entering={FadeInRight.delay(600)} style={styles.sectionTitle}>Academic History</Animated.Text>
            {reports.length > 0 ? (
              reports.map((report, index) => (
                <Animated.View 
                  key={report.id} 
                  entering={FadeInDown.delay(700 + index * 100)}
                >
                  <GemCutCard
                    borderColor={theme.border}
                    contentStyle={{ padding: 0 }}
                  >
                    <SoundButton 
                      style={styles.historyCard}
                      onPress={() => router.push("/part_b/viewer")}
                    >
                       <View style={styles.historyIconBox}>
                          <Ionicons name="document-text-outline" size={20} color={accentColor} />
                       </View>
                       <View style={styles.historyInfo}>
                         <Text style={styles.historyYear}>{report.year} SESSION</Text>
                         <Text style={styles.historyTerm}>{report.term || "Annual Evaluation"}</Text>
                       </View>
                       <View style={styles.viewBadge}>
                          <Text style={[styles.historyBadgeText, { color: accentColor }]}>VIEW</Text>
                       </View>
                    </SoundButton>
                  </GemCutCard>
                </Animated.View>
              ))
            ) : (
              <Animated.View entering={FadeInDown.delay(700)}>
                <GemCutCard
                  borderColor={accentColor + '40'}
                  contentStyle={{ padding: 0 }}
                >
                  <SoundButton 
                    style={styles.historyCard}
                    onPress={() => router.push("/part_b/viewer")}
                  >
                     <View style={styles.historyIconBox}>
                        <Ionicons name="eye-outline" size={20} color={accentColor} />
                     </View>
                     <View style={styles.historyInfo}>
                       <Text style={styles.historyYear}>CURRENT SESSION</Text>
                       <Text style={styles.historyTerm}>Go to Current Report Preview</Text>
                     </View>
                     <View style={styles.viewBadge}>
                        <Text style={[styles.historyBadgeText, { color: accentColor }]}>VIEW</Text>
                     </View>
                  </SoundButton>
                </GemCutCard>
              </Animated.View>
            )}
          </View>

          {/* Monthly Attendance Breakdown */}
          {(() => {
            try {
              const fd = typeof profile?.family_details === "string" ? JSON.parse(profile.family_details) : profile?.family_details;
              
              // Handle multiple possible data structures for attendance
              let attendanceData = [];
              if (Array.isArray(fd?.attendance)) {
                attendanceData = fd.attendance;
              } else if (fd?.attendance && typeof fd.attendance === 'object' && Array.isArray(fd.attendance.table)) {
                attendanceData = fd.attendance.table;
              }
              
              if (attendanceData.length === 0) return null;
              
              const MONTH_NAMES = ["Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar"];
              
              return (
                <View style={[styles.historySection, { marginTop: 32 }]}>
                  <Animated.Text entering={FadeInRight.delay(800)} style={styles.sectionTitle}>Attendance Breakdown</Animated.Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
                    {attendanceData.map((row, idx) => {
                      const working = parseFloat(row.working) || 0;
                      const attended = parseFloat(row.attended) || 0;
                      const pct = working > 0 ? ((attended / working) * 100).toFixed(0) : 0;
                      
                      return (
                        <Animated.View 
                          key={idx} 
                          entering={FadeInDown.delay(900 + idx * 50)}
                        >
                          <GemCutCard
                            borderColor={theme.border}
                            style={{ marginRight: 10 }}
                            contentStyle={{ padding: 12, alignItems: 'center', width: 80 }}
                          >
                            <Text style={styles.monthLabel}>{MONTH_NAMES[idx] || "???"}</Text>
                            <Text style={styles.monthValue}>{attended}/{working}</Text>
                            <View style={styles.progressContainer}>
                              <View style={[styles.progressBar, { width: `${pct}%`, backgroundColor: accentColor }]} />
                            </View>
                            <Text style={styles.monthPct}>{pct}%</Text>
                          </GemCutCard>
                        </Animated.View>
                      );
                    })}
                  </ScrollView>
                </View>
              );
            } catch (e) { return null; }
          })()}
        </View>
      </ScrollView>
    </View>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: theme.surface,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 8,
  },
  welcomeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 32,
  },
  greeting: {
    fontSize: 10,
    color: gems.silver,
    fontWeight: "900",
    letterSpacing: 2,
    fontFamily: "Outfit_600SemiBold",
  },
  userName: {
    fontSize: 24,
    fontWeight: "300",
    color: theme.text,
    marginTop: 4,
    fontFamily: "Inter_400Regular",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: gems.silver,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
  },
  avatarText: {
    color: theme.buttonText,
    fontSize: 20,
    fontWeight: "600",
    fontFamily: "Outfit_600SemiBold",
  },
  detailsCard: {
    marginTop: 12,
  },
  detailsTitle: {
    fontSize: 10,
    fontWeight: "900",
    color: gems.sapphire,
    letterSpacing: 2,
    marginBottom: 16,
    fontFamily: "Outfit_600SemiBold",
  },
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 16,
    columnGap: 24,
  },
  detailItem: {
    width: "45%", // Sleek two column grid layout
  },
  detailLabel: {
    fontSize: 9,
    fontWeight: "600",
    color: theme.secondaryText,
    letterSpacing: 1,
    marginBottom: 4,
    fontFamily: "Outfit_600SemiBold",
    textTransform: "uppercase",
  },
  detailVal: {
    fontSize: 13,
    fontWeight: "400",
    fontFamily: "Inter_400Regular",
  },
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  eyeBtn: {
    padding: 2,
  },
  content: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "900",
    color: theme.secondaryText,
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 20,
    fontFamily: "Outfit_600SemiBold",
  },
  actionList: {
    gap: 12,
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    padding: 16,
    borderWidth: 0,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  actionTextContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.text,
    fontFamily: "Outfit_600SemiBold",
  },
  actionDesc: {
    fontSize: 11,
    color: theme.secondaryText,
    marginTop: 2,
    fontFamily: "Inter_400Regular",
  },
  historySection: {
    marginTop: 40,
  },
  historyCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    padding: 16,
    borderWidth: 0,
  },
  historyIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.03)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  historyInfo: {
    flex: 1,
  },
  historyYear: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.text,
    letterSpacing: 1,
    fontFamily: "Outfit_600SemiBold",
  },
  historyTerm: {
    fontSize: 10,
    color: theme.secondaryText,
    marginTop: 2,
    fontFamily: "Inter_400Regular",
  },
  viewBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 8,
  },
  historyBadgeText: {
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 1,
    fontFamily: "Outfit_600SemiBold",
  },
  emptyCard: {
    padding: 40,
    alignItems: "center",
    backgroundColor: theme.surface,
    borderRadius: 24,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: theme.border,
  },
  emptyText: {
    color: theme.secondaryText,
    fontSize: 12,
    marginTop: 12,
    fontWeight: "300",
    fontFamily: "Inter_400Regular",
  },
  monthCard: {
    alignItems: "center",
  },
  monthLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: gems.silver,
    marginBottom: 4,
    textTransform: "uppercase",
    fontFamily: "Outfit_600SemiBold",
  },
  monthValue: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.text,
    marginBottom: 8,
    fontFamily: "Outfit_600SemiBold",
  },
  progressContainer: {
    width: "100%",
    height: 4,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 2,
    marginBottom: 6,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: 2,
  },
  monthPct: {
    fontSize: 10,
    fontWeight: "300",
    color: theme.secondaryText,
    fontFamily: "Inter_400Regular",
  },
});
