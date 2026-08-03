import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
    View, StyleSheet, TextInput, Text, ScrollView,
    StatusBar, TouchableOpacity, Dimensions, Platform, Alert, Pressable,
    ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, useAuth, API_URL } from '../../context/GlobalContext';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import Animated, {
    FadeInDown, useSharedValue, useAnimatedStyle,
    withTiming, withSpring, withSequence, withRepeat, runOnJS
} from 'react-native-reanimated';
import { Waves, Mountain, Cloud, Eye, Feather, Wand2 } from 'lucide-react-native';

import PremiumBackground from '../../components/PremiumBackground';
import GemButton from '../../components/GemButton';
import MenuDropdown from '../../components/MenuDropdown';
import { gems } from '../../colour_themes';
import { domains, curricularGoals, competencies } from '../../constants/SelectionData';
import GemCutCard from '../../components/GemCutCard';

const { width: W, height: H } = Dimensions.get('window');

// ── Icons for each domain ──
const DOMAIN_ICONS = [
    "fitness-outline",         // Physical Development
    "people-outline",          // Socio-emotional & Ethical
    "bulb-outline",            // Cognitive Development
    "book-outline",            // Language & Literacy
    "color-palette-outline",   // Aesthetic & Cultural
    "school-outline"           // Positive Learning Habits
];

const DOMAIN_NUMBERS = ["1", "2", "3", "4", "5", "5.1"];

// ── Image Sources (preloaded) ──
const IMAGE_SOURCES = {
    none: require('../../assets/images/visily-image-removebg-preview.png'),
    river: require('../../assets/images/river.png'),
    mountain: require('../../assets/images/mountain_river.png'),
    sky: require('../../assets/images/ChatGPT_Image_May_11__2026__02_55_58_PM-removebg-preview.png'),
};

// ── Emojis selection (Old/Original) ──
const EMOJIS = [
    { label: "Yes", emoji: "😊", value: "Yes" },
    { label: "No", emoji: "😟", value: "No" },
    { label: "Don't Know", emoji: "🤔", value: "DontKnow" }
];

// ── Parent observation checklist resources ──
const PARENT_RESOURCES = [
    { id: "Books/magazine", label: "📚 Books / Magazine" },
    { id: "Phone/computer", label: "📱 Phone / Computer" },
    { id: "Newspaper", label: "Newspaper" },
    { id: "Internet", label: "🌐 Internet" },
    { id: "Toys/games/sports", label: "🎮 Toys / Games / Sports" }
];

// ── Peer assessment options checklist resources ──
const PEER_RESOURCES = [
    { id: "Classmate", label: "📚 Classmate" },
    { id: "Computer", label: "💻 Computer" },
    { id: "Teacher", label: "👩‍🏫 Teacher" },
    { id: "None", label: "🚫 None" },
    { id: "Books", label: "📖 Books" }
];

// ── INITIAL STATE SCHEMAS FOR A DOMAIN ──
const createInitialDomainState = () => ({
    goals: [],
    competencies: [],
    activities: "",
    matrix1: {
        "0-0": "", "0-1": "", "0-2": "",
        "1-0": "", "1-1": "", "1-2": "",
        "2-0": "", "2-1": "", "2-2": ""
    },
    matrix2: {
        "0-0": "", "0-1": "", "0-2": "",
        "1-0": "", "1-1": "", "1-2": "",
        "2-0": "", "2-1": "", "2-2": ""
    },
    matrix1Level: "none",
    matrix2Level: "none",
    teacherFeedback: "",
    selfLiked: "",
    selfEasy: "",
    selfNeeded: [],
    peerLiked: "",
    peerEasy: "",
    peerNeeded: [],
    parentResources: [],
    parentRemarks: ""
});

// ── Sub-components for ambient icons ──
const AnimatedWaves = ({ color, active }) => {
    const offset = useSharedValue(0);
    useEffect(() => {
        offset.value = withRepeat(
            withSequence(
                withTiming(3, { duration: 1500 }),
                withTiming(-3, { duration: 1500 })
            ), -1, true
        );
    }, []);
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: offset.value }]
    }));
    return (
        <View style={[styles.iconContainer, active && styles.activeIconContainer]}>
            <Animated.View style={animatedStyle}><Waves color={color} size={20} /></Animated.View>
            <Text style={[styles.iconText, { color }]}>STREAM</Text>
        </View>
    );
};

const AnimatedMountain = ({ color, active }) => {
    const scale = useSharedValue(1);
    useEffect(() => {
        scale.value = withRepeat(withTiming(1.15, { duration: 2000 }), -1, true);
    }, []);
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: withTiming(scale.value > 1.1 ? 0.9 : 1)
    }));
    return (
        <View style={[styles.iconContainer, active && styles.activeIconContainer]}>
            <Animated.View style={animatedStyle}><Mountain color={color} size={20} /></Animated.View>
            <Text style={[styles.iconText, { color }]}>MOUNTAIN</Text>
        </View>
    );
};

const AnimatedSky = ({ color, active }) => {
    const translateY = useSharedValue(0);
    useEffect(() => {
        translateY.value = withRepeat(withTiming(-5, { duration: 2500 }), -1, true);
    }, []);
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }]
    }));
    return (
        <View style={[styles.iconContainer, active && styles.activeIconContainer]}>
            <Animated.View style={animatedStyle}><Cloud color={color} size={20} /></Animated.View>
            <Text style={[styles.iconText, { color }]}>SKY</Text>
        </View>
    );
};

// ── Interactive Glassmorphism Help Tooltip Trigger (Ambient Shadow Pulse) ──
const InfoTrigger = ({ text, tooltipText, theme }) => {
    const [open, setOpen] = useState(false);
    const pulse = useSharedValue(1);

    useEffect(() => {
        pulse.value = withRepeat(
            withSequence(
                withTiming(1.6, { duration: 1250 }),
                withTiming(1, { duration: 1250 })
            ), -1, true
        );
    }, []);

    const pulseStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulse.value }],
        opacity: 1 - (pulse.value - 1) / 0.6
    }));

    return (
        <View style={styles.infoWrapper}>
            <View style={[
                styles.headerWithInfo,
                {
                    backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.03)' : '#FFFFFF',
                    borderColor: theme.isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.06)',
                    borderWidth: 1,
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    marginBottom: 4,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: theme.isDark ? 0 : 0.04,
                    shadowRadius: 3,
                    elevation: theme.isDark ? 0 : 1
                }
            ]}>
                <Text style={[styles.fieldLabel, { color: theme.isDark ? '#00D4FF' : '#2E5894' }]}>{text}</Text>
                <TouchableOpacity onPress={() => setOpen(!open)} style={[styles.infoButton, { borderColor: theme.isDark ? 'rgba(0, 212, 255, 0.4)' : 'rgba(46, 88, 148, 0.4)' }]}>
                    <Animated.View style={[styles.pulseRing, pulseStyle, { borderColor: theme.isDark ? 'rgba(0, 212, 255, 0.6)' : 'rgba(46, 88, 148, 0.6)' }]} />
                    <Text style={[styles.questionMarkText, { color: theme.isDark ? '#00D4FF' : '#2E5894' }]}>?</Text>
                </TouchableOpacity>
            </View>
            {open && (
                <Animated.View entering={FadeInDown.duration(200)} style={[styles.tooltipBox, { borderColor: theme.isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)' }]}>
                    <BlurView intensity={70} tint={theme.isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
                    <Text style={[styles.tooltipText, { color: theme.text }]}>{tooltipText}</Text>
                </Animated.View>
            )}
        </View>
    );
};

// ── 3D styled Gemstone Button Component ──
const GemstoneButton = ({ label, emoji, selected, onPress }) => {
    const { theme } = useTheme();
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
        scale.value = withSpring(0.92, { damping: 12, stiffness: 220 });
    };

    const handlePressOut = () => {
        scale.value = withSpring(1.0, { damping: 12, stiffness: 220 });
    };

    const isDark = theme.isDark;
    const buttonBg = selected
        ? (isDark ? 'rgba(153, 102, 204, 0.15)' : 'rgba(106, 27, 154, 0.08)')
        : (isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)');
    
    const buttonBorder = selected
        ? (isDark ? '#9966CC' : '#6A1B9A')
        : (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.08)');
        
    const buttonBottomBorder = selected
        ? (isDark ? '#9966CC' : '#6A1B9A')
        : (isDark ? 'rgba(153, 102, 204, 0.3)' : 'rgba(106, 27, 154, 0.2)');

    const textColor = selected
        ? (isDark ? '#00D4FF' : '#6A1B9A')
        : (isDark ? 'rgba(255, 255, 255, 0.7)' : '#333333');

    return (
        <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={onPress}
            style={[
                styles.gemstoneButton,
                {
                    backgroundColor: buttonBg,
                    borderColor: buttonBorder,
                    borderBottomColor: buttonBottomBorder
                }
            ]}
        >
            <Animated.View style={[styles.gemstoneButtonInner, animatedStyle]}>
                <Text style={styles.gemstoneEmoji}>{emoji}</Text>
                <Text style={[styles.gemstoneText, { color: textColor }]}>{label}</Text>
            </Animated.View>
        </Pressable>
    );
};

