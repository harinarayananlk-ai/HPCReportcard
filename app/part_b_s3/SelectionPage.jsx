import React, { useState, useEffect, useMemo, useRef } from 'react';
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
import Svg, { Path, Circle, G, Text as SvgText, Line, Rect } from 'react-native-svg';
import { Eye, Feather, Wand2 } from 'lucide-react-native';

import PremiumBackground from '../../components/PremiumBackground';
import GemButton from '../../components/GemButton';
import MenuDropdown from '../../components/MenuDropdown';
import { gems } from '../../colour_themes';
import { domains, curricularGoals, competencies } from '../../constants/SelectionData_s3';

const { width: W } = Dimensions.get('window');

// ── 14 Slides mapped to 7 domains ──
const slides = [
    { domainIndex: 0, title: "Language Education (Language 1 - R1)", key: "Language 1", icon: "book-outline" },
    { domainIndex: 0, title: "Language Education (Language 2 - R2)", key: "Language 2", icon: "chatbubbles-outline" },
    { domainIndex: 0, title: "Language Education (Language 3 - R3)", key: "Language 3", icon: "language-outline" },
    { domainIndex: 1, title: "Mathematics", key: "Mathematics", icon: "calculator-outline" },
    { domainIndex: 2, title: "Science", key: "Science", icon: "flask-outline" },
    { domainIndex: 3, title: "Social Science", key: "Social Science", icon: "earth-outline" },
    { domainIndex: 4, title: "Art Education (Visual Arts)", key: "Art Education (Visual Arts)", icon: "color-palette-outline" },
    { domainIndex: 4, title: "Art Education (Theatre)", key: "Art Education (Theatre)", icon: "color-palette-outline" },
    { domainIndex: 4, title: "Art Education (Music)", key: "Art Education (Music)", icon: "color-palette-outline" },
    { domainIndex: 4, title: "Art Education (Dance & Movement)", key: "Art Education (Dance & Movement)", icon: "color-palette-outline" },
    { domainIndex: 4, title: "Art Education (Learning Standard 2)", key: "Art Education (LS2)", icon: "color-palette-outline" },
    { domainIndex: 5, title: "Physical Education (Learning Standard 1)", key: "Physical Education (Learning Standard 1)", icon: "fitness-outline" },
    { domainIndex: 5, title: "Physical Education (Learning Standard 2)", key: "Physical Education (Learning Standard 2)", icon: "fitness-outline" },
    { domainIndex: 6, title: "Vocational/Skill Education", key: "Vocational/Skill Education", icon: "construct-outline" }
];

const DOMAIN_NUMBERS = ["1", "2", "3", "4", "5", "6", "7"];
const domainsList = [
    "Language Education (Language 1, 2, 3)",
    "Mathematics",
    "Science",
    "Social Science",
    "Art Education (Visual Arts, Theatre, Music, Dance & Movement, LS2)",
    "Physical Education (Learning Standard 1 & 2)",
    "Vocational/Skill Education"
];

// Activity Approach Options
const ACTIVITY_OPTIONS = [
    "Art-integrated",
    "Technology-integrated",
    "Sports-integrated",
    "Toy-based",
    "Any Other"
];

// Areas of Strength Options
const STRENGTHS_OPTIONS = [
    "Follow Instructions", "Independent Work", "Communication", "Solution-focused Thinking",
    "Empathy", "Organization & Prioritization", "Collaboration", "Responsible",
    "Creative", "Concentration", "None", "Any other"
];

// Barriers to Success Options
const BARRIERS_OPTIONS = [
    "Lack of Attention", "Lack of Motivation", "Lack of Preparation",
    "Inappropriate behaviour in classroom", "Severe illness or injury",
    "Peer Pressure", "Undefined Goals", "Domestic Issues"
];

// 4 Gemstone Options
const STUDENT_VIBE_OPTIONS = [
    { label: "Yes", emoji: "😊", value: "Yes" },
    { label: "To an extent", emoji: "🤔", value: "To an extent" },
    { label: "No", emoji: "😟", value: "No" },
    { label: "Not sure", emoji: "❓", value: "Not sure" }
];

const PEER_VIBE_OPTIONS = [
    { label: "Yes", emoji: "😊", value: "Yes" },
    { label: "Sometimes", emoji: "🤔", value: "Sometimes" },
    { label: "No", emoji: "😟", value: "No" },
    { label: "Not sure", emoji: "❓", value: "Not sure" }
];

// Self Progress Grid Statements
const SELF_PROGRESS_GRID = {
    awareness: [
        "I was able to learn something new.",
        "I was able to understand the activity.",
        "I was able to follow the instructions.",
        "I was attentive to every detail of the activity.",
        "I was able to focus and engage with the activity.",
        "I was able to find purpose and meaning in the activity."
    ],
    sensitivity: [
        "I was able to understand and express my emotions.",
        "I was able to understand the emotions of my peer.",
        "I was able to contribute individually or as a group member.",
        "I was able to motivate myself and my peer when things were difficult.",
        "I was able to seek and use support from my peers and teacher.",
        "I was able to help others in some way."
    ],
    creativity: [
        "I was curious to explore and learn new things during the activity.",
        "I was able to think of new ways to do the activity.",
        "I was able to generate innovative ideas.",
        "I was able to think of 'out of the box' solutions.",
        "I was able to express my creativity while doing the activity.",
        "I was able to take calculated risks."
    ]
};

// Peer Progress Grid Statements
const PEER_PROGRESS_GRID = {
    awareness: [
        "My peer learnt something new.",
        "My peer understood the activity.",
        "My peer followed the instructions.",
        "My peer was attentive to every detail of the activity.",
        "My peer was able to focus on the activity.",
        "My peer found this activity meaningful."
    ],
    sensitivity: [
        "My peer can express his/her emotions well.",
        "My peer can understand my emotions well.",
        "My peer contributed to the success of the activity.",
        "My peer was motivated throughout the activity.",
        "My peer was able to ask help/support from me or the teacher.",
        "My peer was able to help others in some way."
    ],
    creativity: [
        "My peer was curious to learn new things.",
        "My peer was able to think of new ways to do the activity.",
        "My peer was able to generate innovative ideas.",
        "My peer was able to think of 'out of the box' solutions.",
        "My peer was able to express her/his creativity during the activity.",
        "My peer was able to take calculated risks."
    ]
};

// ── INITIAL STATE SCHEMAS FOR A DOMAIN ──
const createInitialDomainState = () => ({
    goals: [],
    competencies: [],
    activityApproach: [],
    anyOtherApproach: "",
    activityHours: "0",
    activityMinutes: "0",
    materialsRequired: "",
    activityDescription: "",
    rubricMatrix: {
        "0-0": "", "0-1": "", "0-2": "",
        "1-0": "", "1-1": "", "1-2": "",
        "2-0": "", "2-1": "", "2-2": ""
    },
    studentVibe: {
        q1: "",
        q2: "",
        q3: ""
    },
    studentProgress: {
        awareness: [],
        sensitivity: [],
        creativity: []
    },
    studentLearnings: {
        learnt: "",
        interesting: "",
        practice: "",
        help: ""
    },
    peerVibe: {
        q1: "",
        q2: ""
    },
    peerProgress: {
        awareness: [],
        sensitivity: [],
        creativity: []
    },
    peerLearnings: {
        practice: "",
        help: ""
    },
    strengths: [],
    anyOtherStrength: "",
    barriers: []
});

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
        ? (isDark ? 'rgba(0, 85, 255, 0.15)' : 'rgba(0, 85, 255, 0.08)')
        : (isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)');
    
    const buttonBorder = selected
        ? '#0055FF'
        : (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.08)');
        
    const buttonBottomBorder = selected
        ? '#0055FF'
        : (isDark ? 'rgba(0, 85, 255, 0.3)' : 'rgba(0, 85, 255, 0.2)');

    const textColor = selected
        ? '#007FFF'
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

// ── Interactive Help Tooltip ──
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
                <Text style={[styles.fieldLabel, { color: theme.isDark ? '#00D4FF' : '#0055FF' }]}>{text}</Text>
                <TouchableOpacity onPress={() => setOpen(!open)} style={[styles.infoButton, { borderColor: theme.isDark ? 'rgba(0, 212, 255, 0.4)' : 'rgba(0, 85, 255, 0.4)' }]}>
                    <Animated.View style={[styles.pulseRing, pulseStyle, { borderColor: theme.isDark ? 'rgba(0, 212, 255, 0.6)' : 'rgba(0, 85, 255, 0.6)' }]} />
                    <Text style={[styles.questionMarkText, { color: theme.isDark ? '#00D4FF' : '#0055FF' }]}>?</Text>
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

