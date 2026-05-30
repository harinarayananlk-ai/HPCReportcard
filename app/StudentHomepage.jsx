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

export default function StudentHomepage() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user, profile, setProfile, activeStudentId } = useAuth();
  const [reports, setReports] = useState([]);
  const styles = getStyles(theme);
  const accentColor = gems.moonstone;

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

  const handleAction = (route) => {
    router.push(route);
  };

  const getDynamicStats = () => {
    let attendance = "0%";
    let avgGrade = profile?.class_name || "---";
    let points = profile?.points || "0";

    if (profile?.family_details) {
      try {
        const fd = typeof profile.family_details === "string" ? JSON.parse(profile.family_details) : profile.family_details;
        if (fd.attendance) {
          const totalWorking = fd.attendance.reduce((s, r) => s + (parseFloat(r.working) || 0), 0);
          const totalAttended = fd.attendance.reduce((s, r) => s + (parseFloat(r.attended) || 0), 0);
          if (totalWorking > 0) {
            attendance = `${((totalAttended / totalWorking) * 100).toFixed(0)}%`;
          }
        }
      } catch (e) {}
    }

    return [
      { label: "Attendance", value: attendance, icon: "calendar-outline", color: "#6366f1" },
      { label: "Class", value: avgGrade, icon: "school-outline", color: accentColor },
      { label: "Score", value: points, icon: "star-outline", color: "#fb923c" },
    ];
  };

  const headerStats = getDynamicStats();

  const isTeacher = user?.role === 'teacher' || user?.role === 'superadmin';

  // Stage-aware A2 route
  const getA2Route = () => {
    const cls = (profile?.class_name || '').toLowerCase().trim();
    console.log("[StudentHome] Routing for class:", cls);
    if (cls.includes('bal vatika') || cls === 'kg' || cls === 'kindergarten' || cls === 'grade 1' || cls === 'grade 2') {
        return '/part_a2_s1/AboutMe';
    }
    if (cls === 'grade 3' || cls === 'grade 4' || cls === 'grade 5') {
        return '/part_a2_s2/AboutMe';
    }
    return '/part_a2_s34/LayoutBuilder';
  };

  const allActions = [
    { id: "1", title: "Me and My Surroundings", icon: "create-outline", route: getA2Route(), color: gems.sapphire, desc: "Personalize your journey" },
    { id: "2", title: "Achievement Vault", icon: "bar-chart-outline", route: "/part_b/viewer", color: gems.emerald, desc: "View your progress" },
    { id: "3", title: "Profile Studio", icon: "person-outline", route: "/part_a1/ParentRegistration", color: gems.ruby, desc: "Update your details" },
    { id: "4", title: "Domain Master", icon: "book-outline", route: "/part_b_s1/SelectionPage", color: gems.topaz, desc: "Record Activities" },
    { id: "5", title: "Year End Party", icon: "ribbon-outline", route: "/part_c_s1/YearEndSummary", color: gems.amethyst, desc: "Summary & Celebration" }
  ];

  const quickActions = isTeacher ? allActions : allActions.filter(a => a.id === "4");


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
              borderColor: gems.topaz + '40'
            }
          ]}
        >
          <View style={styles.welcomeRow}>
            <View>
              <Text style={styles.greeting}>✨ Hello ✨</Text>
              <Text style={styles.userName}>{profile?.full_name || user?.username || "Adventurer"}</Text>
            </View>
            <View style={[styles.avatar, { borderColor: gems.topaz }]}>
               <Text style={styles.avatarText}>{(profile?.full_name || user?.username || "S")[0].toUpperCase()}</Text>
            </View>
          </View>
          <Sparkle style={{ top: 20, right: 80 }} color={gems.topaz} />

          <View style={styles.statsRow}>
            {headerStats.map((stat, i) => (
              <View key={i} style={[styles.statCard, { backgroundColor: theme.isDark ? "rgba(60, 60, 70, 0.4)" : "rgba(255,255,255,0.6)", borderColor: stat.color + '30' }]}>
                <View style={[styles.statIconBg, { backgroundColor: stat.color + "15" }]}>
                  <Ionicons name={stat.icon} size={16} color={stat.color} />
                </View>
                <Text style={[styles.statValue, { color: theme.text }]}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Content Section */}
        <View style={styles.content}>
          <Animated.Text entering={FadeInRight.delay(200)} style={styles.sectionTitle}>Quick Actions</Animated.Text>
          
          <View style={styles.actionList}>
            {quickActions.map((action, index) => (
              <Animated.View 
                key={action.id} 
                entering={FadeInDown.delay(300 + index * 100).duration(800).springify()}
              >
                <SoundButton 
                  style={[styles.actionCard, { borderColor: theme.border }]}
                  onPress={() => handleAction(action.route)}
                >
                  <View style={[styles.actionIconContainer, { backgroundColor: action.color + "15" }]}>
                    <Ionicons name={action.icon} size={24} color={action.color} />
                  </View>
                  <View style={styles.actionTextContent}>
                    <Text style={styles.actionTitle}>{action.title}</Text>
                    <Text style={styles.actionDesc}>{action.desc}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={theme.secondaryText} />
                </SoundButton>
              </Animated.View>
            ))}
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
                  <SoundButton style={styles.historyCard}>
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
                </Animated.View>
              ))
            ) : (
              <Animated.View entering={FadeInDown.delay(700)} style={styles.emptyCard}>
                <Ionicons name="cloud-offline-outline" size={32} color={theme.secondaryText + "40"} />
                <Text style={styles.emptyText}>No reports found</Text>
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
                          style={[styles.monthCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                        >
                          <Text style={styles.monthLabel}>{MONTH_NAMES[idx] || "???"}</Text>
                          <Text style={styles.monthValue}>{attended}/{working}</Text>
                          <View style={styles.progressContainer}>
                            <View style={[styles.progressBar, { width: `${pct}%`, backgroundColor: accentColor }]} />
                          </View>
                          <Text style={styles.monthPct}>{pct}%</Text>
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
    color: gems.emerald,
    fontWeight: "900",
    letterSpacing: 2,
    fontFamily: "Jost_600SemiBold",
  },
  userName: {
    fontSize: 24,
    fontWeight: "300",
    color: theme.text,
    marginTop: 4,
    fontFamily: "Jost_300Light",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: gems.emerald,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
  },
  avatarText: {
    color: theme.buttonText,
    fontSize: 20,
    fontWeight: "600",
    fontFamily: "Jost_600SemiBold",
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "rgba(245, 245, 245, 0.85)",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: gems.topaz,
    alignItems: "flex-start",
  },
  statIconBg: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.text,
    fontFamily: "Jost_600SemiBold",
  },
  statLabel: {
    fontSize: 10,
    color: theme.secondaryText,
    marginTop: 2,
    fontWeight: "300",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontFamily: "Jost_300Light",
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
    fontFamily: "Jost_600SemiBold",
  },
  actionList: {
    gap: 12,
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(245, 245, 245, 0.85)",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: gems.topaz,
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
    color: "#222",
    fontFamily: "Jost_600SemiBold",
  },
  actionDesc: {
    fontSize: 11,
    color: theme.secondaryText,
    marginTop: 2,
    fontFamily: "Jost_300Light",
  },
  historySection: {
    marginTop: 40,
  },
  historyCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.surface,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 12,
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
    fontFamily: "Jost_600SemiBold",
  },
  historyTerm: {
    fontSize: 10,
    color: theme.secondaryText,
    marginTop: 2,
    fontFamily: "Jost_300Light",
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
    fontFamily: "Jost_600SemiBold",
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
    fontFamily: "Jost_300Light",
  },
  monthCard: {
    width: 80,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 10,
    alignItems: "center",
  },
  monthLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: gems.emerald,
    marginBottom: 4,
    textTransform: "uppercase",
    fontFamily: "Jost_600SemiBold",
  },
  monthValue: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.text,
    marginBottom: 8,
    fontFamily: "Jost_600SemiBold",
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
    fontFamily: "Jost_300Light",
  },
});