// ── Untouchable Black-Box Valley Animation Component ──
const ValleyAnimation = ({ activeLevel }) => {
    const { theme } = useTheme();
    const imageOpacity = useSharedValue(1);
    const [currentSource, setCurrentSource] = useState(IMAGE_SOURCES.none);

    const updateSource = () => {
        setCurrentSource(IMAGE_SOURCES[activeLevel] || IMAGE_SOURCES.none);
        imageOpacity.value = withTiming(1, { duration: 400 });
    };

    useEffect(() => {
        imageOpacity.value = withTiming(0, { duration: 250 }, (finished) => {
            if (finished) runOnJS(updateSource)();
        });
    }, [activeLevel]);

    const animatedImageStyle = useAnimatedStyle(() => ({
        opacity: imageOpacity.value
    }));

    return (
        <View style={[
            styles.imageFrame,
            {
                backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.02)' : '#F5F5F5',
                borderColor: theme.isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.08)'
            }
        ]}>
            <Animated.View style={[styles.imageInner, animatedImageStyle]}>
                <Image 
                    source={currentSource} 
                    style={styles.valleyImage} 
                    contentFit="contain"
                    transition={200}
                />
            </Animated.View>
            <View style={[
                styles.captionBadge,
                {
                    backgroundColor: theme.isDark ? 'rgba(0, 212, 255, 0.1)' : 'rgba(0, 150, 136, 0.08)',
                    borderColor: theme.isDark ? 'rgba(0, 212, 255, 0.25)' : 'rgba(0, 150, 136, 0.2)'
                }
            ]}>
                <Text style={[styles.imageCaption, { color: theme.isDark ? '#00D4FF' : '#00796B' }]}>
                    {activeLevel === 'none' ? 'Fill all rows to color valley' : activeLevel === 'river' ? '◈ Stream Level' : activeLevel === 'mountain' ? '◈ Mountain Level' : '◈ Sky Level'}
                </Text>
            </View>
        </View>
    );
};

// ── Solid 3D Cube Face Component ──
const CubeFace = ({ title, activeIcon, rotationY, rotateX, translateZ, textOpacity, bgColors }) => {
    const animatedFaceStyle = useAnimatedStyle(() => {
        const transforms = [{ perspective: 1200 }];
        if (rotationY !== undefined) transforms.push({ rotateY: rotationY });
        if (rotateX !== undefined) transforms.push({ rotateX: rotateX });
        
        // Simulating translateZ in React Native:
        // Rotate 90deg around Y, translate along X, then rotate back -90deg around Y
        transforms.push({ rotateY: '90deg' });
        transforms.push({ translateX: translateZ });
        transforms.push({ rotateY: '-90deg' });
        
        return {
            transform: transforms
        };
    });

    const animatedTextStyle = useAnimatedStyle(() => ({
        opacity: textOpacity.value
    }));

    return (
        <Animated.View style={[styles.cubeFace, animatedFaceStyle]}>
            <LinearGradient
                colors={bgColors || ['#9966CC', '#00D4FF']}
                style={styles.cubeFaceGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <Animated.View style={[styles.cubeFaceContent, animatedTextStyle]}>
                    {activeIcon && <Ionicons name={activeIcon} size={28} color="#FFF" style={{ marginBottom: 12 }} />}
                    <Text style={styles.cubeFaceTitle}>{title.toUpperCase()}</Text>
                </Animated.View>
            </LinearGradient>
        </Animated.View>
    );
};

// ── Auto-save status toast ──
const AutoSaveToast = ({ isSaving, hasError, theme }) => {
    const opacity = useSharedValue(0);

    useEffect(() => {
        if (isSaving || hasError) {
            opacity.value = withTiming(1, { duration: 300 });
        } else {
            opacity.value = withTiming(0, { duration: 600 });
        }
    }, [isSaving, hasError]);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value
    }));

    return (
        <Animated.View style={[styles.toastContainer, animatedStyle]}>
            <BlurView intensity={80} tint={theme.isDark ? "dark" : "light"} style={styles.toastBlur}>
                {isSaving ? (
                    <>
                        <ActivityIndicator size="small" color="#00D4FF" />
                        <Text style={[styles.toastText, { color: theme.text }]}>Syncing...</Text>
                    </>
                ) : hasError ? (
                    <>
                        <Ionicons name="alert-circle" size={14} color="#FF6B6B" />
                        <Text style={[styles.toastText, { color: "#FF6B6B" }]}>Sync Failed</Text>
                    </>
                ) : (
                    <>
                        <Ionicons name="checkmark-circle" size={14} color="#00FFB2" />
                        <Text style={[styles.toastText, { color: "#00FFB2" }]}>Synced</Text>
                    </>
                )}
            </BlurView>
        </Animated.View>
    );
};