const IMAGE_SOURCES = {
    none: require('../../assets/images/visily-image-removebg-preview.png'),
    stream: require('../../assets/images/river.png'),
    mountain: require('../../assets/images/mountain+river.png'),
    sky: require('../../assets/images/ChatGPT_Image_May_11__2026__02_55_58_PM-removebg-preview.png'),
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
                    {activeLevel === 'none' ? 'Fill all rubrics to color valley' : activeLevel === 'stream' ? '◈ Stream Level' : activeLevel === 'mountain' ? '◈ Mountain Level' : '◈ Sky Level'}
                </Text>
            </View>
        </View>
    );
};

// Helper function to build custom SVG segment ring arcs
function getArcPath(cx, cy, r_in, r_out, startAngle, endAngle) {
    const getCoordinate = (x, y, r, angle) => {
        const rad = (angle - 90) * Math.PI / 180.0;
        return {
            x: x + r * Math.cos(rad),
            y: y + r * Math.sin(rad)
        };
    };

    const startIn = getCoordinate(cx, cy, r_in, startAngle);
    const endIn = getCoordinate(cx, cy, r_in, endAngle);
    const startOut = getCoordinate(cx, cy, r_out, startAngle);
    const endOut = getCoordinate(cx, cy, r_out, endAngle);
    
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    
    return [
        `M ${startOut.x} ${startOut.y}`,
        `A ${r_out} ${r_out} 0 ${largeArcFlag} 1 ${endOut.x} ${endOut.y}`,
        `L ${endIn.x} ${endIn.y}`,
        `A ${r_in} ${r_in} 0 ${largeArcFlag} 0 ${startIn.x} ${startIn.y}`,
        `Z`
    ].join(" ");
}

const getRadialPoint = (cx, cy, r, angle) => {
    const rad = (angle - 90) * Math.PI / 180.0;
    return {
        x: cx + r * Math.cos(rad),
        y: cy + r * Math.sin(rad)
    };
};

function getArcOuterPath(cx, cy, r, startAngle, endAngle) {
    const rad = (angle) => (angle - 90) * Math.PI / 180.0;
    const start = {
        x: cx + r * Math.cos(rad(startAngle)),
        y: cy + r * Math.sin(rad(startAngle))
    };
    const end = {
        x: cx + r * Math.cos(rad(endAngle)),
        y: cy + r * Math.sin(rad(endAngle))
    };
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
}

