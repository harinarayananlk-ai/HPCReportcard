import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useTheme, useAuth, API_URL } from "../../context/GlobalContext";
import PremiumBackground from "../../components/PremiumBackground";
import SoundButton from "../../components/SoundButton";
import MenuDropdown from "../../components/MenuDropdown";
import GemButton from "../../components/GemButton";
import GemCutCard from "../../components/GemCutCard";
import { gems } from "../../colour_themes";
import useAutoSave from "../../hooks/useAutoSave";

const INVENTORY_CATEGORIES = [
  {
    category: "1. Have I gathered Information about…",
    icon: "search-outline",
    items: [
      "Entrance exams I may appear for",
      "College(s)/University(ies)/Skill Institutes (national/international) I want to apply to",
      "Prospective job roles/opportunities",
    ],
  },
  {
    category: "2. Have I started preparation for…",
    icon: "document-text-outline",
    items: [
      "Entrance test(s) and/or interviews",
      "Filling out college/skill institute/professional institute forms",
      "Creating a portfolio highlighting my skills and achievements",
    ],
  },
  {
    category: "3. Have I acquired academic skills like…",
    icon: "school-outline",
    items: [
      "Thinking critically and creatively",
      "Collaborating with peers and respecting various perspectives",
      "Engaging in independent work/research",
      "Using technology and searching for and accessing information online",
      "The ability to follow directions and manage ambiguity",
      "Managing my time and developing study skills",
    ],
  },
  {
    category: "4. Have I acquired life skills like…",
    icon: "sparkles-outline",
    items: [
      "Understanding the value of money and budgeting",
      "Managing stress for self and others",
      "Being safe and avoiding risky behaviours",
      "Developing holistic self-care routines",
      "Upholding integrity and respecting institutional rules and policies",
      "Asking for help/assistance when needed",
    ],
  },
  {
    category: "5. Have I worked to develop personal qualities like…",
    icon: "heart-outline",
    items: [
      "Mutual respect and tolerance",
      "Empathy",
      "Resilience",
      "Good citizenship",
      "Appreciation for sustainability",
      "Concern for society",
    ],
  },
];