// ── Main Overhauled Component ──
export default function SelectionPage() {
    const router = useRouter();
    const { theme } = useTheme();
    const { user, profile, setProfile: setAuthProfile, activeStudentId, activeStudentProfile, setActiveStudentProfile } = useAuth();
    const targetUserId = activeStudentId || user?.id;
    const targetProfile = activeStudentProfile || profile;
    const isStudent = user?.role === 'student';

    // Set high-contrast theme background
    const pageBgColor = theme.isDark ? "#121212" : "#FFFFFF";

    // ── Unified 6 Domains State ──
    const [domainsData, setDomainsData] = useState(() => {
        const initial = {};
        domains.forEach(d => {
            initial[d] = createInitialDomainState();
        });
        return initial;
    });

    const [currentDomainIndex, setCurrentDomainIndex] = useState(0);
    const currentDomainName = domains[currentDomainIndex];

    const [expandedGoalId, setExpandedGoalId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [hasError, setHasError] = useState(false);

    // ── 3D Cube Animation States ──
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [transitionNextIndex, setTransitionNextIndex] = useState(0);
    const spinProgress = useSharedValue(0);
    const spinDirection = useSharedValue(1); // 1 = forward, -1 = backward
    
    // Phase 1 to 3 Animators
    const contentScale = useSharedValue(1);
    const contentOpacity = useSharedValue(1);
    const cubeScale = useSharedValue(0.5);
    const cubeOpacity = useSharedValue(0);
    const faceTextOpacity = useSharedValue(0);

    // ── Load student profile data on mount ──
    useEffect(() => {
        if (!targetUserId) return;
        const fetchProfile = async () => {
            try {
                setIsLoading(true);
                const res = await fetch(`${API_URL}/students/profile/${targetUserId}`);
                const data = await res.json();
                console.log(`[Unified SelectionPage] Loaded assessments:`, data?.assessments);

                if (data?.assessments) {
                    const assess = typeof data.assessments === 'string'
                        ? JSON.parse(data.assessments) : data.assessments;

                    if (assess.domainsData) {
                        setDomainsData(prev => {
                            const updated = { ...prev };
                            Object.keys(assess.domainsData).forEach(d => {
                                if (updated[d]) {
                                    updated[d] = {
                                        ...updated[d],
                                        ...assess.domainsData[d]
                                    };
                                }
                            });
                            return updated;
                        });
                        if (assess.domain && domains.includes(assess.domain)) {
                            setCurrentDomainIndex(domains.indexOf(assess.domain));
                        }
                    } else {
                        // Migration fallback
                        const matchedDomainName = assess.domain || domains[0];
                        setDomainsData(prev => {
                            const updated = { ...prev };
                            if (updated[matchedDomainName]) {
                                updated[matchedDomainName] = {
                                    ...updated[matchedDomainName],
                                    goals: Array.isArray(assess.goal) ? assess.goal : [],
                                    competencies: Array.isArray(assess.competency) ? assess.competency : [],
                                    activities: assess.activities || "",
                                    matrix1: assess.rubricTable || updated[matchedDomainName].matrix1,
                                    teacherFeedback: assess.teacherFeedback || "",
                                    selfLiked: assess.selfPeer?.selfLiked || "",
                                    selfEasy: assess.selfPeer?.selfEasy || "",
                                    selfNeeded: assess.selfPeer?.selfNeeded || [],
                                    peerLiked: assess.selfPeer?.peerLiked || "",
                                    peerEasy: assess.selfPeer?.peerEasy || "",
                                    peerNeeded: assess.selfPeer?.peerNeeded || [],
                                    parentResources: assess.parentObservation?.resources || [],
                                    parentRemarks: assess.parentObservation?.remarks || ""
                                };
                            }
                            return updated;
                        });
                        setCurrentDomainIndex(domains.indexOf(matchedDomainName));
                    }
                }
            } catch (err) {
                console.warn("[SelectionPage] Load failed:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfile();
    }, [targetUserId]);

    // ── Local shortcuts for active domain state ──
    const activeData = useMemo(() => {
        return domainsData[currentDomainName] || createInitialDomainState();
    }, [domainsData, currentDomainName]);

    // Filter curricular goals and competencies for active domain
    const activeDomainGoals = useMemo(() => {
        if (currentDomainIndex === 0) return curricularGoals.filter(cg => ["CG-1", "CG-2", "CG-3"].includes(cg.id));
        if (currentDomainIndex === 1) return curricularGoals.filter(cg => ["CG-4", "CG-5", "CG-6"].includes(cg.id));
        if (currentDomainIndex === 2) return curricularGoals.filter(cg => ["CG-7", "CG-8"].includes(cg.id));
        if (currentDomainIndex === 3) return curricularGoals.filter(cg => ["CG-9", "CG-10", "CG-11"].includes(cg.id));
        if (currentDomainIndex === 4) return curricularGoals.filter(cg => ["CG-12"].includes(cg.id));
        if (currentDomainIndex === 5) return curricularGoals.filter(cg => ["CG-13"].includes(cg.id));
        return [];
    }, [currentDomainIndex]);

    const activeDomainCompetenciesMap = useMemo(() => {
        const cMap = {};
        curricularGoals.forEach(g => {
            const prefix = g.id.replace("CG-", "C-");
            cMap[g.id] = competencies.filter(c => c.id.startsWith(prefix + "."));
        });
        return cMap;
    }, []);

    // ── Helper updates active state fields ──
    const updateActiveField = (key, value) => {
        setDomainsData(prev => ({
            ...prev,
            [currentDomainName]: {
                ...prev[currentDomainName],
                [key]: value
            }
        }));
    };

    // ── Row Mutual Exclusivity and Tapped-Warning Popup ──
    const handleCellPress = (matrixName, rowIndex, colIndex) => {
        if (isStudent) return;
        const matrix = activeData[matrixName];
        
        const otherCols = [0, 1, 2].filter(c => c !== colIndex);
        const activeCol = otherCols.find(c => matrix[`${rowIndex}-${c}`]);

        if (activeCol !== undefined) {
            Alert.alert(
                "Change Competency Level?",
                "If you wish to change the student's competency level, saved data for the current competency will be lost.",
                [
                    { text: "Cancel", style: "cancel" },
                    {
                        text: "Change",
                        style: "destructive",
                        onPress: () => {
                            const newMatrix = { ...matrix };
                            newMatrix[`${rowIndex}-${activeCol}`] = ""; // Clear old
                            newMatrix[`${rowIndex}-${colIndex}`] = "Assessed"; // Fill placeholder
                            updateActiveField(matrixName, newMatrix);
                        }
                    }
                ]
            );
        }
    };

    // ── Averaging Engine updates active level ──
    const calculateAveragedLevel = (matrix) => {
        const getRowVal = (row) => {
            if (matrix[`${row}-0`]?.trim()) return 1; // Stream
            if (matrix[`${row}-1`]?.trim()) return 2; // Mountain
            if (matrix[`${row}-2`]?.trim()) return 3; // Sky
            return 0;
        };

        const values = [getRowVal(0), getRowVal(1), getRowVal(2)].filter(v => v > 0);
        
        if (values.length > 0) {
            const sum = values.reduce((a, b) => a + b, 0);
            const avg = Math.round(sum / values.length);
            if (avg === 1) return 'river';
            if (avg === 2) return 'mountain';
            if (avg === 3) return 'sky';
        }
        return 'none';
    };

    // Recalculate averages when matrices modify
    useEffect(() => {
        const level1 = calculateAveragedLevel(activeData.matrix1);
        if (level1 !== activeData.matrix1Level) {
            updateActiveField("matrix1Level", level1);
        }
    }, [activeData.matrix1]);

    useEffect(() => {
        const level2 = calculateAveragedLevel(activeData.matrix2);
        if (level2 !== activeData.matrix2Level) {
            updateActiveField("matrix2Level", level2);
        }
    }, [activeData.matrix2]);

    const isDirty = useRef(false);
    const domainsDataRef = useRef(domainsData);
    const currentDomainIndexRef = useRef(currentDomainIndex);

    // Keep refs up-to-date
    useEffect(() => {
        domainsDataRef.current = domainsData;
    }, [domainsData]);

    useEffect(() => {
        currentDomainIndexRef.current = currentDomainIndex;
    }, [currentDomainIndex]);

    // Mark dirty when domainsData changes (ignore initial load)
    useEffect(() => {
        if (!isLoading) {
            isDirty.current = true;
        }
    }, [domainsData]);

    // ── Immediate Save Function ──
    const saveProfileImmediate = useCallback(async () => {
        if (!isDirty.current || !targetUserId) return;
        isDirty.current = false;

        const currentDomainsData = domainsDataRef.current;
        const currentIdx = currentDomainIndexRef.current;
        const currentDomName = domains[currentIdx];
        const currentActiveData = currentDomainsData[currentDomName] || createInitialDomainState();

        try {
            const currentAssess = typeof targetProfile?.assessments === 'string'
                ? JSON.parse(targetProfile.assessments) : (targetProfile?.assessments || {});

            const updatedAssess = {
                ...currentAssess,
                domainsData: currentDomainsData,
                domain: currentDomName,
                goal: currentActiveData.goals,
                competency: currentActiveData.competencies,
                activities: currentActiveData.activities,
                rubricTable: currentActiveData.matrix1,
                teacherFeedback: currentActiveData.teacherFeedback,
                selfPeer: {
                    selfLiked: currentActiveData.selfLiked,
                    selfEasy: currentActiveData.selfEasy,
                    selfNeeded: currentActiveData.selfNeeded,
                    peerLiked: currentActiveData.peerLiked,
                    peerEasy: currentActiveData.peerEasy,
                    peerNeeded: currentActiveData.peerNeeded
                },
                parentObservation: {
                    resources: currentActiveData.parentResources,
                    remarks: currentActiveData.parentRemarks
                }
            };

            const res = await fetch(`${API_URL}/students/profile`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: targetUserId,
                    registrationNumber: targetProfile?.registration_number,
                    role: user?.role || 'student',
                    assessments: updatedAssess
                })
            });

            if (res.ok) {
                const updatedProfile = { ...targetProfile, assessments: updatedAssess };
                if (activeStudentId) {
                    setActiveStudentProfile(updatedProfile);
                } else {
                    setAuthProfile(updatedProfile);
                }
            } else {
                setHasError(true);
            }
        } catch (err) {
            setHasError(true);
        }
    }, [targetUserId, targetProfile, activeStudentId, user?.role, setActiveStudentProfile, setAuthProfile]);

    // ── Auto-Save Logic (1.5s Debounce) ──
    useEffect(() => {
        if (!targetUserId || isLoading || !isDirty.current) return;

        setIsSaving(true);
        setHasError(false);

        const timer = setTimeout(async () => {
            await saveProfileImmediate();
            setIsSaving(false);
        }, 1500);

        return () => clearTimeout(timer);
    }, [domainsData, isLoading, targetUserId, saveProfileImmediate]);

    // Flush unsaved changes immediately on unmount
    useEffect(() => {
        return () => {
            if (isDirty.current) {
                saveProfileImmediate();
            }
        };
    }, [saveProfileImmediate]);

    // ── 3D Cube Spin Transition ──
    const handleDomainChange = async (nextIndex) => {
        if (nextIndex === currentDomainIndex || isTransitioning) return;

        // Save immediately before domain transition
        if (isDirty.current) {
            setIsSaving(true);
            await saveProfileImmediate();
            setIsSaving(false);
        }

        setTransitionNextIndex(nextIndex);
        setIsTransitioning(true);

        // Reset positions
        spinProgress.value = 0;
        contentScale.value = 1;
        contentOpacity.value = 1;
        cubeScale.value = 0.5;
        cubeOpacity.value = 0;
        faceTextOpacity.value = 0;

        // Phase 1: Shrink content, fade in cube
        contentScale.value = withTiming(0.4, { duration: 300 });
        contentOpacity.value = withTiming(0, { duration: 300 });
        cubeScale.value = withTiming(1.0, { duration: 350 });
        cubeOpacity.value = withTiming(1, { duration: 350 });

        // Once cube is formed, fade in text on faces
        setTimeout(() => {
            faceTextOpacity.value = withTiming(1.0, { duration: 250 });
        }, 320);

        // Phase 2: Spin the cube Y-axis around center
        const direction = nextIndex > currentDomainIndex ? 1 : -1;
        spinDirection.value = direction;

        setTimeout(() => {
            spinProgress.value = withTiming(1, { duration: 700 });

            // Phase 3: Spin finished, fade text, shrink cube, expand new content page
            setTimeout(() => {
                faceTextOpacity.value = withTiming(0, { duration: 200 });
                
                // Swap active index state in JS
                setCurrentDomainIndex(nextIndex);

                cubeScale.value = withTiming(0.4, { duration: 300 });
                cubeOpacity.value = withTiming(0, { duration: 300 });
                
                contentScale.value = withTiming(1.0, { duration: 350 });
                contentOpacity.value = withTiming(1, { duration: 350 });

                setTimeout(() => {
                    setIsTransitioning(false);
                }, 360);
            }, 750);
        }, 600);
    };

    // ── Curricular Goals card selection toggle ──
    const toggleGoalSelection = (goalText) => {
        if (isStudent) return;
        const currentGoals = [...activeData.goals];
        const index = currentGoals.indexOf(goalText);
        if (index > -1) {
            currentGoals.splice(index, 1);
        } else {
            currentGoals.push(goalText);
        }
        updateActiveField("goals", currentGoals);
    };

    // ── Competencies chip selection toggle ──
    const toggleCompetencySelection = (compText, goalText = null) => {
        if (isStudent) return;
        const currentComps = [...activeData.competencies];
        const index = currentComps.indexOf(compText);
        let nextComps = [...currentComps];
        let nextGoals = [...activeData.goals];
        
        if (index > -1) {
            nextComps.splice(index, 1);
        } else {
            nextComps.push(compText);
            
            // Auto-select parent Curricular Goal if provided and not already active
            if (goalText && !nextGoals.includes(goalText)) {
                nextGoals.push(goalText);
            }
        }
        
        setDomainsData(prev => ({
            ...prev,
            [currentDomainName]: {
                ...prev[currentDomainName],
                competencies: nextComps,
                goals: nextGoals
            }
        }));
    };

    // ── Peer assessment checklist toggle ──
    const toggleNeededResources = (key, resourceId) => {
        if (isStudent) return;
        const currentList = [...activeData[key]];
        const index = currentList.indexOf(resourceId);
        if (index > -1) {
            currentList.splice(index, 1);
        } else {
            currentList.push(resourceId);
        }
        updateActiveField(key, currentList);
    };

    // ── Next / Finish click handler ──
    const handleNextButton = async () => {
        if (isDirty.current) {
            setIsSaving(true);
            await saveProfileImmediate();
            setIsSaving(false);
        }

        if (currentDomainIndex < 5) {
            handleDomainChange(currentDomainIndex + 1);
        } else {
            router.push('/part_c_s1/YearEndSummary');
        }
    };

    // ── Animated styles ──
    const mainContentAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: contentScale.value }],
        opacity: contentOpacity.value
    }));

    const cubeWrapperStyle = useAnimatedStyle(() => {
        const rotationY = -90 * spinProgress.value * spinDirection.value;
        return {
            transform: [
                { perspective: 1200 },
                { scale: cubeScale.value },
                { rotateX: '-18deg' }, // tilted to show top face
                { rotateY: `${rotationY}deg` }
            ],
            opacity: cubeOpacity.value
        };
    });

    return (
        <View style={{ flex: 1, backgroundColor: pageBgColor }}>
            <PremiumBackground gemColor={gems.sapphire} />
            <StatusBar translucent barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor="transparent" />

            <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
                {/* ── Sticky Top Horizontal Nav Tab Bar ── */}
                <View style={[styles.topNavContainer, { borderBottomColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
                    <BlurView intensity={Platform.OS === 'ios' ? 95 : 85} tint={theme.isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
                    <View style={styles.headerTitleRow}>
                        <MenuDropdown />
                        <Text style={[styles.mainTitle, { color: theme.text }]}>🌱 Part B (Foundational)</Text>
                        <View style={{ width: 30 }} />
                    </View>
                    
                    {/* Sleek Gold Progress Bar Navigation */}
                    <View style={styles.progressBarWrapper}>
                        {/* Background line */}
                        <View style={[styles.progressLineBg, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]} />
                        {/* Active line fill */}
                        <View 
                            style={[
                                styles.progressLineFill, 
                                { 
                                    width: `${(currentDomainIndex / 5) * 100}%`,
                                    backgroundColor: '#D4AF37'
                                }
                            ]} 
                        />
                        
                        {/* Progress Nodes */}
                        {domains.map((dom, index) => {
                            const isActive = index === currentDomainIndex;
                            const isCompleted = index < currentDomainIndex;
                            const numLabel = DOMAIN_NUMBERS[index];
                            
                            return (
                                <TouchableOpacity
                                    key={dom}
                                    onPress={() => handleDomainChange(index)}
                                    style={[
                                        styles.progressNode,
                                        {
                                            backgroundColor: isActive 
                                                ? '#D4AF37' 
                                                : isCompleted 
                                                    ? 'rgba(212, 175, 55, 0.2)' 
                                                    : theme.isDark ? '#1E1E1E' : '#FFFFFF',
                                            borderColor: isActive || isCompleted ? '#D4AF37' : theme.isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                                        },
                                        isActive && styles.progressNodeActive
                                    ]}
                                >
                                    <Text style={[
                                        styles.progressNodeText,
                                        {
                                            color: isActive 
                                                ? '#FFFFFF' 
                                                : isCompleted 
                                                    ? '#D4AF37' 
                                                    : theme.isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
                                            fontWeight: isActive ? '800' : '600'
                                        }
                                    ]}>
                                        {numLabel}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* ── Auto-save status toast indicator ── */}
                <AutoSaveToast isSaving={isSaving} hasError={hasError} theme={theme} />

                {/* ── 3D Solid Cube Overlay (Transitioning Mode) ── */}
                {isTransitioning && (
                    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
                        <BlurView intensity={Platform.OS === 'ios' ? 30 : 15} tint="dark" style={StyleSheet.absoluteFill} />
                        <View style={styles.cubeSpinContainer}>
                            <Animated.View style={[styles.cubeWrapper, cubeWrapperStyle]}>
                                {/* Front Face (Current) */}
                                <CubeFace 
                                    title={domains[currentDomainIndex]} 
                                    activeIcon={DOMAIN_ICONS[currentDomainIndex]}
                                    rotationY="0deg" 
                                    translateZ={110} 
                                    textOpacity={faceTextOpacity}
                                    bgColors={['#9966CC', '#00D4FF']}
                                />
                                {/* Right Face (Target/Next) */}
                                <CubeFace 
                                    title={domains[transitionNextIndex]} 
                                    activeIcon={DOMAIN_ICONS[transitionNextIndex]}
                                    rotationY="90deg" 
                                    translateZ={110} 
                                    textOpacity={faceTextOpacity}
                                    bgColors={['#00D4FF', '#9966CC']}
                                />
                                {/* Left Face (Target/Prev) */}
                                <CubeFace 
                                    title={domains[transitionNextIndex]} 
                                    activeIcon={DOMAIN_ICONS[transitionNextIndex]}
                                    rotationY="-90deg" 
                                    translateZ={110} 
                                    textOpacity={faceTextOpacity}
                                    bgColors={['#00D4FF', '#9966CC']}
                                />
                                {/* Top Face (ACADEMIA) */}
                                <CubeFace 
                                    title="ACADEMIA" 
                                    rotateX="90deg" 
                                    translateZ={110} 
                                    textOpacity={faceTextOpacity}
                                    bgColors={['#4facfe', '#00f2fe']}
                                />
                                {/* Bottom Face (HPC) */}
                                <CubeFace 
                                    title="HPC CARD" 
                                    rotateX="-90deg" 
                                    translateZ={110} 
                                    textOpacity={faceTextOpacity}
                                    bgColors={['#2A2A2A', '#121212']}
                                />
                                {/* Back Face */}
                                <CubeFace 
                                    title="FOUNDATIONAL" 
                                    rotationY="180deg" 
                                    translateZ={110} 
                                    textOpacity={faceTextOpacity}
                                    bgColors={['#9966CC', '#2E8B57']}
                                />
                            </Animated.View>
                        </View>
                    </View>
                )}

                {/* ── Main Forms Scroll Body ── */}
                {isLoading ? (
                    <View style={styles.loaderContainer}>
                        <ActivityIndicator size="large" color="#00D4FF" />
                        <Text style={[styles.loaderText, { color: theme.secondaryText }]}>Loading Progress Card...</Text>
                    </View>
                ) : (
                    <Animated.View style={[{ flex: 1 }, mainContentAnimatedStyle]}>
                        <ScrollView
                            style={styles.megaScroll}
                            contentContainerStyle={styles.scrollContent}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                        >
                            {/* Simple Domain Title Row - Sleek White Box background */}
                            <View style={[
                                styles.domainHeaderSimple,
                                {
                                    backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.03)' : '#FFFFFF',
                                    borderColor: theme.isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.06)',
                                    borderWidth: 1,
                                    borderRadius: 14,
                                    paddingHorizontal: 16,
                                    paddingVertical: 10,
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: theme.isDark ? 0 : 0.04,
                                    shadowRadius: 3,
                                    elevation: theme.isDark ? 0 : 1
                                }
                            ]}>
                                <Ionicons name={DOMAIN_ICONS[currentDomainIndex]} size={24} color={theme.isDark ? "#00D4FF" : "#2E5894"} />
                                <Text style={[styles.domainHeaderSimpleText, { color: theme.text }]}>
                                    {currentDomainName.toUpperCase()}
                                </Text>
                            </View>
                            <View style={[styles.domainHeaderDivider, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]} />

                            {/* SECTION 1: Curricular Goals & Competency Reveal */}
                            <InfoTrigger
                                text="1. Curricular Goals"
                                tooltipText="Check the Curricular Goal checkbox on the left to select it. Click anywhere else on the goal card to expand and choose associated competency chips."
                                theme={theme}
                            />
                            {activeDomainGoals.map((cg) => {
                                const isSelected = activeData.goals.includes(cg.text);
                                const isExpanded = expandedGoalId === cg.id;
                                const compList = activeDomainCompetenciesMap[cg.id] || [];

                                return (
                                    <Animated.View 
                                        key={cg.id} 
                                        entering={FadeInDown.duration(250)} 
                                        style={styles.glassCard}
                                    >
                                        <GemCutCard contentStyle={{ padding: 16 }}>
                                            <View style={styles.cgGoalHeader}>
                                                {/* Independent checkbox for goal selection */}
                                                <TouchableOpacity
                                                    onPress={() => toggleGoalSelection(cg.text)}
                                                    style={[
                                                        styles.cgCheckbox,
                                                        { borderColor: theme.isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)' },
                                                        isSelected && styles.cgCheckboxActive
                                                    ]}
                                                >
                                                    {isSelected && <Ionicons name="checkmark" size={12} color="#FFF" />}
                                                </TouchableOpacity>

                                                <TouchableOpacity
                                                    onPress={() => setExpandedGoalId(isExpanded ? null : cg.id)}
                                                    style={styles.cgContentClickable}
                                                    activeOpacity={0.8}
                                                >
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={styles.cgCode}>{cg.id}</Text>
                                                        <Text style={[styles.cgText, { color: theme.text }]}>{cg.text}</Text>
                                                    </View>
                                                    <Ionicons
                                                        name={isExpanded ? "chevron-up" : "chevron-down"}
                                                        size={20}
                                                        color={isSelected ? (theme.isDark ? "#00D4FF" : "#2E5894") : theme.secondaryText}
                                                        style={{ marginLeft: 8 }}
                                                    />
                                                </TouchableOpacity>
                                            </View>

                                            {/* Competencies Revealed Chips */}
                                            {isExpanded && (
                                                <Animated.View entering={FadeInDown.duration(200)} style={[styles.competencyRevealContainer, { borderTopColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)' }]}>
                                                    <Text style={[styles.competencyLabel, { color: theme.secondaryText }]}>Selectable Competencies:</Text>
                                                    <View style={styles.competenciesGrid}>
                                                        {compList.map((comp) => {
                                                            const isCompSelected = activeData.competencies.includes(comp.text);
                                                            return (
                                                                <TouchableOpacity
                                                                    key={comp.id}
                                                                    onPress={() => toggleCompetencySelection(comp.text, cg.text)}
                                                                    style={[
                                                                        styles.competencyChip,
                                                                        {
                                                                            backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.03)' : '#F0F4F8',
                                                                            borderColor: theme.isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.06)',
                                                                        },
                                                                        isCompSelected && styles.competencyChipActive
                                                                    ]}
                                                                >
                                                                    <Text style={[styles.competencyChipId, isCompSelected && { color: theme.isDark ? '#00D4FF' : '#2E5894' }]}>{comp.id}</Text>
                                                                    <Text style={[styles.competencyChipText, { color: theme.text }]}>{comp.text}</Text>
                                                                </TouchableOpacity>
                                                            );
                                                        })}
                                                    </View>
                                                </Animated.View>
                                            )}
                                        </GemCutCard>
                                    </Animated.View>
                                );
                            })}

                            {/* SECTION 2: Supporting Activities Text Box */}
                            <InfoTrigger
                                text="2. Supporting Activities"
                                tooltipText="Describe specific classroom learning tasks, toys, sports, games or experiments carried out in this developmental domain."
                                theme={theme}
                            />
                            <GemCutCard style={styles.glassCard} contentStyle={{ padding: 16 }}>
                                <TextInput
                                    style={[styles.textAreaInput, { color: theme.text }]}
                                    multiline
                                    placeholder="Describe the activities performed in class..."
                                    placeholderTextColor={theme.secondaryText + '80'}
                                    value={activeData.activities}
                                    onChangeText={(val) => updateActiveField("activities", val)}
                                    editable={!isStudent}
                                    textAlignVertical="top"
                                />
                            </GemCutCard>

                            {/* SECTION 3: Double Rubric Grid and Valley Animations */}
                            <InfoTrigger
                                text="3. Assessment Rubrics & Valley Animation"
                                tooltipText="Each developmental domain contains TWO rubrics (two separate activities). Assign reasons to Stream/Mountain/Sky columns. Mutual exclusivity is enforced. All 3 rows must be evaluated to trigger the Valley color animation."
                                theme={theme}
                            />

                            {/* Rubric 1 */}
                            <View style={[
                                styles.rubricContainerHeader,
                                {
                                    backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.03)' : '#FFFFFF',
                                    borderColor: theme.isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.06)',
                                    borderWidth: 1,
                                    borderRadius: 10,
                                    paddingHorizontal: 12,
                                    paddingVertical: 6,
                                    alignSelf: 'flex-start',
                                    marginBottom: 12
                                }
                            ]}>
                                <Text style={[styles.rubricTitleLabel, { color: theme.isDark ? '#9966CC' : '#6A1B9A', fontSize: 10 }]}>◈ Activity 1 Assessment Rubric</Text>
                            </View>
                            <ValleyAnimation activeLevel={activeData.matrix1Level} />
                            <View style={[styles.table, { borderColor: theme.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)', backgroundColor: theme.isDark ? 'rgba(0, 0, 0, 0.15)' : '#FFFFFF' }]}>
                                <View style={styles.row}>
                                    <View style={[styles.headerCellBase, { width: '28%', backgroundColor: theme.isDark ? '#222' : '#FFFFFF', borderRightColor: theme.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)' }]}>
                                        <Text style={[styles.headerTitles, { color: theme.isDark ? '#9966CC' : '#6A1B9A' }]}>ABILITY</Text>
                                    </View>
                                    <View style={[styles.headerCellBase, { width: '24%', backgroundColor: theme.isDark ? '#222' : '#FFFFFF', borderRightColor: theme.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)' }]}><AnimatedWaves color={activeData.matrix1Level === 'river' ? gems.sapphire : theme.text} active={activeData.matrix1Level === 'river'} /></View>
                                    <View style={[styles.headerCellBase, { width: '24%', backgroundColor: theme.isDark ? '#222' : '#FFFFFF', borderRightColor: theme.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)' }]}><AnimatedMountain color={activeData.matrix1Level === 'mountain' ? gems.sapphire : theme.text} active={activeData.matrix1Level === 'mountain'} /></View>
                                    <View style={[styles.headerCellBase, { width: '24%', borderRightWidth: 0, backgroundColor: theme.isDark ? '#222' : '#FFFFFF' }]}><AnimatedSky color={activeData.matrix1Level === 'sky' ? gems.sapphire : theme.text} active={activeData.matrix1Level === 'sky'} /></View>
                                </View>
                                {["AWARENESS", "SENSITIVITY", "CREATIVITY"].map((rowLabel, rIdx) => {
                                    const activeCol = (activeData.matrix1[`${rIdx}-0`]?.trim()) ? 0 : (activeData.matrix1[`${rIdx}-1`]?.trim()) ? 1 : (activeData.matrix1[`${rIdx}-2`]?.trim()) ? 2 : -1;
                                    return (
                                        <View key={rowLabel} style={[styles.row, { borderBottomColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
                                            <View style={[styles.headerCellBase, { width: '28%', backgroundColor: theme.isDark ? '#1C1C1C' : '#FFFFFF', borderRightColor: theme.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)' }]}>
                                                {rIdx === 0 ? <Eye color={theme.text} size={16} /> : rIdx === 1 ? <Feather color={theme.text} size={16} /> : <Wand2 color={theme.text} size={16} />}
                                                <Text style={[styles.sideIconText, { color: theme.text }]}>{rowLabel}</Text>
                                            </View>
                                            {[0, 1, 2].map((cIdx) => {
                                                const val = activeData.matrix1[`${rIdx}-${cIdx}`];
                                                const isLocked = activeCol !== -1 && activeCol !== cIdx;
                                                const cellBg = isLocked
                                                    ? (theme.isDark ? 'rgba(0, 0, 0, 0.45)' : 'rgba(0, 0, 0, 0.08)')
                                                    : 'transparent';
                                                return (
                                                    <Pressable
                                                        key={cIdx}
                                                        onPress={() => isLocked && handleCellPress("matrix1", rIdx, cIdx)}
                                                        style={[
                                                            styles.cellBase,
                                                            { 
                                                                width: '24%', 
                                                                borderRightColor: theme.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
                                                                backgroundColor: cellBg
                                                            },
                                                            cIdx === 2 && { borderRightWidth: 0 },
                                                            isLocked && styles.cellDisabled
                                                        ]}
                                                    >
                                                        <TextInput
                                                            style={[styles.inputCell, { color: theme.text }]}
                                                            placeholder="..."
                                                            placeholderTextColor={theme.secondaryText + '50'}
                                                            multiline
                                                            value={val}
                                                            onChangeText={(t) => {
                                                                const newM = { ...activeData.matrix1, [`${rIdx}-${cIdx}`]: t };
                                                                updateActiveField("matrix1", newM);
                                                            }}
                                                            editable={!isLocked && !isStudent}
                                                        />
                                                    </Pressable>
                                                );
                                            })}
                                        </View>
                                    );
                                })}
                            </View>

                            {/* Rubric 2 */}
                            <View style={[
                                styles.rubricContainerHeader,
                                {
                                    backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.03)' : '#FFFFFF',
                                    borderColor: theme.isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.06)',
                                    borderWidth: 1,
                                    borderRadius: 10,
                                    paddingHorizontal: 12,
                                    paddingVertical: 6,
                                    alignSelf: 'flex-start',
                                    marginTop: 30,
                                    marginBottom: 12
                                }
                            ]}>
                                <Text style={[styles.rubricTitleLabel, { color: theme.isDark ? '#9966CC' : '#6A1B9A', fontSize: 10 }]}>◈ Activity 2 Assessment Rubric</Text>
                            </View>
                            <ValleyAnimation activeLevel={activeData.matrix2Level} />
                            <View style={[styles.table, { borderColor: theme.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)', backgroundColor: theme.isDark ? 'rgba(0, 0, 0, 0.15)' : '#FFFFFF' }]}>
                                <View style={styles.row}>
                                    <View style={[styles.headerCellBase, { width: '28%', backgroundColor: theme.isDark ? '#222' : '#FFFFFF', borderRightColor: theme.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)' }]}>
                                        <Text style={[styles.headerTitles, { color: theme.isDark ? '#9966CC' : '#6A1B9A' }]}>ABILITY</Text>
                                    </View>
                                    <View style={[styles.headerCellBase, { width: '24%', backgroundColor: theme.isDark ? '#222' : '#FFFFFF', borderRightColor: theme.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)' }]}><AnimatedWaves color={activeData.matrix2Level === 'river' ? gems.sapphire : theme.text} active={activeData.matrix2Level === 'river'} /></View>
                                    <View style={[styles.headerCellBase, { width: '24%', backgroundColor: theme.isDark ? '#222' : '#FFFFFF', borderRightColor: theme.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)' }]}><AnimatedMountain color={activeData.matrix2Level === 'mountain' ? gems.sapphire : theme.text} active={activeData.matrix2Level === 'mountain'} /></View>
                                    <View style={[styles.headerCellBase, { width: '24%', borderRightWidth: 0, backgroundColor: theme.isDark ? '#222' : '#FFFFFF' }]}><AnimatedSky color={activeData.matrix2Level === 'sky' ? gems.sapphire : theme.text} active={activeData.matrix2Level === 'sky'} /></View>
                                </View>
                                {["AWARENESS", "SENSITIVITY", "CREATIVITY"].map((rowLabel, rIdx) => {
                                    const activeCol = (activeData.matrix2[`${rIdx}-0`]?.trim()) ? 0 : (activeData.matrix2[`${rIdx}-1`]?.trim()) ? 1 : (activeData.matrix2[`${rIdx}-2`]?.trim()) ? 2 : -1;
                                    return (
                                        <View key={rowLabel} style={[styles.row, { borderBottomColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
                                            <View style={[styles.headerCellBase, { width: '28%', backgroundColor: theme.isDark ? '#1C1C1C' : '#FFFFFF', borderRightColor: theme.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)' }]}>
                                                {rIdx === 0 ? <Eye color={theme.text} size={16} /> : rIdx === 1 ? <Feather color={theme.text} size={16} /> : <Wand2 color={theme.text} size={16} />}
                                                <Text style={[styles.sideIconText, { color: theme.text }]}>{rowLabel}</Text>
                                            </View>
                                            {[0, 1, 2].map((cIdx) => {
                                                const val = activeData.matrix2[`${rIdx}-${cIdx}`];
                                                const isLocked = activeCol !== -1 && activeCol !== cIdx;
                                                const cellBg = isLocked
                                                    ? (theme.isDark ? 'rgba(0, 0, 0, 0.45)' : 'rgba(0, 0, 0, 0.08)')
                                                    : 'transparent';
                                                return (
                                                    <Pressable
                                                        key={cIdx}
                                                        onPress={() => isLocked && handleCellPress("matrix2", rIdx, cIdx)}
                                                        style={[
                                                            styles.cellBase,
                                                            { 
                                                                width: '24%', 
                                                                borderRightColor: theme.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
                                                                backgroundColor: cellBg
                                                            },
                                                            cIdx === 2 && { borderRightWidth: 0 },
                                                            isLocked && styles.cellDisabled
                                                        ]}
                                                    >
                                                        <TextInput
                                                            style={[styles.inputCell, { color: theme.text }]}
                                                            placeholder="..."
                                                            placeholderTextColor={theme.secondaryText + '50'}
                                                            multiline
                                                            value={val}
                                                            onChangeText={(t) => {
                                                                const newM = { ...activeData.matrix2, [`${rIdx}-${cIdx}`]: t };
                                                                updateActiveField("matrix2", newM);
                                                            }}
                                                            editable={!isLocked && !isStudent}
                                                        />
                                                    </Pressable>
                                                );
                                            })}
                                        </View>
                                    );
                                })}
                            </View>

                            {/* SECTION 4: Consolidated Teacher Feedback */}
                            <InfoTrigger
                                text="4. Teacher Consolidated Remarks"
                                tooltipText="Provide details of specific qualitative feedback on the child's learning patterns, behaviors, and efforts."
                                theme={theme}
                            />
                            <GemCutCard style={styles.feedbackContainerCard} contentStyle={{ padding: 16 }}>
                                <TextInput
                                    style={[styles.feedbackTextAreaInput, { color: theme.text }]}
                                    multiline
                                    placeholder="Enter consolidated comments for this domain..."
                                    placeholderTextColor={theme.secondaryText + '80'}
                                    value={activeData.teacherFeedback}
                                    onChangeText={(val) => updateActiveField("teacherFeedback", val)}
                                    editable={!isStudent}
                                />
                            </GemCutCard>

                            {/* SECTION 5: Self & Peer Assessment */}
                            <InfoTrigger
                                text="5. Self & Peer Assessment (Old Emojis)"
                                tooltipText="Allows students to reflect on work difficulty and select needed classmates/materials."
                                theme={theme}
                            />
                            <GemCutCard style={styles.glassCard} contentStyle={{ padding: 16 }}>
                                <Text style={[styles.subCardHeader, { color: theme.isDark ? '#00D4FF' : '#2E5894' }]}>🧒 Self Assessment</Text>
                                
                                <Text style={[styles.questionHeaderLabel, { color: theme.text }]}>I liked doing this work.</Text>
                                <View style={styles.emojiRow}>
                                    {EMOJIS.map(e => (
                                        <GemstoneButton
                                            key={e.value}
                                            label={e.label}
                                            emoji={e.emoji}
                                            selected={activeData.selfLiked === e.value}
                                            onPress={() => updateActiveField("selfLiked", e.value)}
                                        />
                                    ))}
                                </View>

                                <Text style={[styles.questionHeaderLabel, { color: theme.text }]}>I found this work easy.</Text>
                                <View style={styles.emojiRow}>
                                    {EMOJIS.map(e => (
                                        <GemstoneButton
                                            key={e.value}
                                            label={e.label}
                                            emoji={e.emoji}
                                            selected={activeData.selfEasy === e.value}
                                            onPress={() => updateActiveField("selfEasy", e.value)}
                                        />
                                    ))}
                                </View>

                                <Text style={[styles.questionHeaderLabel, { color: theme.text }]}>To do this work, I needed:</Text>
                                <View style={styles.resourcesWrapperGrid}>
                                    {PEER_RESOURCES.map(r => {
                                        const checked = activeData.selfNeeded.includes(r.id);
                                        return (
                                            <TouchableOpacity
                                                key={r.id}
                                                onPress={() => toggleNeededResources("selfNeeded", r.id)}
                                                style={[
                                                    styles.resourceChipItem, 
                                                    { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : '#F0F4F8' },
                                                    checked && [styles.resourceChipItemActive, { borderColor: theme.isDark ? '#00D4FF' : '#2E5894' }]
                                                ]}
                                            >
                                                <View style={[
                                                    styles.checkboxOutline,
                                                    { borderColor: theme.isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)' },
                                                    checked && [styles.checkboxOutlineActive, { backgroundColor: theme.isDark ? '#00D4FF' : '#2E5894', borderColor: theme.isDark ? '#00D4FF' : '#2E5894' }]
                                                ]}>
                                                    {checked && <Ionicons name="checkmark" size={12} color="#FFF" />}
                                                </View>
                                                <Text style={[styles.checkboxLabelText, { color: theme.text }]}>{r.label}</Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>

                                <View style={[styles.dividerLine, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]} />

                                <Text style={[styles.subCardHeader, { color: theme.isDark ? '#00D4FF' : '#2E5894' }]}>👥 Peer Assessment</Text>

                                <Text style={[styles.questionHeaderLabel, { color: theme.text }]}>My friend liked doing this work.</Text>
                                <View style={styles.emojiRow}>
                                    {EMOJIS.map(e => (
                                        <GemstoneButton
                                            key={e.value}
                                            label={e.label}
                                            emoji={e.emoji}
                                            selected={activeData.peerLiked === e.value}
                                            onPress={() => updateActiveField("peerLiked", e.value)}
                                        />
                                    ))}
                                </View>

                                <Text style={[styles.questionHeaderLabel, { color: theme.text }]}>My friend found this work easy.</Text>
                                <View style={styles.emojiRow}>
                                    {EMOJIS.map(e => (
                                        <GemstoneButton
                                            key={e.value}
                                            label={e.label}
                                            emoji={e.emoji}
                                            selected={activeData.peerEasy === e.value}
                                            onPress={() => updateActiveField("peerEasy", e.value)}
                                        />
                                    ))}
                                </View>

                                <Text style={[styles.questionHeaderLabel, { color: theme.text }]}>To do this work, my friend needed:</Text>
                                <View style={styles.resourcesWrapperGrid}>
                                    {PEER_RESOURCES.map(r => {
                                        const checked = activeData.peerNeeded.includes(r.id);
                                        return (
                                            <TouchableOpacity
                                                key={r.id}
                                                onPress={() => toggleNeededResources("peerNeeded", r.id)}
                                                style={[
                                                    styles.resourceChipItem,
                                                    { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : '#F0F4F8' },
                                                    checked && [styles.resourceChipItemActive, { borderColor: theme.isDark ? '#00D4FF' : '#2E5894' }]
                                                ]}
                                            >
                                                <View style={[
                                                    styles.checkboxOutline,
                                                    { borderColor: theme.isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)' },
                                                    checked && [styles.checkboxOutlineActive, { backgroundColor: theme.isDark ? '#00D4FF' : '#2E5894', borderColor: theme.isDark ? '#00D4FF' : '#2E5894' }]
                                                ]}>
                                                    {checked && <Ionicons name="checkmark" size={12} color="#FFF" />}
                                                </View>
                                                <Text style={[styles.checkboxLabelText, { color: theme.text }]}>{r.label}</Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </GemCutCard>

                            {/* SECTION 6: Parent Caregiver Observation */}
                            <InfoTrigger
                                text="6. Parent/Caregiver Observation"
                                tooltipText="Gather observations from home. Toggle resources and write comments about progress."
                                theme={theme}
                            />
                            <GemCutCard style={styles.glassCard} contentStyle={{ padding: 16 }}>
                                <Text style={[styles.questionHeaderLabel, { color: theme.text, marginTop: 0 }]}>Home Learning Resources Available:</Text>
                                <View style={styles.resourcesWrapperGrid}>
                                    {PARENT_RESOURCES.map(r => {
                                        const checked = activeData.parentResources.includes(r.id);
                                        return (
                                            <TouchableOpacity
                                                key={r.id}
                                                onPress={() => toggleNeededResources("parentResources", r.id)}
                                                style={[
                                                    styles.resourceChipItem,
                                                    { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : '#F0F4F8' },
                                                    checked && [styles.resourceChipItemActive, { borderColor: theme.isDark ? '#00D4FF' : '#2E5894' }]
                                                ]}
                                            >
                                                <View style={[
                                                    styles.checkboxOutline,
                                                    { borderColor: theme.isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)' },
                                                    checked && [styles.checkboxOutlineActive, { backgroundColor: theme.isDark ? '#00D4FF' : '#2E5894', borderColor: theme.isDark ? '#00D4FF' : '#2E5894' }]
                                                ]}>
                                                    {checked && <Ionicons name="checkmark" size={12} color="#FFF" />}
                                                </View>
                                                <Text style={[styles.checkboxLabelText, { color: theme.text }]}>{r.label}</Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>

                                <Text style={[styles.questionHeaderLabel, { color: theme.text }]}>Parent Remarks / Observations:</Text>
                                <TextInput
                                    style={[styles.textAreaInput, { color: theme.text, minHeight: 80 }]}
                                    multiline
                                    placeholder="Enter parent comments or notes..."
                                    placeholderTextColor={theme.secondaryText + '80'}
                                    value={activeData.parentRemarks}
                                    onChangeText={(val) => updateActiveField("parentRemarks", val)}
                                />
                            </GemCutCard>

                            {/* Bottom Buttons - Proceed & Navigation controls */}
                            <View style={styles.bottomNavButtonsWrapper}>
                                {currentDomainIndex > 0 && (
                                    <TouchableOpacity
                                        onPress={() => handleDomainChange(currentDomainIndex - 1)}
                                        style={[styles.backNavBtn, { borderColor: theme.isDark ? theme.border : 'rgba(0,150,136,0.3)', backgroundColor: theme.isDark ? 'transparent' : '#FFF' }]}
                                    >
                                        <Ionicons name="arrow-back" size={16} color={theme.isDark ? theme.text : '#009688'} />
                                        <Text style={[styles.backNavBtnText, { color: theme.isDark ? theme.text : '#009688' }]}>Prev Domain</Text>
                                    </TouchableOpacity>
                                )}

                                <GemButton
                                    gemType="silver"
                                    onPress={handleNextButton}
                                    disabled={isSaving}
                                    width={currentDomainIndex > 0 ? 180 : 220}
                                >
                                    <View style={styles.nextBtnInner}>
                                        <Text style={[styles.nextBtnText, { color: '#7FFFD4' }]}>
                                            {currentDomainIndex < 5 ? "Next Domain" : "Go to Part C"}
                                        </Text>
                                        <Ionicons name="arrow-forward" size={16} color="#7FFFD4" />
                                    </View>
                                </GemButton>
                            </View>

                            <View style={{ height: 100 }} />
                        </ScrollView>
                    </Animated.View>
                )}
            </SafeAreaView>
        </View>
    );
}

// ── Visual Styling Layout ──
const styles = StyleSheet.create({
    topNavContainer: {
        height: 140,
        width: '100%',
        position: 'absolute',
        top: 0,
        zIndex: 1000,
        borderBottomWidth: 1
    },
    headerTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: Platform.OS === 'android' ? 42 : 46,
        paddingHorizontal: 20
    },
    mainTitle: {
        fontSize: 15,
        fontWeight: '800',
        letterSpacing: 1.5,
        fontFamily: 'Outfit_600SemiBold',
        textTransform: 'uppercase'
    },
    progressBarWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        marginTop: 10,
        position: 'relative',
        height: 40,
        width: '100%'
    },
    progressLineBg: {
        position: 'absolute',
        height: 3,
        left: 40,
        right: 40,
        top: '50%',
        marginTop: -1.5,
        borderRadius: 1.5,
        zIndex: 1
    },
    progressLineFill: {
        position: 'absolute',
        height: 3,
        left: 40,
        top: '50%',
        marginTop: -1.5,
        borderRadius: 1.5,
        zIndex: 2
    },
    progressNode: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 3,
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 2,
        elevation: 2
    },
    progressNodeActive: {
        shadowOpacity: 0.4,
        shadowRadius: 4,
        elevation: 4
    },
    progressNodeText: {
        fontSize: 10,
        fontFamily: 'Outfit_600SemiBold'
    },
    megaScroll: {
        flex: 1,
        marginTop: 140
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40
    },
    domainHeaderSimple: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 6,
        gap: 12,
        marginTop: 5
    },
    domainHeaderSimpleText: {
        fontSize: 14,
        fontWeight: '800',
        letterSpacing: 2,
        fontFamily: 'Outfit_600SemiBold'
    },
    domainHeaderDivider: {
        height: 1,
        width: '100%',
        marginBottom: 20,
        marginTop: 5
    },
    infoWrapper: {
        marginBottom: 8,
        marginTop: 12
    },
    headerWithInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    fieldLabel: {
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        fontFamily: 'Outfit_600SemiBold'
    },
    infoButton: {
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: 'rgba(0, 212, 255, 0.15)',
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative'
    },
    pulseRing: {
        position: 'absolute',
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 1.5
    },
    questionMarkText: {
        fontSize: 10,
        fontWeight: '900'
    },
    tooltipBox: {
        marginTop: 6,
        borderRadius: 14,
        overflow: 'hidden',
        borderWidth: 1,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8
    },
    tooltipText: {
        fontSize: 11,
        lineHeight: 16,
        fontFamily: 'Inter_400Regular'
    },
    glassCard: {
        marginBottom: 16
    },
    glassCardActive: {
        borderColor: 'rgba(0, 212, 255, 0.35)',
        backgroundColor: 'rgba(0, 212, 255, 0.02)'
    },
    cgGoalHeader: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    cgCheckbox: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 1.5,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 6
    },
    cgCheckboxActive: {
        borderColor: '#2E5894',
        backgroundColor: '#2E5894'
    },
    cgContentClickable: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    cgCode: {
        fontSize: 10,
        fontWeight: '800',
        color: '#9966CC',
        letterSpacing: 1,
        marginBottom: 2
    },
    cgText: {
        fontSize: 13,
        fontWeight: '600',
        lineHeight: 18,
        fontFamily: 'Inter_400Regular'
    },
    competencyRevealContainer: {
        marginTop: 15,
        borderTopWidth: 1,
        paddingTop: 12
    },
    competencyLabel: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 10
    },
    competenciesGrid: {
        gap: 8
    },
    competencyChip: {
        borderRadius: 12,
        borderWidth: 1,
        padding: 10,
    },
    competencyChipActive: {
        borderColor: 'rgba(0, 212, 255, 0.5)',
        backgroundColor: 'rgba(0, 212, 255, 0.08)'
    },
    competencyChipId: {
        fontSize: 8,
        fontWeight: '900',
        color: '#9966CC',
        marginBottom: 2
    },
    competencyChipText: {
        fontSize: 11,
        lineHeight: 15,
        fontFamily: 'Inter_400Regular'
    },
    textAreaInput: {
        minHeight: 100,
        fontSize: 13,
        lineHeight: 18,
        fontFamily: 'Inter_400Regular'
    },
    feedbackTextAreaInput: {
        minHeight: 110,
        fontSize: 13,
        lineHeight: 18,
        fontFamily: 'Inter_400Regular'
    },
    feedbackContainerCard: {
        marginBottom: 16
    },
    rubricContainerHeader: {
        marginVertical: 10,
        paddingLeft: 6
    },
    rubricTitleLabel: {
        fontSize: 12,
        fontWeight: '800',
        color: '#9966CC',
        letterSpacing: 1,
        textTransform: 'uppercase'
    },
    imageFrame: {
        alignItems: 'center',
        marginBottom: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        borderRadius: 20,
        paddingVertical: 15,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)'
    },
    imageInner: {
        width: '100%',
        alignItems: 'center'
    },
    valleyImage: {
        width: 170,
        height: 170
    },
    imageCaption: {
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        fontFamily: 'Outfit_600SemiBold'
    },
    captionBadge: {
        marginTop: 10,
        paddingHorizontal: 16,
        paddingVertical: 5,
        borderRadius: 20,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
    table: {
        borderWidth: 1,
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 25
    },
    row: {
        flexDirection: 'row',
        minHeight: 74
    },
    headerCellBase: {
        padding: 4,
        justifyContent: 'center',
        alignItems: 'center',
        borderRightWidth: 1
    },
    cellBase: {
        padding: 4,
        justifyContent: 'center',
        borderRightWidth: 1
    },
    cellDisabled: {
        opacity: 0.3
    },
    headerTitles: {
        fontSize: 8,
        fontWeight: '900',
        color: '#9966CC',
        letterSpacing: 0.5,
        textAlign: 'center'
    },
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        paddingVertical: 2,
        paddingHorizontal: 4,
        borderRadius: 8
    },
    activeIconContainer: {
        backgroundColor: 'rgba(0, 212, 255, 0.08)'
    },
    iconText: {
        fontSize: 6,
        fontWeight: '900',
        marginTop: 1,
        letterSpacing: 0.5
    },
    sideIconText: {
        fontSize: 7,
        fontWeight: '900',
        textAlign: 'center',
        color: '#00D4FF',
        marginTop: 3,
        letterSpacing: 0.5
    },
    inputCell: {
        flex: 1,
        fontSize: 9,
        textAlignVertical: 'top',
        textAlign: 'center',
        padding: 4,
        fontFamily: 'Inter_400Regular'
    },
    subCardHeader: {
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 12,
        fontFamily: 'Outfit_600SemiBold'
    },
    questionHeaderLabel: {
        fontSize: 11,
        fontWeight: '600',
        marginBottom: 8,
        marginTop: 15,
        fontFamily: 'Inter_400Regular'
    },
    emojiRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 8
    },
    gemstoneButton: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        borderBottomWidth: 3,
        borderBottomColor: 'rgba(153, 102, 204, 0.3)',
        paddingVertical: 10,
        justifyContent: 'center',
        alignItems: 'center'
    },
    gemstoneButtonSelected: {
        borderColor: '#9966CC',
        backgroundColor: 'rgba(153, 102, 204, 0.08)',
        borderBottomColor: '#9966CC'
    },
    gemstoneButtonInner: {
        alignItems: 'center',
        justifyContent: 'center'
    },
    gemstoneEmoji: {
        fontSize: 18
    },
    gemstoneText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#FFF',
        marginTop: 4,
        textAlign: 'center'
    },
    dividerLine: {
        height: 1,
        marginVertical: 20,
        opacity: 0.1
    },
    resourcesWrapperGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 4
    },
    resourceChipItem: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        paddingVertical: 8,
        paddingHorizontal: 12,
        flexBasis: '48%'
    },
    resourceChipItemActive: {
        backgroundColor: 'rgba(0, 212, 255, 0.05)'
    },
    checkboxOutline: {
        width: 16,
        height: 16,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8
    },
    checkboxOutlineActive: {
        borderColor: '#2E5894',
        backgroundColor: '#2E5894'
    },
    checkboxLabelText: {
        fontSize: 10,
        fontWeight: '600',
        fontFamily: 'Inter_400Regular'
    },
    bottomNavButtonsWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 35,
        gap: 15
    },
    backNavBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderRadius: 25,
        paddingVertical: 12,
        paddingHorizontal: 20,
        height: 46,
        gap: 8
    },
    backNavBtnText: {
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1,
        textTransform: 'uppercase'
    },
    nextBtnInner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6
    },
    nextBtnText: {
        fontWeight: '800',
        fontSize: 11,
        letterSpacing: 1.5,
        textTransform: 'uppercase'
    },
    loaderContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
    loaderText: {
        fontSize: 11,
        marginTop: 10,
        letterSpacing: 1
    },
    toastContainer: {
        position: 'absolute',
        top: 150,
        right: 20,
        zIndex: 100
    },
    toastBlur: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)'
    },
    toastText: {
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 0.5,
        textTransform: 'uppercase'
    },

    // ── 3D Solid Cube Spin styles ──
    cubeSpinContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
    cubeWrapper: {
        width: 220,
        height: 220,
        transformStyle: 'preserve-3d',
        position: 'relative'
    },
    cubeFace: {
        position: 'absolute',
        width: 220,
        height: 220,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.25)',
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#00D4FF',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.35,
        shadowRadius: 20,
        elevation: 10
    },
    cubeFaceGradient: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 18
    },
    cubeFaceContent: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%'
    },
    cubeFaceTitle: {
        fontSize: 11,
        fontWeight: '900',
        color: '#FFF',
        textAlign: 'center',
        letterSpacing: 1.5,
        lineHeight: 16
    }
});