// ── SVG Assessment Wheel Data Viz component ──
const AssessmentWheel = ({ scores, theme }) => {
    // scores = { awareness: { teacher: 'stream', student: 'mountain', peer: 'sky' }, sensitivity: ... }
    const cx = 100;
    const cy = 100;

    const ringRadii = {
        none: { in: 0, out: 0 },
        stream: { in: 35, out: 52 },
        mountain: { in: 35, out: 70 },
        sky: { in: 35, out: 88 }
    };

    const renderWedgeSegment = (category, startAngle, activeScores) => {
        // activeScores = { teacher: 'Level', student: 'Level', peer: 'Level' }
        // Wedge spans 120 degrees, split into 3 sub-slices of 40 degrees each
        // Teacher: startAngle to startAngle + 40
        // Student: startAngle + 40 to startAngle + 80
        // Peer: startAngle + 80 to startAngle + 120
        return ['teacher', 'student', 'peer'].map((role, idx) => {
            const roleStart = startAngle + idx * 40;
            const roleEnd = roleStart + 40;
            const scoreVal = activeScores[role] || 'none';

            // Active fill colors based on role
            const roleColors = {
                teacher: { active: '#FF6B6B', bg: theme.isDark ? 'rgba(255,107,107,0.08)' : 'rgba(255,107,107,0.04)' },
                student: { active: '#33CC99', bg: theme.isDark ? 'rgba(51,204,153,0.08)' : 'rgba(51,204,153,0.04)' },
                peer: { active: '#A390E4', bg: theme.isDark ? 'rgba(163,144,228,0.08)' : 'rgba(163,144,228,0.04)' }
            };
            const cols = roleColors[role];

            // Background arc (full size 35 to 88)
            const bgPath = getArcPath(cx, cy, 35, 88, roleStart, roleEnd);
            
            // Active arc based on level
            const radiusRange = ringRadii[scoreVal];
            const activePath = radiusRange.out > 0 
                ? getArcPath(cx, cy, radiusRange.in, radiusRange.out, roleStart, roleEnd) 
                : null;

            return (
                <G key={role}>
                    {/* Background track */}
                    <Path d={bgPath} fill={cols.bg} stroke={theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'} strokeWidth={1} />
                    {/* Active fill */}
                    {activePath && (
                        <Path d={activePath} fill={cols.active} stroke={theme.isDark ? '#121212' : '#FFF'} strokeWidth={1} />
                    )}
                </G>
            );
        });
    };

    return (
        <View style={styles.wheelWrapper}>
            <Svg width={220} height={220} viewBox="0 0 200 200">
                {/* Sensitivity Wedge: 0 to 120 */}
                {renderWedgeSegment('sensitivity', 0, scores.sensitivity)}
                {/* Creativity Wedge: 120 to 240 */}
                {renderWedgeSegment('creativity', 120, scores.creativity)}
                {/* Awareness Wedge: 240 to 360 */}
                {renderWedgeSegment('awareness', 240, scores.awareness)}

                {/* Inner border line or divisions */}
                <Circle cx={cx} cy={cy} r={35} fill="transparent" stroke={theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'} strokeWidth={1.5} />
                <Circle cx={cx} cy={cy} r={52} fill="transparent" stroke={theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'} strokeDasharray="3 3" />
                <Circle cx={cx} cy={cy} r={70} fill="transparent" stroke={theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'} strokeDasharray="3 3" />
                <Circle cx={cx} cy={cy} r={88} fill="transparent" stroke={theme.isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'} strokeWidth={1.5} />

                {/* Wedge Borders */}
                <Path d={getArcOuterPath(cx, cy, 88, 0, 120)} fill="none" stroke="#FFD700" strokeWidth={2} />
                <Path d={getArcOuterPath(cx, cy, 88, 120, 240)} fill="none" stroke="#007FFF" strokeWidth={2} />
                <Path d={getArcOuterPath(cx, cy, 88, 240, 360)} fill="none" stroke="#FF66CC" strokeWidth={2} />

                {/* Radial boundary lines */}
                <Line 
                    x1={getRadialPoint(cx, cy, 35, 0).x} 
                    y1={getRadialPoint(cx, cy, 35, 0).y} 
                    x2={getRadialPoint(cx, cy, 88, 0).x} 
                    y2={getRadialPoint(cx, cy, 88, 0).y} 
                    stroke="#FFD700" 
                    strokeWidth={2} 
                />
                <Line 
                    x1={getRadialPoint(cx, cy, 35, 120).x} 
                    y1={getRadialPoint(cx, cy, 35, 120).y} 
                    x2={getRadialPoint(cx, cy, 88, 120).x} 
                    y2={getRadialPoint(cx, cy, 88, 120).y} 
                    stroke="#007FFF" 
                    strokeWidth={2} 
                />
                <Line 
                    x1={getRadialPoint(cx, cy, 35, 240).x} 
                    y1={getRadialPoint(cx, cy, 35, 240).y} 
                    x2={getRadialPoint(cx, cy, 88, 240).x} 
                    y2={getRadialPoint(cx, cy, 88, 240).y} 
                    stroke="#FF66CC" 
                    strokeWidth={2} 
                />

                {/* Concentric letters B, P, A inside rings */}
                {[60, 180, 300].map((angle) => {
                    const ptB = getRadialPoint(cx, cy, 43.5, angle);
                    const ptP = getRadialPoint(cx, cy, 61, angle);
                    const ptA = getRadialPoint(cx, cy, 79, angle);
                    return (
                        <G key={angle}>
                            <SvgText x={ptB.x} y={ptB.y + 3} textAnchor="middle" fontSize="7" fontWeight="bold" fill={theme.isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)'}>B</SvgText>
                            <SvgText x={ptP.x} y={ptP.y + 3} textAnchor="middle" fontSize="7" fontWeight="bold" fill={theme.isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)'}>P</SvgText>
                            <SvgText x={ptA.x} y={ptA.y + 3} textAnchor="middle" fontSize="7" fontWeight="bold" fill={theme.isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)'}>A</SvgText>
                        </G>
                    );
                })}

                {/* Center Core */}
                <Circle cx={cx} cy={cy} r={35} fill={theme.isDark ? '#1C1C1E' : '#FFFFFF'} stroke={theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'} strokeWidth={1} />
                
                {/* Progress Bar Icon */}
                <Rect x={84} y={75} width={32} height={6} rx={3} fill={theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'} />
                <Rect x={84} y={75} width={22} height={6} rx={3} fill="#0055FF" />

                <SvgText x={cx} y={cy + 5} textAnchor="middle" fontSize="6.5" fontWeight="bold" fill={theme.text} letterSpacing={0.5}>
                    PERFORMANCE
                </SvgText>
                <SvgText x={cx} y={cy + 15} textAnchor="middle" fontSize="6.5" fontWeight="bold" fill={theme.text} letterSpacing={0.5}>
                    LEVEL
                </SvgText>
            </Svg>

            {/* Custom Interactive Legend */}
            <View style={styles.legendContainer}>
                {/* Roles Column */}
                <View style={styles.legendSection}>
                    <Text style={[styles.legendSectionTitle, { color: theme.secondaryText }]}>Roles</Text>
                    <View style={styles.legendRow}>
                        <View style={[styles.legendDot, { backgroundColor: '#FF6B6B' }]} />
                        <Text style={[styles.legendText, { color: theme.text }]}>Teacher (Coral)</Text>
                    </View>
                    <View style={styles.legendRow}>
                        <View style={[styles.legendDot, { backgroundColor: '#33CC99' }]} />
                        <Text style={[styles.legendText, { color: theme.text }]}>Student (Teal)</Text>
                    </View>
                    <View style={styles.legendRow}>
                        <View style={[styles.legendDot, { backgroundColor: '#A390E4' }]} />
                        <Text style={[styles.legendText, { color: theme.text }]}>Peer (Lavender)</Text>
                    </View>
                </View>

                {/* Domains Column */}
                <View style={styles.legendSection}>
                    <Text style={[styles.legendSectionTitle, { color: theme.secondaryText }]}>Domains</Text>
                    <View style={styles.legendRow}>
                        <View style={[styles.legendColorLine, { backgroundColor: '#FFD700' }]} />
                        <Text style={[styles.legendText, { color: theme.text }]}>Sensitivity (Gold)</Text>
                    </View>
                    <View style={styles.legendRow}>
                        <View style={[styles.legendColorLine, { backgroundColor: '#007FFF' }]} />
                        <Text style={[styles.legendText, { color: theme.text }]}>Creativity (Blue)</Text>
                    </View>
                    <View style={styles.legendRow}>
                        <View style={[styles.legendColorLine, { backgroundColor: '#FF66CC' }]} />
                        <Text style={[styles.legendText, { color: theme.text }]}>Awareness (Pink)</Text>
                    </View>
                </View>

                {/* Rings Column */}
                <View style={styles.legendSection}>
                    <Text style={[styles.legendSectionTitle, { color: theme.secondaryText }]}>Rings</Text>
                    <View style={styles.legendRow}>
                        <Text style={[styles.legendLetter, { color: theme.text }]}>B</Text>
                        <Text style={[styles.legendText, { color: theme.text }]}>Beginner (Stream)</Text>
                    </View>
                    <View style={styles.legendRow}>
                        <Text style={[styles.legendLetter, { color: theme.text }]}>P</Text>
                        <Text style={[styles.legendText, { color: theme.text }]}>Proficient (Mountain)</Text>
                    </View>
                    <View style={styles.legendRow}>
                        <Text style={[styles.legendLetter, { color: theme.text }]}>A</Text>
                        <Text style={[styles.legendText, { color: theme.text }]}>Advanced (Sky)</Text>
                    </View>
                </View>
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
                colors={bgColors || ['#0055FF', '#00D4FF']}
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

// ── Main Overhauled Middle Stage Component ──
export default function SelectionPage() {
    const router = useRouter();
    const { theme } = useTheme();
    const { user, profile, activeStudentId, activeStudentProfile, setActiveStudentProfile } = useAuth();
    const targetUserId = activeStudentId || user?.id;
    const targetProfile = activeStudentProfile || profile;
    const isStudent = user?.role === 'student';

    const pageBgColor = theme.isDark ? "#121212" : "#FFFFFF";
    const scrollRef = useRef(null);

    // ── Unified 14 Slides State ──
    const [domainsData, setDomainsData] = useState(() => {
        const initial = {};
        slides.forEach(s => {
            initial[s.key] = createInitialDomainState();
        });
        return initial;
    });

    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const currentSlide = slides[currentSlideIndex];
    const currentDomainName = currentSlide.key;

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ y: 0, animated: false });
        }
    }, [currentSlideIndex]);

    const [expandedGoalId, setExpandedGoalId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [hasError, setHasError] = useState(false);

    // ── 3D Cube Animation States ──
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [transitionNextIndex, setTransitionNextIndex] = useState(0);
    const spinProgress = useSharedValue(0);
    const spinDirection = useSharedValue(1);
    
    const contentScale = useSharedValue(1);
    const contentOpacity = useSharedValue(1);
    const cubeScale = useSharedValue(0.5);
    const cubeOpacity = useSharedValue(0);
    const faceTextOpacity = useSharedValue(0);

    const DOMAIN_ICONS = [
        "book-outline",                 // Language Education
        "calculator-outline",           // Mathematics
        "flask-outline",                // Science
        "earth-outline",                // Social Science
        "color-palette-outline",        // Art Education
        "fitness-outline",              // Physical Education
        "construct-outline"             // Vocational/Skill Education
    ];

    // ── Load student profile data on mount ──
    useEffect(() => {
        if (!targetUserId) return;
        const fetchProfile = async () => {
            try {
                setIsLoading(true);
                const res = await fetch(`${API_URL}/students/profile/${targetUserId}`);
                const data = await res.json();
                console.log(`[Stage 3 SelectionPage] Loaded assessments:`, data?.assessments);

                if (data?.assessments) {
                    const assess = typeof data.assessments === 'string'
                        ? JSON.parse(data.assessments) : data.assessments;

                    if (assess.domainsData) {
                        setDomainsData(prev => {
                            const updated = { ...prev };
                            Object.keys(assess.domainsData).forEach(k => {
                                if (updated[k]) {
                                    updated[k] = {
                                        ...updated[k],
                                        ...assess.domainsData[k]
                                    };
                                }
                            });
                            return updated;
                        });
                        if (assess.currentSlideIndex !== undefined) {
                            setCurrentSlideIndex(assess.currentSlideIndex);
                        }
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

    const activeData = useMemo(() => {
        return domainsData[currentDomainName] || createInitialDomainState();
    }, [domainsData, currentDomainName]);

    // Filter curricular goals and competencies for active sub-domain slide
    const activeDomainGoals = useMemo(() => {
        const key = currentSlide.key;
        if (key === "Language 1") return curricularGoals.filter(cg => cg.id.startsWith("L1CG"));
        if (key === "Language 2") return curricularGoals.filter(cg => cg.id.startsWith("L2CG"));
        if (key === "Language 3") return curricularGoals.filter(cg => cg.id.startsWith("L3CG"));
        if (key === "Mathematics") return curricularGoals.filter(cg => cg.id.startsWith("MCG"));
        if (key === "Science") return curricularGoals.filter(cg => cg.id.startsWith("SCCG"));
        if (key === "Social Science") return curricularGoals.filter(cg => cg.id.startsWith("SSCG"));
        if (key === "Art Education (Visual Arts)") return curricularGoals.filter(cg => cg.id.startsWith("VACG") || cg.id === "AECG1");
        if (key === "Art Education (Theatre)") return curricularGoals.filter(cg => cg.id.startsWith("TCG") || cg.id === "AECG1");
        if (key === "Art Education (Music)") return curricularGoals.filter(cg => cg.id.startsWith("MUCG") || cg.id === "AECG1");
        if (key === "Art Education (Dance & Movement)") return curricularGoals.filter(cg => cg.id.startsWith("DMCG") || cg.id === "AECG1");
        if (key === "Art Education (LS2)") return curricularGoals.filter(cg => cg.id === "AECG1");
        if (key === "Physical Education (Learning Standard 1)") return curricularGoals.filter(cg => cg.id.startsWith("P1CG"));
        if (key === "Physical Education (Learning Standard 2)") return curricularGoals.filter(cg => cg.id.startsWith("P2CG"));
        if (key === "Vocational/Skill Education") return curricularGoals.filter(cg => cg.id.startsWith("VCG"));
        return [];
    }, [currentSlideIndex]);

    const activeDomainCompetenciesMap = useMemo(() => {
        const cMap = {};
        curricularGoals.forEach(g => {
            const prefix = g.id.replace("CG", "C");
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

    // ── Row Mutual Exclusivity for Rubric builder ──
    const handleCellPress = (rowIndex, colIndex) => {
        if (isStudent) return;
        const matrix = activeData.rubricMatrix;
        
        const otherCols = [0, 1, 2].filter(c => c !== colIndex);
        const activeCol = otherCols.find(c => matrix[`${rowIndex}-${c}`]);

        if (activeCol !== undefined) {
            Alert.alert(
                "Change Level?",
                "If you wish to change the student's level, saved text for the current level will be lost.",
                [
                    { text: "Cancel", style: "cancel" },
                    {
                        text: "Change",
                        style: "destructive",
                        onPress: () => {
                            const newMatrix = { ...matrix };
                            newMatrix[`${rowIndex}-${activeCol}`] = "";
                            newMatrix[`${rowIndex}-${colIndex}`] = "Assessed";
                            updateActiveField("rubricMatrix", newMatrix);
                        }
                    }
                ]
            );
        } else {
            const newMatrix = { ...matrix };
            newMatrix[`${rowIndex}-${colIndex}`] = "Assessed";
            updateActiveField("rubricMatrix", newMatrix);
        }
    };

    // Helper to identify active level from matrix rows
    const getRowLevel = (rowIdx) => {
        const matrix = activeData.rubricMatrix;
        if (matrix[`${rowIdx}-0`]?.trim()) return 'stream';
        if (matrix[`${rowIdx}-1`]?.trim()) return 'mountain';
        if (matrix[`${rowIdx}-2`]?.trim()) return 'sky';
        return 'none';
    };

    const calculatedTeacherScores = useMemo(() => {
        return {
            awareness: getRowLevel(0),
            sensitivity: getRowLevel(1),
            creativity: getRowLevel(2)
        };
    }, [activeData.rubricMatrix]);

    // ── Valley Animation Engine based on Rubric Levels ──
    const calculatedAverageValleyLevel = useMemo(() => {
        const getRowVal = (row) => {
            if (activeData.rubricMatrix[`${row}-0`]?.trim()) return 1;
            if (activeData.rubricMatrix[`${row}-1`]?.trim()) return 2;
            if (activeData.rubricMatrix[`${row}-2`]?.trim()) return 3;
            return 0;
        };

        const values = [getRowVal(0), getRowVal(1), getRowVal(2)].filter(v => v > 0);
        
        if (values.length > 0) {
            const sum = values.reduce((a, b) => a + b, 0);
            const avg = Math.round(sum / values.length);
            if (avg === 1) return 'stream';
            if (avg === 2) return 'mountain';
            if (avg === 3) return 'sky';
        }
        return 'none';
    }, [activeData.rubricMatrix]);

    // ── Auto-Calculator (useMemo for Student & Peer) ──
    const calculatedScores = useMemo(() => {
        const getLevelForCount = (count) => {
            if (count <= 2) return 'stream';
            if (count <= 4) return 'mountain';
            return 'sky';
        };

        const sAwareCount = activeData.studentProgress.awareness.length;
        const sSensCount = activeData.studentProgress.sensitivity.length;
        const sCreatCount = activeData.studentProgress.creativity.length;

        const pAwareCount = activeData.peerProgress.awareness.length;
        const pSensCount = activeData.peerProgress.sensitivity.length;
        const pCreatCount = activeData.peerProgress.creativity.length;

        return {
            awareness: {
                teacher: calculatedTeacherScores.awareness,
                student: getLevelForCount(sAwareCount),
                peer: getLevelForCount(pAwareCount)
            },
            sensitivity: {
                teacher: calculatedTeacherScores.sensitivity,
                student: getLevelForCount(sSensCount),
                peer: getLevelForCount(pSensCount)
            },
            creativity: {
                teacher: calculatedTeacherScores.creativity,
                student: getLevelForCount(sCreatCount),
                peer: getLevelForCount(pCreatCount)
            }
        };
    }, [activeData.studentProgress, activeData.peerProgress, calculatedTeacherScores]);

    // ── Auto-Save Logic (1.5s Debounce) ──
    useEffect(() => {
        if (!targetUserId || isLoading) return;

        setIsSaving(true);
        setHasError(false);

        const timer = setTimeout(async () => {
            try {
                const currentAssess = typeof targetProfile?.assessments === 'string'
                    ? JSON.parse(targetProfile.assessments) : (targetProfile?.assessments || {});

                const updatedAssess = {
                    ...currentAssess,
                    domainsData: domainsData,
                    currentSlideIndex: currentSlideIndex
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
                    if (activeStudentId) {
                        setActiveStudentProfile({ ...targetProfile, assessments: updatedAssess });
                    }
                } else {
                    setHasError(true);
                }
            } catch (_err) {
                setHasError(true);
            } finally {
                setIsSaving(false);
            }
        }, 1500);

        return () => clearTimeout(timer);
    }, [domainsData, currentSlideIndex]);

    // ── 3D Cube Spin Transition ──
    const handleDomainChange = (nextIndex) => {
        if (nextIndex === currentSlideIndex || isTransitioning) return;

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

        setTimeout(() => {
            faceTextOpacity.value = withTiming(1.0, { duration: 250 });
        }, 320);

        // Phase 2: Spin
        const direction = nextIndex > currentSlideIndex ? 1 : -1;
        spinDirection.value = direction;

        setTimeout(() => {
            spinProgress.value = withTiming(1, { duration: 700 });

            // Phase 3: Transition out
            setTimeout(() => {
                faceTextOpacity.value = withTiming(0, { duration: 200 });
                setCurrentSlideIndex(nextIndex);

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

    // Multi-select Activity Approach Handler
    const handleApproachToggle = (opt) => {
        if (isStudent) return;
        const currentArr = [...activeData.activityApproach];
        const index = currentArr.indexOf(opt);
        if (index > -1) {
            currentArr.splice(index, 1);
        } else {
            currentArr.push(opt);
        }
        updateActiveField("activityApproach", currentArr);
    };

    // Multi-select Strengths Handler
    const handleStrengthToggle = (opt) => {
        if (isStudent) return;
        const currentArr = [...activeData.strengths];
        const index = currentArr.indexOf(opt);
        if (index > -1) {
            currentArr.splice(index, 1);
        } else {
            currentArr.push(opt);
        }
        updateActiveField("strengths", currentArr);
    };

    // Multi-select Barriers Handler
    const handleBarrierToggle = (opt) => {
        if (isStudent) return;
        const currentArr = [...activeData.barriers];
        const index = currentArr.indexOf(opt);
        if (index > -1) {
            currentArr.splice(index, 1);
        } else {
            currentArr.push(opt);
        }
        updateActiveField("barriers", currentArr);
    };

    // Student & Peer multi-select grid statements toggles
    const handleProgressToggle = (section, gridKey, statement) => {
        // section = 'studentProgress' | 'peerProgress'
        const currentGridObj = { ...activeData[section] };
        const currentList = [...(currentGridObj[gridKey] || [])];
        const index = currentList.indexOf(statement);
        if (index > -1) {
            currentList.splice(index, 1);
        } else {
            currentList.push(statement);
        }
        currentGridObj[gridKey] = currentList;
        updateActiveField(section, currentGridObj);
    };

    const handleNextButton = () => {
        if (currentSlideIndex < 13) {
            handleDomainChange(currentSlideIndex + 1);
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
                { rotateX: '-18deg' },
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
                        <Text style={[styles.mainTitle, { color: theme.text }]}>🌱 Part B (Middle Stage)</Text>
                        <View style={{ width: 30 }} />
                    </View>
                    
                    {/* Progress Bar Navigation (7 domains, starting from 1) */}
                    <View style={styles.progressBarWrapper}>
                        <View style={[styles.progressLineBg, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]} />
                        <View 
                            style={[
                                styles.progressLineFill, 
                                { 
                                    width: `${(currentSlide.domainIndex / 6) * 100}%`,
                                    backgroundColor: '#0055FF'
                                }
                            ]} 
                        />
                        
                        {domainsList.map((dom, index) => {
                            const isActive = index === currentSlide.domainIndex;
                            const isCompleted = index < currentSlide.domainIndex;
                            const numLabel = DOMAIN_NUMBERS[index];
                            
                            return (
                                <TouchableOpacity
                                    key={dom}
                                    onPress={() => {
                                        if (index === 0) handleDomainChange(0);
                                        else if (index === 1) handleDomainChange(3);
                                        else if (index === 2) handleDomainChange(4);
                                        else if (index === 3) handleDomainChange(5);
                                        else if (index === 4) handleDomainChange(6);
                                        else if (index === 5) handleDomainChange(11);
                                        else if (index === 6) handleDomainChange(13);
                                    }}
                                    style={[
                                        styles.progressNode,
                                        {
                                            backgroundColor: isActive 
                                                ? '#0055FF' 
                                                : isCompleted 
                                                    ? 'rgba(0, 85, 255, 0.2)' 
                                                    : theme.isDark ? '#1E1E1E' : '#FFFFFF',
                                            borderColor: isActive || isCompleted ? '#0055FF' : theme.isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
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
                                                    ? '#0055FF' 
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

                {/* ── Auto-save status toast ── */}
                <AutoSaveToast isSaving={isSaving} hasError={hasError} theme={theme} />

                {/* ── 3D Solid Cube Overlay ── */}
                {isTransitioning && (
                    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
                        <BlurView intensity={Platform.OS === 'ios' ? 30 : 15} tint="dark" style={StyleSheet.absoluteFill} />
                        <View style={styles.cubeSpinContainer}>
                            <Animated.View style={[styles.cubeWrapper, cubeWrapperStyle]}>
                                {/* Front Face */}
                                <CubeFace 
                                    title={slides[currentSlideIndex].title} 
                                    activeIcon={DOMAIN_ICONS[slides[currentSlideIndex].domainIndex]}
                                    rotationY="0deg" 
                                    translateZ={110} 
                                    textOpacity={faceTextOpacity}
                                    bgColors={['#0055FF', '#00D4FF']}
                                />
                                {/* Right Face */}
                                <CubeFace 
                                    title={slides[transitionNextIndex].title} 
                                    activeIcon={DOMAIN_ICONS[slides[transitionNextIndex].domainIndex]}
                                    rotationY="90deg" 
                                    translateZ={110} 
                                    textOpacity={faceTextOpacity}
                                    bgColors={['#00D4FF', '#0055FF']}
                                />
                                {/* Left Face */}
                                <CubeFace 
                                    title={slides[transitionNextIndex].title} 
                                    activeIcon={DOMAIN_ICONS[slides[transitionNextIndex].domainIndex]}
                                    rotationY="-90deg" 
                                    translateZ={110} 
                                    textOpacity={faceTextOpacity}
                                    bgColors={['#00D4FF', '#0055FF']}
                                />
                                {/* Top Face */}
                                <CubeFace 
                                    title="MIDDLE STAGE" 
                                    rotateX="90deg" 
                                    translateZ={110} 
                                    textOpacity={faceTextOpacity}
                                    bgColors={['#4facfe', '#00f2fe']}
                                />
                                {/* Bottom Face */}
                                <CubeFace 
                                    title="HPC CARD" 
                                    rotateX="-90deg" 
                                    translateZ={110} 
                                    textOpacity={faceTextOpacity}
                                    bgColors={['#2A2A2A', '#121212']}
                                />
                                {/* Back Face */}
                                <CubeFace 
                                    title="STUDENT HUB" 
                                    rotationY="180deg" 
                                    translateZ={110} 
                                    textOpacity={faceTextOpacity}
                                    bgColors={['#0055FF', '#00FFB2']}
                                />
                            </Animated.View>
                        </View>
                    </View>
                )}

                {/* ── Main Forms Scroll Body ── */}
                {isLoading ? (
                    <View style={styles.loaderContainer}>
                        <ActivityIndicator size="large" color="#0055FF" />
                        <Text style={[styles.loaderText, { color: theme.secondaryText }]}>Loading Progress Card...</Text>
                    </View>
                ) : (
                    <Animated.View style={[{ flex: 1 }, mainContentAnimatedStyle]}>
                        <ScrollView
                            ref={scrollRef}
                            style={styles.megaScroll}
                            contentContainerStyle={styles.scrollContent}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                        >
                            {/* Simple Domain Title Row */}
                            <View style={[
                                styles.domainHeaderSimple,
                                {
                                    backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.03)' : '#FFFFFF',
                                    borderColor: theme.isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.06)',
                                    borderWidth: 1,
                                    borderRadius: 14,
                                    paddingHorizontal: 16,
                                    paddingVertical: 10,
                                    elevation: theme.isDark ? 0 : 1
                                }
                            ]}>
                                <Ionicons name={currentSlide.icon} size={24} color={theme.isDark ? "#00D4FF" : "#0055FF"} />
                                <Text style={[styles.domainHeaderSimpleText, { color: theme.text }]}>
                                    {currentSlide.title.toUpperCase()}
                                </Text>
                            </View>
                            <View style={[styles.domainHeaderDivider, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]} />

                            {/* ==================== COMPONENT 2: SECTION 1 (TEACHER SETUP) ==================== */}
                            <Text style={styles.sectionDividerText}>SECTION 1: TEACHER SETUP</Text>

                            {/* Cascading Selectors */}
                            <InfoTrigger
                                text="1. Curricular Goals & Competencies"
                                tooltipText="Tap the checkboxes to select Goals. Expand the Goal card to view and select relevant Competencies."
                                theme={theme}
                            />
                            {activeDomainGoals.map((cg) => {
                                const isSelected = activeData.goals.includes(cg.text);
                                const isExpanded = expandedGoalId === cg.id;
                                const compList = activeDomainCompetenciesMap[cg.id] || [];

                                return (
                                    <View 
                                        key={cg.id} 
                                        style={[
                                            styles.glassCard,
                                            {
                                                backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : '#FFFFFF',
                                                borderColor: theme.isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.08)',
                                            }
                                        ]}
                                    >
                                        <View style={styles.cgGoalHeader}>
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
                                                    color={isSelected ? "#0055FF" : theme.secondaryText}
                                                    style={{ marginLeft: 8 }}
                                                />
                                            </TouchableOpacity>
                                        </View>

                                        {isExpanded && (
                                            <View style={[styles.competencyRevealContainer, { borderTopColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)' }]}>
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
                                                                        backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.03)' : '#F5F5F5',
                                                                        borderColor: theme.isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.06)',
                                                                    },
                                                                    isCompSelected && styles.competencyChipActive
                                                                ]}
                                                            >
                                                                <Text style={[styles.competencyChipId, isCompSelected && { color: '#0055FF' }]}>{comp.id}</Text>
                                                                <Text style={[styles.competencyChipText, { color: theme.text }]}>{comp.text}</Text>
                                                            </TouchableOpacity>
                                                        );
                                                    })}
                                                </View>
                                            </View>
                                        )}
                                    </View>
                                );
                            })}

                            {/* Activity Approach */}
                            <InfoTrigger
                                text="2. Activity Details & Approach"
                                tooltipText="Identify the primary pedagogical methods, duration, materials, and description sequence."
                                theme={theme}
                            />
                            <View style={[styles.glassCard, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : '#FFFFFF', borderColor: theme.isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.08)' }]}>
                                <Text style={[styles.cardSubLabel, { color: theme.secondaryText }]}>Approach (Multi-Select):</Text>
                                <View style={styles.approachChipsGrid}>
                                    {ACTIVITY_OPTIONS.map((opt) => {
                                        const isSelected = activeData.activityApproach.includes(opt);
                                        return (
                                            <TouchableOpacity
                                                key={opt}
                                                onPress={() => handleApproachToggle(opt)}
                                                style={[
                                                    styles.approachChip,
                                                    {
                                                        backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : '#F5F5F5',
                                                        borderColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'
                                                    },
                                                    isSelected && styles.approachChipActive
                                                ]}
                                            >
                                                <Text style={[styles.approachChipText, { color: isSelected ? '#FFFFFF' : theme.text }]}>{opt}</Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>

                                {activeData.activityApproach.includes("Any Other") && (
                                    <TextInput
                                        style={[styles.underlinedTextInput, { color: theme.text, marginTop: 10 }]}
                                        placeholder="Please specify any other approach..."
                                        placeholderTextColor={theme.secondaryText + '80'}
                                        value={activeData.anyOtherApproach}
                                        onChangeText={(t) => updateActiveField("anyOtherApproach", t)}
                                        editable={!isStudent}
                                    />
                                )}

                                {/* Time inputs */}
                                <Text style={[styles.cardSubLabel, { color: theme.secondaryText, marginTop: 16 }]}>Duration (Hours & Minutes):</Text>
                                <View style={styles.timeInputsRow}>
                                    <View style={styles.timeInputCol}>
                                        <TextInput
                                            style={[styles.underlinedTextInput, { color: theme.text, textAlign: 'center' }]}
                                            keyboardType="number-pad"
                                            placeholder="Hours"
                                            placeholderTextColor={theme.secondaryText + '60'}
                                            value={activeData.activityHours}
                                            onChangeText={(t) => updateActiveField("activityHours", t)}
                                            editable={!isStudent}
                                        />
                                        <Text style={[styles.timeLabelText, { color: theme.secondaryText }]}>Hours</Text>
                                    </View>
                                    <View style={styles.timeInputCol}>
                                        <TextInput
                                            style={[styles.underlinedTextInput, { color: theme.text, textAlign: 'center' }]}
                                            keyboardType="number-pad"
                                            placeholder="Minutes"
                                            placeholderTextColor={theme.secondaryText + '60'}
                                            value={activeData.activityMinutes}
                                            onChangeText={(t) => updateActiveField("activityMinutes", t)}
                                            editable={!isStudent}
                                        />
                                        <Text style={[styles.timeLabelText, { color: theme.secondaryText }]}>Minutes</Text>
                                    </View>
                                </View>

                                {/* Materials Required */}
                                <Text style={[styles.cardSubLabel, { color: theme.secondaryText, marginTop: 16 }]}>Materials Required:</Text>
                                <TextInput
                                    style={[styles.underlinedTextInput, { color: theme.text }]}
                                    placeholder="Enter necessary materials..."
                                    placeholderTextColor={theme.secondaryText + '80'}
                                    value={activeData.materialsRequired}
                                    onChangeText={(t) => updateActiveField("materialsRequired", t)}
                                    editable={!isStudent}
                                />

                                {/* Brackets sequence of events description */}
                                <Text style={[styles.cardSubLabel, { color: theme.secondaryText, marginTop: 16 }]}>Description of Activity (Sequence of Events):</Text>
                                <TextInput
                                    style={[styles.underlinedTextInput, { color: theme.text }]}
                                    placeholder="e.g. [1. Teacher introduction, 2. Student activity...]"
                                    placeholderTextColor={theme.secondaryText + '80'}
                                    value={activeData.activityDescription}
                                    onChangeText={(t) => updateActiveField("activityDescription", t)}
                                    editable={!isStudent}
                                    multiline
                                />
                            </View>

                            {/* Rubric Builder 3x3 */}
                            <InfoTrigger
                                text="3. Rubric Builder & Valley View"
                                tooltipText="Enforce Rubric levels for Literacy Awareness, Sensitivity and Creativity."
                                theme={theme}
                            />
                            {/* Animated Valley preview */}
                            <ValleyAnimation activeLevel={calculatedAverageValleyLevel} />

                            <View style={[styles.table, { borderColor: theme.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)', backgroundColor: theme.isDark ? 'rgba(0, 0, 0, 0.15)' : '#FFFFFF' }]}>
                                <View style={styles.row}>
                                    <View style={[styles.headerCellBase, { width: '28%', backgroundColor: theme.isDark ? '#222' : '#FFFFFF', borderRightColor: theme.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)' }]}>
                                        <Text style={[styles.headerTitles, { color: '#0055FF' }]}>ABILITY</Text>
                                    </View>
                                    <View style={[styles.headerCellBase, { width: '24%', backgroundColor: theme.isDark ? '#222' : '#FFFFFF', borderRightColor: theme.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)' }]}>
                                        <Text style={[styles.headerTitles, { color: theme.text }]}>Stream</Text>
                                    </View>
                                    <View style={[styles.headerCellBase, { width: '24%', backgroundColor: theme.isDark ? '#222' : '#FFFFFF', borderRightColor: theme.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)' }]}>
                                        <Text style={[styles.headerTitles, { color: theme.text }]}>Mountain</Text>
                                    </View>
                                    <View style={[styles.headerCellBase, { width: '24%', borderRightWidth: 0, backgroundColor: theme.isDark ? '#222' : '#FFFFFF' }]}>
                                        <Text style={[styles.headerTitles, { color: theme.text }]}>Sky</Text>
                                    </View>
                                </View>

                                {["Literary Awareness", "Literary Sensitivity", "Literary Creativity"].map((rowLabel, rIdx) => {
                                    const activeCol = (activeData.rubricMatrix[`${rIdx}-0`]?.trim()) ? 0 : (activeData.rubricMatrix[`${rIdx}-1`]?.trim()) ? 1 : (activeData.rubricMatrix[`${rIdx}-2`]?.trim()) ? 2 : -1;
                                    return (
                                        <View key={rowLabel} style={[styles.row, { borderBottomColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
                                            <View style={[styles.headerCellBase, { width: '28%', backgroundColor: theme.isDark ? '#1C1C1C' : '#FFFFFF', borderRightColor: theme.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)' }]}>
                                                {rIdx === 0 ? <Eye color={theme.text} size={16} /> : rIdx === 1 ? <Feather color={theme.text} size={16} /> : <Wand2 color={theme.text} size={16} />}
                                                <Text style={[styles.sideIconText, { color: theme.text }]}>{rowLabel}</Text>
                                            </View>
                                            {[0, 1, 2].map((cIdx) => {
                                                const val = activeData.rubricMatrix[`${rIdx}-${cIdx}`];
                                                const isLocked = activeCol !== -1 && activeCol !== cIdx;
                                                const cellBg = isLocked
                                                    ? (theme.isDark ? 'rgba(0, 0, 0, 0.45)' : 'rgba(0, 0, 0, 0.08)')
                                                    : 'transparent';
                                                return (
                                                    <Pressable
                                                        key={cIdx}
                                                        onPress={() => isLocked && handleCellPress(rIdx, cIdx)}
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
                                                                const newM = { ...activeData.rubricMatrix, [`${rIdx}-${cIdx}`]: t };
                                                                updateActiveField("rubricMatrix", newM);
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

                            {/* ==================== COMPONENT 3: SECTION 2 (STUDENT SELF-REFLECTION) ==================== */}
                            <Text style={styles.sectionDividerText}>SECTION 2: STUDENT REFLECTION</Text>

                            {/* A. The Vibe Check */}
                            <InfoTrigger
                                text="A. Self Vibe Check"
                                tooltipText="Answer honestly how you felt regarding effort, applicability and concept motivation."
                                theme={theme}
                            />
                            <View style={[styles.glassCard, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : '#FFFFFF', borderColor: theme.isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.08)' }]}>
                                {[
                                    { key: "q1", question: "I am proud of myself and my effort." },
                                    { key: "q2", question: "I will be able to apply what I learnt from this activity to real life situations." },
                                    { key: "q3", question: "I am motivated to learn further about the concepts covered in the activity." }
                                ].map((q) => {
                                    const selected = activeData.studentVibe[q.key] || "";
                                    return (
                                        <View key={q.key} style={{ marginBottom: 20 }}>
                                            <Text style={[styles.questionHeaderLabel, { color: theme.text }]}>{q.question}</Text>
                                            <View style={styles.emojiRow}>
                                                {STUDENT_VIBE_OPTIONS.map(e => (
                                                    <GemstoneButton
                                                        key={e.value}
                                                        label={e.label}
                                                        emoji={e.emoji}
                                                        selected={selected === e.value}
                                                        onPress={() => {
                                                            const newV = { ...activeData.studentVibe, [q.key]: e.value };
                                                            updateActiveField("studentVibe", newV);
                                                        }}
                                                    />
                                                ))}
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>

                            {/* B. The Progress Grid (The 6-Option Selection Engine) */}
                            <InfoTrigger
                                text="B. Progress Grid (Multi-Select)"
                                tooltipText="Tap to toggle items representing your experiences. You can select any number of statements."
                                theme={theme}
                            />
                            <View style={[styles.glassCard, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : '#FFFFFF', borderColor: theme.isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.08)' }]}>
                                {/* Awareness */}
                                <Text style={[styles.gridTitleLabel, { color: '#007FFF' }]}>◈ Awareness Grid</Text>
                                {SELF_PROGRESS_GRID.awareness.map((stmt) => {
                                    const isSelected = activeData.studentProgress.awareness.includes(stmt);
                                    return (
                                        <TouchableOpacity
                                            key={stmt}
                                            onPress={() => handleProgressToggle("studentProgress", "awareness", stmt)}
                                            style={[styles.stmtChip, isSelected && styles.stmtChipActive]}
                                        >
                                            <Ionicons name={isSelected ? "checkbox" : "square-outline"} size={16} color={isSelected ? '#007FFF' : theme.secondaryText} />
                                            <Text style={[styles.stmtChipText, { color: theme.text }]}>{stmt}</Text>
                                        </TouchableOpacity>
                                    );
                                })}

                                {/* Sensitivity */}
                                <Text style={[styles.gridTitleLabel, { color: '#00CC66', marginTop: 24 }]}>◈ Sensitivity Grid</Text>
                                {SELF_PROGRESS_GRID.sensitivity.map((stmt) => {
                                    const isSelected = activeData.studentProgress.sensitivity.includes(stmt);
                                    return (
                                        <TouchableOpacity
                                            key={stmt}
                                            onPress={() => handleProgressToggle("studentProgress", "sensitivity", stmt)}
                                            style={[styles.stmtChip, isSelected && styles.stmtChipActive]}
                                        >
                                            <Ionicons name={isSelected ? "checkbox" : "square-outline"} size={16} color={isSelected ? '#00CC66' : theme.secondaryText} />
                                            <Text style={[styles.stmtChipText, { color: theme.text }]}>{stmt}</Text>
                                        </TouchableOpacity>
                                    );
                                })}

                                {/* Creativity */}
                                <Text style={[styles.gridTitleLabel, { color: '#FF9900', marginTop: 24 }]}>◈ Creativity Grid</Text>
                                {SELF_PROGRESS_GRID.creativity.map((stmt) => {
                                    const isSelected = activeData.studentProgress.creativity.includes(stmt);
                                    return (
                                        <TouchableOpacity
                                            key={stmt}
                                            onPress={() => handleProgressToggle("studentProgress", "creativity", stmt)}
                                            style={[styles.stmtChip, isSelected && styles.stmtChipActive]}
                                        >
                                            <Ionicons name={isSelected ? "checkbox" : "square-outline"} size={16} color={isSelected ? '#FF9900' : theme.secondaryText} />
                                            <Text style={[styles.stmtChipText, { color: theme.text }]}>{stmt}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            {/* C. My Learnings (Text Inputs) */}
                            <InfoTrigger
                                text="C. My Learnings"
                                tooltipText="Provide written inputs regarding your experience, learnings and assistance needed."
                                theme={theme}
                            />
                            <View style={[styles.glassCard, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : '#FFFFFF', borderColor: theme.isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.08)' }]}>
                                {[
                                    { key: "learnt", prompt: "By doing this activity, I learnt..." },
                                    { key: "interesting", prompt: "The most interesting thing about this activity was..." },
                                    { key: "practice", prompt: "I need practice on..." },
                                    { key: "help", prompt: "I need help with..." }
                                ].map((l) => {
                                    const val = activeData.studentLearnings[l.key] || "";
                                    return (
                                        <View key={l.key} style={{ marginBottom: 16 }}>
                                            <Text style={[styles.promptLabel, { color: theme.text }]}>{l.prompt}</Text>
                                            <TextInput
                                                style={[styles.glowingUnderlinedInput, { color: theme.text, borderBottomColor: '#0055FF' }]}
                                                placeholder="Type here..."
                                                placeholderTextColor={theme.secondaryText + '80'}
                                                value={val}
                                                onChangeText={(t) => {
                                                    const newL = { ...activeData.studentLearnings, [l.key]: t };
                                                    updateActiveField("studentLearnings", newL);
                                                }}
                                            />
                                        </View>
                                    );
                                })}
                            </View>

                            {/* ==================== COMPONENT 4: SECTION 3 (PEER FEEDBACK) ==================== */}
                            <Text style={styles.sectionDividerText}>SECTION 3: PEER FEEDBACK</Text>

                            {/* A. The Peer Vibe Check */}
                            <InfoTrigger
                                text="A. Peer Vibe Check"
                                tooltipText="Provide evaluation of your peer's interest, motivation and collaboration during this activity."
                                theme={theme}
                            />
                            <View style={[styles.glassCard, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : '#FFFFFF', borderColor: theme.isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.08)' }]}>
                                {[
                                    { key: "q1", question: "My peer was engaged and motivated during the activity." },
                                    { key: "q2", question: "My peer effectively shared thoughts and ideas during the activity." }
                                ].map((q) => {
                                    const selected = activeData.peerVibe[q.key] || "";
                                    return (
                                        <View key={q.key} style={{ marginBottom: 20 }}>
                                            <Text style={[styles.questionHeaderLabel, { color: theme.text }]}>{q.question}</Text>
                                            <View style={styles.emojiRow}>
                                                {PEER_VIBE_OPTIONS.map(e => (
                                                    <GemstoneButton
                                                        key={e.value}
                                                        label={e.label}
                                                        emoji={e.emoji}
                                                        selected={selected === e.value}
                                                        onPress={() => {
                                                            const newV = { ...activeData.peerVibe, [q.key]: e.value };
                                                            updateActiveField("peerVibe", newV);
                                                        }}
                                                    />
                                                ))}
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>

                            {/* B. The Peer Progress Grid (Multi-Select) */}
                            <InfoTrigger
                                text="B. Peer Progress Grid"
                                tooltipText="Tap to select observations made of your peer during this task."
                                theme={theme}
                            />
                            <View style={[styles.glassCard, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : '#FFFFFF', borderColor: theme.isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.08)' }]}>
                                {/* Awareness */}
                                <Text style={[styles.gridTitleLabel, { color: '#007FFF' }]}>◈ Awareness</Text>
                                {PEER_PROGRESS_GRID.awareness.map((stmt) => {
                                    const isSelected = activeData.peerProgress.awareness.includes(stmt);
                                    return (
                                        <TouchableOpacity
                                            key={stmt}
                                            onPress={() => handleProgressToggle("peerProgress", "awareness", stmt)}
                                            style={[styles.stmtChip, isSelected && styles.stmtChipActive]}
                                        >
                                            <Ionicons name={isSelected ? "checkbox" : "square-outline"} size={16} color={isSelected ? '#007FFF' : theme.secondaryText} />
                                            <Text style={[styles.stmtChipText, { color: theme.text }]}>{stmt}</Text>
                                        </TouchableOpacity>
                                    );
                                })}

                                {/* Sensitivity */}
                                <Text style={[styles.gridTitleLabel, { color: '#00CC66', marginTop: 24 }]}>◈ Sensitivity</Text>
                                {PEER_PROGRESS_GRID.sensitivity.map((stmt) => {
                                    const isSelected = activeData.peerProgress.sensitivity.includes(stmt);
                                    return (
                                        <TouchableOpacity
                                            key={stmt}
                                            onPress={() => handleProgressToggle("peerProgress", "sensitivity", stmt)}
                                            style={[styles.stmtChip, isSelected && styles.stmtChipActive]}
                                        >
                                            <Ionicons name={isSelected ? "checkbox" : "square-outline"} size={16} color={isSelected ? '#00CC66' : theme.secondaryText} />
                                            <Text style={[styles.stmtChipText, { color: theme.text }]}>{stmt}</Text>
                                        </TouchableOpacity>
                                    );
                                })}

                                {/* Creativity */}
                                <Text style={[styles.gridTitleLabel, { color: '#FF9900', marginTop: 24 }]}>◈ Creativity</Text>
                                {PEER_PROGRESS_GRID.creativity.map((stmt) => {
                                    const isSelected = activeData.peerProgress.creativity.includes(stmt);
                                    return (
                                        <TouchableOpacity
                                            key={stmt}
                                            onPress={() => handleProgressToggle("peerProgress", "creativity", stmt)}
                                            style={[styles.stmtChip, isSelected && styles.stmtChipActive]}
                                        >
                                            <Ionicons name={isSelected ? "checkbox" : "square-outline"} size={16} color={isSelected ? '#FF9900' : theme.secondaryText} />
                                            <Text style={[styles.stmtChipText, { color: theme.text }]}>{stmt}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            {/* C. Peer Learnings */}
                            <InfoTrigger
                                text="C. Peer Learnings"
                                tooltipText="Provide constructive comments on areas where your peer can improve."
                                theme={theme}
                            />
                            <View style={[styles.glassCard, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : '#FFFFFF', borderColor: theme.isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.08)' }]}>
                                {[
                                    { key: "practice", prompt: "My peer needs to practice..." },
                                    { key: "help", prompt: "My peer needs help with..." }
                                ].map((l) => {
                                    const val = activeData.peerLearnings[l.key] || "";
                                    return (
                                        <View key={l.key} style={{ marginBottom: 16 }}>
                                            <Text style={[styles.promptLabel, { color: theme.text }]}>{l.prompt}</Text>
                                            <TextInput
                                                style={[styles.glowingUnderlinedInput, { color: theme.text, borderBottomColor: '#0055FF' }]}
                                                placeholder="Type here..."
                                                placeholderTextColor={theme.secondaryText + '80'}
                                                value={val}
                                                onChangeText={(t) => {
                                                    const newL = { ...activeData.peerLearnings, [l.key]: t };
                                                    updateActiveField("peerLearnings", newL);
                                                }}
                                            />
                                        </View>
                                    );
                                })}
                            </View>

                            {/* ==================== COMPONENT 5: SECTION 4 (THE MATH ENGINE & TEACHER FEEDBACK) ==================== */}
                            <Text style={styles.sectionDividerText}>SECTION 4: ANALYSIS & REMARKS</Text>

                            {/* B. The Assessment Wheel */}
                            <InfoTrigger
                                text="A & B. Auto-Calculator & Assessment Wheel"
                                tooltipText="The math engine aggregates chip counts into levels (Stream, Mountain, Sky) across rings for Teacher, Student and Peer."
                                theme={theme}
                            />
                            <View style={[styles.glassCard, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : '#FFFFFF', borderColor: theme.isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.08)' }]}>
                                <Text style={[styles.wheelCardTitle, { color: theme.text }]}>Radial Progress Breakdown</Text>
                                <AssessmentWheel scores={calculatedScores} theme={theme} />
                            </View>

                            {/* C. Strengths & Barriers */}
                            <InfoTrigger
                                text="C. Strengths & Barriers"
                                tooltipText="Select areas where the student showed strength or faced barriers to learning."
                                theme={theme}
                            />
                            <View style={[styles.glassCard, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : '#FFFFFF', borderColor: theme.isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.08)' }]}>
                                <Text style={[styles.cardSubLabel, { color: theme.secondaryText }]}>Areas of Strength:</Text>
                                <View style={styles.strengthsChipsGrid}>
                                    {STRENGTHS_OPTIONS.map((opt) => {
                                        const isSelected = activeData.strengths.includes(opt);
                                        return (
                                            <TouchableOpacity
                                                key={opt}
                                                onPress={() => handleStrengthToggle(opt)}
                                                style={[
                                                    styles.strengthChip,
                                                    {
                                                        backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : '#F5F5F5',
                                                        borderColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'
                                                    },
                                                    isSelected && styles.strengthChipActive
                                                ]}
                                            >
                                                <Text style={[styles.strengthChipText, { color: isSelected ? '#FFFFFF' : theme.text }]}>{opt}</Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>

                                {activeData.strengths.includes("Any other") && (
                                    <TextInput
                                        style={[styles.underlinedTextInput, { color: theme.text, marginTop: 10 }]}
                                        placeholder="Please specify other strength..."
                                        placeholderTextColor={theme.secondaryText + '80'}
                                        value={activeData.anyOtherStrength}
                                        onChangeText={(t) => updateActiveField("anyOtherStrength", t)}
                                        editable={!isStudent}
                                    />
                                )}

                                <Text style={[styles.cardSubLabel, { color: theme.secondaryText, marginTop: 24 }]}>Barrier(s) to Success:</Text>
                                <View style={styles.strengthsChipsGrid}>
                                    {BARRIERS_OPTIONS.map((opt) => {
                                        const isSelected = activeData.barriers.includes(opt);
                                        return (
                                            <TouchableOpacity
                                                key={opt}
                                                onPress={() => handleBarrierToggle(opt)}
                                                style={[
                                                    styles.strengthChip,
                                                    {
                                                        backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : '#F5F5F5',
                                                        borderColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'
                                                    },
                                                    isSelected && styles.barrierChipActive
                                                ]}
                                            >
                                                <Text style={[styles.strengthChipText, { color: isSelected ? '#FFFFFF' : theme.text }]}>{opt}</Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>

                            {/* Bottom Proceed Buttons */}
                            <View style={styles.bottomNavButtonsWrapper}>
                                {currentSlideIndex > 0 && (
                                    <TouchableOpacity
                                        onPress={() => handleDomainChange(currentSlideIndex - 1)}
                                        style={[styles.backNavBtn, { borderColor: theme.isDark ? theme.border : 'rgba(0,85,255,0.3)', backgroundColor: theme.isDark ? 'transparent' : '#FFF' }]}
                                    >
                                        <Ionicons name="arrow-back" size={16} color={theme.isDark ? theme.text : '#0055FF'} />
                                        <Text style={[styles.backNavBtnText, { color: theme.isDark ? theme.text : '#0055FF' }]}>Prev Slide</Text>
                                    </TouchableOpacity>
                                )}

                                <GemButton
                                    gemType="blue"
                                    onPress={handleNextButton}
                                    disabled={isSaving}
                                    width={currentSlideIndex > 0 ? 180 : 220}
                                >
                                    <View style={styles.nextBtnInner}>
                                        <Text style={[styles.nextBtnText, { color: '#00D4FF' }]}>
                                            {currentSlideIndex < 13 ? "Next Slide" : "Go to Part C"}
                                        </Text>
                                        <Ionicons name="arrow-forward" size={16} color="#00D4FF" />
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
        fontFamily: 'Jost_600SemiBold',
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
        width: 30,
        height: 30,
        borderRadius: 15,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 3,
        shadowColor: '#0055FF',
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
        fontFamily: 'Jost_600SemiBold'
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
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 2,
        fontFamily: 'Jost_600SemiBold'
    },
    domainHeaderDivider: {
        height: 1,
        width: '100%',
        marginBottom: 20,
        marginTop: 5
    },
    sectionDividerText: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 2,
        color: '#0055FF',
        marginTop: 25,
        marginBottom: 12,
        textTransform: 'uppercase'
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
        fontFamily: 'Jost_600SemiBold'
    },
    infoButton: {
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: 'rgba(0, 85, 255, 0.15)',
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
        fontFamily: 'Jost_400Regular'
    },
    glassCard: {
        borderRadius: 20,
        borderWidth: 1,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2
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
        borderColor: '#0055FF',
        backgroundColor: '#0055FF'
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
        color: '#0055FF',
        letterSpacing: 1,
        marginBottom: 2
    },
    cgText: {
        fontSize: 13,
        fontWeight: '600',
        lineHeight: 18,
        fontFamily: 'Jost_400Regular'
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
        padding: 10
    },
    competencyChipActive: {
        borderColor: 'rgba(0, 85, 255, 0.5)',
        backgroundColor: 'rgba(0, 85, 255, 0.08)'
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
        fontFamily: 'Jost_400Regular'
    },
    cardSubLabel: {
        fontSize: 11,
        fontWeight: '700',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1
    },
    approachChipsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8
    },
    approachChip: {
        borderRadius: 20,
        borderWidth: 1,
        paddingVertical: 6,
        paddingHorizontal: 12
    },
    approachChipActive: {
        borderColor: '#0055FF',
        backgroundColor: '#0055FF'
    },
    approachChipText: {
        fontSize: 11,
        fontFamily: 'Jost_400Regular'
    },
    underlinedTextInput: {
        borderBottomWidth: 1.5,
        borderBottomColor: 'rgba(0, 85, 255, 0.3)',
        paddingVertical: 6,
        fontSize: 13,
        fontFamily: 'Jost_400Regular'
    },
    timeInputsRow: {
        flexDirection: 'row',
        gap: 20
    },
    timeInputCol: {
        flex: 1,
        alignItems: 'center'
    },
    timeLabelText: {
        fontSize: 9,
        fontWeight: '700',
        marginTop: 4,
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
        fontFamily: 'Jost_600SemiBold'
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
        letterSpacing: 0.5,
        textAlign: 'center'
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
        fontFamily: 'Jost_400Regular'
    },
    questionHeaderLabel: {
        fontSize: 11,
        fontWeight: '600',
        marginBottom: 8,
        fontFamily: 'Jost_400Regular'
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
        borderBottomColor: 'rgba(0, 85, 255, 0.3)',
        paddingVertical: 10,
        justifyContent: 'center',
        alignItems: 'center'
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
    gridTitleLabel: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        marginBottom: 8
    },
    stmtChip: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        backgroundColor: 'rgba(255,255,255,0.02)',
        marginBottom: 8,
        gap: 10
    },
    stmtChipActive: {
        borderColor: 'rgba(0, 85, 255, 0.4)',
        backgroundColor: 'rgba(0, 85, 255, 0.06)'
    },
    stmtChipText: {
        fontSize: 11,
        fontFamily: 'Jost_400Regular',
        flex: 1
    },
    promptLabel: {
        fontSize: 11,
        fontWeight: '600',
        marginBottom: 4,
        fontFamily: 'Jost_400Regular'
    },
    glowingUnderlinedInput: {
        borderBottomWidth: 1.5,
        paddingVertical: 4,
        fontSize: 13,
        fontFamily: 'Jost_400Regular'
    },
    wheelCardTitle: {
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 1,
        marginBottom: 15,
        textTransform: 'uppercase',
        textAlign: 'center'
    },
    wheelWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10
    },
    legendContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        width: '100%',
        paddingHorizontal: 8,
        marginTop: 20,
        gap: 12
    },
    legendSection: {
        flex: 1,
        minWidth: 100,
        gap: 6
    },
    legendSectionTitle: {
        fontSize: 8,
        fontWeight: '900',
        letterSpacing: 1,
        marginBottom: 4,
        textTransform: 'uppercase'
    },
    legendRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        minHeight: 14
    },
    legendDot: {
        width: 8,
        height: 8,
        borderRadius: 4
    },
    legendColorLine: {
        width: 10,
        height: 3,
        borderRadius: 1.5
    },
    legendLetter: {
        fontSize: 9,
        fontWeight: '900',
        width: 10,
        textAlign: 'center'
    },
    legendText: {
        fontSize: 9,
        fontWeight: '600'
    },
    strengthsChipsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6
    },
    strengthChip: {
        borderRadius: 14,
        borderWidth: 1,
        paddingVertical: 5,
        paddingHorizontal: 10
    },
    strengthChipActive: {
        borderColor: '#0055FF',
        backgroundColor: '#0055FF'
    },
    barrierChipActive: {
        borderColor: '#FF6B6B',
        backgroundColor: '#FF6B6B'
    },
    strengthChipText: {
        fontSize: 10,
        fontFamily: 'Jost_400Regular'
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
        shadowColor: '#0055FF',
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