export default function CoCurricular() {
  const { theme } = useTheme();
  const { user, profile, setProfile: setAuthProfile, activeStudentId, activeStudentProfile, setActiveStudentProfile } = useAuth();
  const router = useRouter();

  const isTeacher = user?.role === 'teacher' || user?.role === 'superadmin';
  const targetUserId = activeStudentId || user?.id;
  const targetProfile = activeStudentProfile || profile;

  const [loading, setLoading] = useState(false);
  const [checkedItems, setCheckedItems] = useState([]);

  // Load Saved Data
  useEffect(() => {
    if (targetProfile) {
      let assess = {};
      try {
        assess = typeof targetProfile.assessments === 'string'
          ? JSON.parse(targetProfile.assessments || '{}')
          : (targetProfile.assessments || {});
      } catch (e) {
        console.warn('Assessments parse error', e);
      }

      const a5 = assess.a5_s4 || {};
      if (Array.isArray(a5.checkedItems)) setCheckedItems(a5.checkedItems);
    }
  }, [targetProfile]);

  const toggleItem = (itemText) => {
    setCheckedItems((prev) =>
      prev.includes(itemText) ? prev.filter((i) => i !== itemText) : [...prev, itemText]
    );
  };

  // Calculate total items and completion percentage
  const totalItems = INVENTORY_CATEGORIES.reduce((acc, cat) => acc + cat.items.length, 0);
  const completedCount = checkedItems.length;
  const completionPct = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

  // AutoSave Payload
  const getSavePayload = useCallback(() => {
    return {
      userId: targetUserId,
      registrationNumber: targetProfile?.registration_number,
      assessments: {
        a5_s4: { checkedItems, completionPct }
      }
    };
  }, [targetUserId, targetProfile, checkedItems, completionPct]);

  const { triggerSave } = useAutoSave(targetUserId, getSavePayload, [
    targetUserId, targetProfile, checkedItems, completionPct
  ]);

  const handleSaveAndProceed = async () => {
    setLoading(true);
    try {
      await triggerSave();
      router.push("/part_a6_s4/TeacherRemarks");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} />
      <PremiumBackground gemColor={gems.sapphire} />

      <View style={styles.headerNav}>
        <MenuDropdown />
        <View style={styles.titleContainer}>
          <Text style={[styles.headerTitle, { color: gems.sapphire }]}>PART A (5)</Text>
          <Text style={[styles.headerSub, { color: theme.secondaryText }]}>ACCOMPLISHMENTS INVENTORY</Text>
        </View>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* HEADER NOTICE CARD */}
        <GemCutCard style={{ marginBottom: 16 }} contentStyle={{ padding: 16 }}>
          <View style={styles.cardHeader}>
            <Ionicons name="checkbox-outline" size={20} color={gems.sapphire} />
            <Text style={[styles.sectionHeading, { color: gems.sapphire }]}>ACCOMPLISHMENTS INVENTORY</Text>
          </View>
          <Text style={[styles.noticeText, { color: theme.secondaryText }]}>
            This inventory will help you keep track of the necessary steps and skills that you may need as you move through school towards your next step. Circle/tap the box that indicates that you have already taken the steps and skills that you have already acquired. Keep coming back to this Inventory till all the boxes have been checked!
          </Text>

          {/* Live Progress Indicator */}
          <View style={styles.progressBox}>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>Inventory Completion</Text>
              <Text style={[styles.progressPct, { color: gems.sapphire }]}>{completionPct}% ({completedCount}/{totalItems})</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${completionPct}%`, backgroundColor: gems.sapphire }]} />
            </View>
          </View>
        </GemCutCard>

        {/* 5 CATEGORIES OF INVENTORY */}
        {INVENTORY_CATEGORIES.map((cat, catIdx) => (
          <GemCutCard key={catIdx} style={{ marginBottom: 16 }} contentStyle={{ padding: 16 }}>
            <View style={styles.cardHeader}>
              <Ionicons name={cat.icon} size={18} color={gems.sapphire} />
              <Text style={[styles.categoryTitle, { color: gems.sapphire }]}>{cat.category}</Text>
            </View>

            <View style={styles.itemsList}>
              {cat.items.map((item, itemIdx) => {
                const checked = checkedItems.includes(item);
                return (
                  <TouchableOpacity
                    key={itemIdx}
                    style={[
                      styles.itemRow,
                      checked && { backgroundColor: gems.sapphire + '10', borderColor: gems.sapphire },
                    ]}
                    onPress={() => toggleItem(item)}
                  >
                    <Ionicons
                      name={checked ? "checkmark-circle" : "ellipse-outline"}
                      size={20}
                      color={checked ? gems.sapphire : '#AAA'}
                    />
                    <Text style={[styles.itemText, { color: theme.text }, checked && { fontWeight: '700' }]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </GemCutCard>
        ))}

        {/* PROCEED BUTTON */}
        <View style={styles.buttonCol}>
          <GemButton onPress={handleSaveAndProceed} gemType="sapphire" disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.btnText}>PROCEED TO PART A6{"\n"}➔</Text>
            )}
          </GemButton>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  headerNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  iconBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  titleContainer: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '300', fontFamily: 'Inter_400Regular', letterSpacing: 2, textAlign: 'center' },
  headerSub: { fontSize: 9, fontFamily: 'Inter_400Regular', letterSpacing: 1, marginTop: 2, textAlign: 'center' },
  scrollContainer: { paddingHorizontal: 16, paddingTop: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  sectionHeading: { fontSize: 14, fontWeight: '700', fontFamily: 'Outfit_600SemiBold', letterSpacing: 0.5 },
  noticeText: { fontSize: 11, fontFamily: 'Inter_400Regular', lineHeight: 16, marginBottom: 12 },
  progressBox: { marginTop: 4 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  progressLabel: { fontSize: 11, fontFamily: 'Outfit_600SemiBold' },
  progressPct: { fontSize: 11, fontWeight: '700', fontFamily: 'Outfit_600SemiBold' },
  progressBarBg: { height: 6, borderRadius: 3, backgroundColor: '#EEE', overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },
  categoryTitle: { fontSize: 12, fontWeight: '700', fontFamily: 'Outfit_600SemiBold', flex: 1 },
  itemsList: { gap: 6, marginTop: 6 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderWidth: 1, borderColor: '#DDD', borderRadius: 8 },
  itemText: { fontSize: 11, fontFamily: 'Inter_400Regular', flex: 1 },
  buttonCol: { alignItems: 'center', marginTop: 10 },
  btnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Outfit_600SemiBold',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
});
