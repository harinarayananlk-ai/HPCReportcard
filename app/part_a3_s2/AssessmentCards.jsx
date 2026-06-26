import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useTheme, useAuth, API_URL } from '../../context/GlobalContext';
import PremiumBackground from '../../components/PremiumBackground';
import SoundButton from '../../components/SoundButton';
import MenuDropdown from '../../components/MenuDropdown';
import GemButton from '../../components/GemButton';
import FlashcardDeck from '../../components/FlashcardDeck';
import ActionChip from '../../components/ActionChip';
import { gems } from '../../colour_themes';
import useAutoSave from '../../hooks/useAutoSave';
import GemCutCard from '../../components/GemCutCard';

// Question definitions
const SELF_QUESTIONS = [
  'I can talk about how I feel, e.g., happy, confident, upset, or angry.',
  'I can calm myself down during difficult situations.',
  'I can understand how my friends feel.',
  'I respect everyone\'s opinions.',
  'I can help my friends make up after a fight.',
  'When someone is sad, I can make them feel better.',
  'I think I do well at school.',
];

const PEER_QUESTIONS = [
  'My friend can talk about how he/she feels, e.g., happy, confident, upset, or angry.',
  'My friend can calm himself/herself down during difficult situations.',
  'My friend can understand how his/her friends feel.',
  'My friend respects everyone\'s opinions.',
  'My friend can help others make up after a fight.',
  'When someone is sad, my friend can make them feel better.',
];

const PARENT_QUESTIONS = [
  'My child finds the classroom and school a welcoming and safe space.',
  'My child participates in academic and co-curricular activities in school.',
  'My child finds the grade-level curriculum difficult.',
  'My child is making good progress as per their grade.',
  'My child is getting the support needed from school.',
  'My child can talk about how he/she feels, e.g., happy, confident, upset, or angry.',
  'My child can calm himself/herself down during difficult situations.',
  'My child can understand how his/her friends feel.',
  'My child respects everyone\'s opinions.',
  'My child can help his/her friends make up after a fight.',
  'When someone is sad, my child can make them feel better.',
];

const HOME_RESOURCES = [
  { id: 'books', label: 'Books / Magazine' },
  { id: 'phone', label: 'Phone / Computer' },
  { id: 'newspaper', label: 'Newspaper' },
  { id: 'internet', label: 'Internet' },
  { id: 'toys', label: 'Toys / Games / Sports' },
];

export default function AssessmentCards() {
  const { theme } = useTheme();
  const { user, profile, setProfile: setAuthProfile, activeStudentId, activeStudentProfile, setActiveStudentProfile } = useAuth();
  const router = useRouter();

  const isTeacher = user?.role === 'teacher' || user?.role === 'superadmin';
  const targetUserId = activeStudentId || user?.id;
  const targetProfile = activeStudentProfile || profile;

  // Step state
  // 0: Self Cards
  // 1: Peer 1 Name Input
  // 2: Peer 1 Cards
  // 3: Peer 2 Name Input
  // 4: Peer 2 Cards
  // 5: Parent Resources
  // 6: Parent Cards
  // 7: Parent Support Areas (New)
  // 8: Finish screen
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Form states
  const [selfAnswers, setSelfAnswers] = useState({});
  
  const [peer1MyName, setPeer1MyName] = useState('');
  const [peer1FriendName, setPeer1FriendName] = useState('');
  const [peer1Answers, setPeer1Answers] = useState({});

  const [peer2FriendName, setPeer2FriendName] = useState('');
  const [peer2Answers, setPeer2Answers] = useState({});

  const [parentResources, setParentResources] = useState([]);
  const [parentAnswers, setParentAnswers] = useState({});
  const [parentSupportAreas, setParentSupportAreas] = useState([]);
  const [otherSupportSpecify, setOtherSupportSpecify] = useState('');

  // Load Saved Data
  useEffect(() => {
    if (targetProfile) {
      setPeer1MyName(targetProfile.full_name || '');
      
      const assess = typeof targetProfile.assessments === 'string'
        ? JSON.parse(targetProfile.assessments || '{}')
        : (targetProfile.assessments || {});
      const a3 = assess.a3_s2 || {};

      if (a3.selfAnswers) setSelfAnswers(a3.selfAnswers);
      if (a3.peer1) {
        setPeer1FriendName(a3.peer1.friendName || '');
        setPeer1Answers(a3.peer1.answers || {});
      }
      if (a3.peer2) {
        setPeer2FriendName(a3.peer2.friendName || '');
        setPeer2Answers(a3.peer2.answers || {});
      }
      if (a3.parent) {
        setParentResources(a3.parent.resources || []);
        setParentAnswers(a3.parent.answers || {});
        setParentSupportAreas(a3.parent.supportAreas || []);
        setOtherSupportSpecify(a3.parent.otherSupportSpecify || '');
      }
    }
  }, [targetProfile]);

  const getPayload = useCallback(() => {
    return {
      userId: targetUserId,
      registrationNumber: targetProfile?.registration_number,
      assessments: {
        ...targetProfile?.assessments,
        a3_s2: {
          selfAnswers,
          peer1: {
            myName: peer1MyName,
            friendName: peer1FriendName,
            answers: peer1Answers,
          },
          peer2: {
            friendName: peer2FriendName,
            answers: peer2Answers,
          },
          parent: {
            resources: parentResources,
            answers: parentAnswers,
            supportAreas: parentSupportAreas,
            otherSupportSpecify,
          },
        }
      }
    };
  }, [targetUserId, targetProfile, selfAnswers, peer1MyName, peer1FriendName, peer1Answers, peer2FriendName, peer2Answers, parentResources, parentAnswers, parentSupportAreas, otherSupportSpecify]);

  useAutoSave(targetUserId, getPayload, [selfAnswers, peer1MyName, peer1FriendName, peer1Answers, peer2FriendName, peer2Answers, parentResources, parentAnswers, parentSupportAreas, otherSupportSpecify]);

  const toggleResource = (id) => {
    if (parentResources.includes(id)) {
      setParentResources(parentResources.filter(item => item !== id));
    } else {
      setParentResources([...parentResources, id]);
    }
  };

  const handleSave = async (finalAssess = null) => {
    if (!targetUserId) return;
    setLoading(true);
    try {
      const currentAssess = typeof targetProfile?.assessments === 'string'
        ? JSON.parse(targetProfile.assessments || '{}')
        : (targetProfile?.assessments || {});

      const a3_s2 = (finalAssess && !finalAssess.target && !finalAssess.nativeEvent) ? finalAssess : {
        selfAnswers,
        peer1: {
          myName: peer1MyName,
          friendName: peer1FriendName,
          answers: peer1Answers,
        },
        peer2: {
          friendName: peer2FriendName,
          answers: peer2Answers,
        },
        parent: {
          resources: parentResources,
          answers: parentAnswers,
          supportAreas: parentSupportAreas,
          otherSupportSpecify,
        },
      };

      const updatedAssess = { ...currentAssess, a3_s2 };

      const res = await fetch(`${API_URL}/students/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: targetUserId,
          registrationNumber: targetProfile?.registration_number,
          assessments: updatedAssess,
        }),
      });

      if (res.ok) {
        const updated = { ...targetProfile, assessments: updatedAssess };
        if (isTeacher && activeStudentId) setActiveStudentProfile(updated);
        else setAuthProfile(updated);
        Alert.alert('Saved', 'Assessment answers updated.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const proceedFromSelf = (answersObj) => {
    setSelfAnswers(answersObj);
    setActiveStep(1);
  };

  const proceedFromPeer1Name = () => {
    if (!peer1FriendName.trim()) {
      Alert.alert('Required', 'Please enter your friend\'s name.');
      return;
    }
    setActiveStep(2);
  };

  const proceedFromPeer1 = (answersObj) => {
    setPeer1Answers(answersObj);
    setActiveStep(3);
  };

  const proceedFromPeer2Name = () => {
    if (!peer2FriendName.trim()) {
      Alert.alert('Required', 'Please enter your second friend\'s name.');
      return;
    }
    setActiveStep(4);
  };

  const proceedFromPeer2 = (answersObj) => {
    setPeer2Answers(answersObj);
    setActiveStep(5);
  };

  const proceedFromParentResources = () => {
    setActiveStep(6);
  };

  const proceedFromParent = async (answersObj) => {
    setParentAnswers(answersObj);
    setActiveStep(7);
  };

  const proceedFromParentSupport = async () => {
    const final = {
      selfAnswers,
      peer1: {
        myName: peer1MyName,
        friendName: peer1FriendName,
        answers: peer1Answers,
      },
      peer2: {
        friendName: peer2FriendName,
        answers: peer2Answers,
      },
      parent: {
        resources: parentResources,
        answers: parentAnswers,
        supportAreas: parentSupportAreas,
        otherSupportSpecify,
      },
    };
    await handleSave(final);
    setActiveStep(8);
  };

  const handleFinish = () => {
    router.push('/part_b_s2/SelectionPage');
  };

  // Render sub-screens based on activeStep
  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <View style={styles.stepContainer}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Self Assessment</Text>
            <Text style={[styles.sectionDesc, { color: theme.secondaryText }]}>
              How do you feel about yourself at school? Read the question and choose one emoji.
            </Text>
            <FlashcardDeck
              questions={SELF_QUESTIONS}
              onAnswer={() => {}}
              onComplete={proceedFromSelf}
            />
          </View>
        );

      case 1:
        return (
          <GemCutCard style={styles.formContainer} contentStyle={{ padding: 20 }}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Friend Assessment (1/2)</Text>
            <Text style={[styles.sectionDesc, { color: theme.secondaryText }]}>
              {"Let's assess your first classmate friend."}
            </Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.secondaryText }]}>My Name</Text>
              <TextInput
                style={[styles.textInput, { color: theme.text, borderColor: theme.border }]}
                value={peer1MyName}
                onChangeText={setPeer1MyName}
                placeholder="Your Name"
                placeholderTextColor={theme.secondaryText + '60'}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.secondaryText }]}>{"Friend's Name"}</Text>
              <TextInput
                style={[styles.textInput, { color: theme.text, borderColor: theme.border }]}
                value={peer1FriendName}
                onChangeText={setPeer1FriendName}
                placeholder="Friend's Name"
                placeholderTextColor={theme.secondaryText + '60'}
              />
            </View>

            <View style={styles.buttonCol}>
              <GemButton gemType="silver" onPress={proceedFromPeer1Name}>
                <Text style={styles.btnText}>START ASSESSMENT</Text>
              </GemButton>
            </View>
          </GemCutCard>
        );

      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Assessing {peer1FriendName}</Text>
            <Text style={[styles.sectionDesc, { color: theme.secondaryText }]}>
              Think about how your friend behaves at school. Choose one emoji.
            </Text>
            <FlashcardDeck
              questions={PEER_QUESTIONS}
              onAnswer={() => {}}
              onComplete={proceedFromPeer1}
            />
          </View>
        );

      case 3:
        return (
          <GemCutCard style={styles.formContainer} contentStyle={{ padding: 20 }}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Friend Assessment (2/2)</Text>
            <Text style={[styles.sectionDesc, { color: theme.secondaryText }]}>
              {"Let's assess your second classmate friend."}
            </Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.secondaryText }]}>{"Friend's Name"}</Text>
              <TextInput
                style={[styles.textInput, { color: theme.text, borderColor: theme.border }]}
                value={peer2FriendName}
                onChangeText={setPeer2FriendName}
                placeholder="Second Friend's Name"
                placeholderTextColor={theme.secondaryText + '60'}
              />
            </View>

            <View style={styles.buttonCol}>
              <GemButton gemType="silver" onPress={proceedFromPeer2Name}>
                <Text style={styles.btnText}>START ASSESSMENT</Text>
              </GemButton>
            </View>
          </GemCutCard>
        );

      case 4:
        return (
          <View style={styles.stepContainer}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Assessing {peer2FriendName}</Text>
            <Text style={[styles.sectionDesc, { color: theme.secondaryText }]}>
              Think about how your friend behaves at school. Choose one emoji.
            </Text>
            <FlashcardDeck
              questions={PEER_QUESTIONS}
              onAnswer={() => {}}
              onComplete={proceedFromPeer2}
            />
          </View>
        );

      case 5:
        return (
          <GemCutCard style={styles.formContainer} contentStyle={{ padding: 20 }}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Parent Observation</Text>
            <Text style={[styles.sectionDesc, { color: theme.secondaryText }]}>
              Resources available to your child at home:
            </Text>

            <View style={styles.resourcesGrid}>
              {HOME_RESOURCES.map(res => {
                const isActive = parentResources.includes(res.id);
                return (
                  <ActionChip
                    key={res.id}
                    label={res.label}
                    isActive={isActive}
                    onToggle={() => toggleResource(res.id)}
                  />
                );
              })}
            </View>

            <View style={styles.buttonCol}>
              <GemButton gemType="sapphire" onPress={proceedFromParentResources}>
                <Text style={styles.btnText}>START PARENT SURVEY</Text>
              </GemButton>
            </View>
          </GemCutCard>
        );

      case 6:
        return (
          <View style={styles.stepContainer}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Parent / Caregiver Survey</Text>
            <Text style={[styles.sectionDesc, { color: theme.secondaryText }]}>
              Please observe your child and choose one option for each question.
            </Text>
            <FlashcardDeck
              questions={PARENT_QUESTIONS}
              onAnswer={() => {}}
              onComplete={proceedFromParent}
            />
          </View>
        );

      case 7:
        const supportOptions = [
          { id: 'oral', label: 'Oral Communication (R1 or R2)' },
          { id: 'working_others', label: 'Working with other children' },
          { id: 'reading', label: 'Reading' },
          { id: 'confidence', label: 'Self Confidence' },
          { id: 'math', label: 'Numbers and Math' },
          { id: 'independent', label: 'Working independently at home' },
          { id: 'other', label: 'Other subject areas' },
        ];
        
        const toggleSupportArea = (id) => {
          if (parentSupportAreas.includes(id)) {
            setParentSupportAreas(parentSupportAreas.filter(item => item !== id));
          } else {
            setParentSupportAreas([...parentSupportAreas, id]);
          }
        };

        const showSpecify = parentSupportAreas.includes('other');

        return (
          <GemCutCard style={styles.formContainer} contentStyle={{ padding: 20 }}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Parent Observation 2</Text>
            <Text style={[styles.sectionDesc, { color: theme.secondaryText }]}>
              My child needs support with...
            </Text>

            <View style={styles.resourcesGrid}>
              {supportOptions.map(opt => {
                const isActive = parentSupportAreas.includes(opt.id);
                return (
                  <ActionChip
                    key={opt.id}
                    label={opt.label}
                    isActive={isActive}
                    onToggle={() => toggleSupportArea(opt.id)}
                  />
                );
              })}
            </View>

            <View style={{ 
              marginTop: showSpecify ? 16 : 0, 
              height: showSpecify ? undefined : 0, 
              opacity: showSpecify ? 1 : 0, 
              overflow: 'hidden' 
            }}>
              <Text style={[styles.label, { color: theme.secondaryText }]}>Other subject areas Specify:</Text>
              <TextInput
                style={[styles.textInput, { color: theme.text, borderColor: theme.border }]}
                placeholder="Specify other subject areas..."
                placeholderTextColor={theme.secondaryText + '60'}
                value={otherSupportSpecify}
                onChangeText={setOtherSupportSpecify}
              />
            </View>

            <View style={styles.buttonCol}>
              <GemButton gemType="sapphire" onPress={proceedFromParentSupport}>
                <Text style={styles.btnText}>COMPLETE & FINISH</Text>
              </GemButton>
            </View>
          </GemCutCard>
        );

      case 8:
        return (
          <GemCutCard style={styles.formContainer} contentStyle={{ padding: 20 }}>
            <View style={styles.successIconBox}>
              <Ionicons name="checkmark-circle" size={80} color={gems.silver} />
            </View>
            <Text style={[styles.sectionTitle, { color: theme.text, textAlign: 'center' }]}>Completed!</Text>
            <Text style={[styles.sectionDesc, { color: theme.secondaryText, textAlign: 'center', marginBottom: 30 }]}>
              All assessment responses have been recorded successfully.
            </Text>
            <GemButton gemType="sapphire" onPress={handleFinish}>
              <Text style={styles.btnText}>CONTINUE TO PART B</Text>
            </GemButton>
          </GemCutCard>
        );

      default:
        return null;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <PremiumBackground />
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar translucent barStyle={theme.isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" />

        {/* Header */}
        <View style={styles.header}>
          <MenuDropdown />
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={[styles.title, { color: theme.text }]}>SOCIAL-EMOTIONAL CARDS</Text>
            <Text style={[styles.subtitle, { color: theme.secondaryText }]}>✨ Part A3 Assessment ✨</Text>
          </View>
          <SoundButton onPress={() => handleSave()} style={[styles.backBtn, { borderColor: gems.silver + '80' }]}>
            <Ionicons name="cloud-upload-outline" size={20} color={gems.silver} />
          </SoundButton>
        </View>

        {/* Main Content Area */}
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {renderStepContent()}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  title: {
    fontSize: 16,
    fontWeight: '300',
    letterSpacing: 2,
    fontFamily: 'Inter_400Regular',
  },
  subtitle: {
    fontSize: 9,
    letterSpacing: 1,
    marginTop: 2,
    textTransform: 'uppercase',
    fontFamily: 'Inter_400Regular',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  stepContainer: {
    width: '100%',
    alignItems: 'center',
  },
  formContainer: {
    width: '100%',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Outfit_600SemiBold',
    marginBottom: 8,
  },
  sectionDesc: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginBottom: 24,
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
    fontFamily: 'Outfit_600SemiBold',
  },
  textInput: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    minHeight: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  buttonCol: {
    flexDirection: 'column',
    gap: 12,
    marginTop: 16,
    alignItems: 'center',
    width: '100%',
  },
  btn: {
    borderRadius: 16,
  },
  btnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    fontFamily: 'Outfit_600SemiBold',
    textAlign: 'center',
  },
  resourcesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  successIconBox: {
    alignItems: 'center',
    marginBottom: 20,
  },
});
