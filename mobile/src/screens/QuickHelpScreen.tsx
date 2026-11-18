// mobile/src/screens/QuickHelpScreen.tsx
// =============================================================================
// QuickHelpScreen — Calm, Respectful Traveler Assistance (M7 Design)
// =============================================================================
// Provides immediate access to:
//   1. Polite responses for declining unwanted attention
//   2. Practical guidelines for locating busy, staffed safe public places
//   3. Direct, explicit access to a traveler's trusted contact
//   4. Verified regional emergency numbers with authoritative source attributions
//
// Safety & Privacy Rules:
//   - Calm, respectful language with NO alarmist visuals or sirens.
//   - Never claims Mangaluru has zero danger or guarantees safety.
//   - Never silently calls, texts, or tracks location.
//   - All phone/SMS actions require explicit user confirmation.
//   - Operates fully offline without requiring an account.
// =============================================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Colors, Spacing, Typography, Radius, Shadow } from '../theme';
import { PrimaryButton } from '../components/PrimaryButton';
import { SecondaryButton } from '../components/SecondaryButton';
import type { RootStackParamList } from '../navigation/types';
import type { QuickHelpTab, TrustedContact } from '../engine/safety/types';
import {
  POLITE_RESPONSES,
  SAFETY_BOUNDARY_REMINDER,
  USEFUL_TULU_EXPRESSIONS,
} from '../engine/safety/politeResponses';
import {
  SAFER_PLACE_GUIDELINES,
  SAFETY_GENERAL_DISCLAIMER,
} from '../engine/safety/saferPlaces';
import {
  VERIFIED_EMERGENCY_CONTACTS,
  EMERGENCY_IMMEDIATE_DANGER_NOTICE,
  EMERGENCY_NO_AUTODISPATCH_DISCLAIMER,
  formatEmergencyNumber,
} from '../engine/safety/emergencyContacts';
import {
  loadTrustedContact,
  saveTrustedContact,
  clearTrustedContact,
  validatePhoneNumber,
} from '../engine/safety/trustedContactStorage';
import {
  requestCallConfirmation,
  requestSmsConfirmation,
} from '../engine/safety/contactActions';

type Props = NativeStackScreenProps<RootStackParamList, 'QuickHelp'>;

export function QuickHelpScreen({ route, navigation }: Props): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<QuickHelpTab>('responses');

  // Trusted Contact State
  const [trustedContact, setTrustedContact] = useState<TrustedContact | null>(null);
  const [isEditingContact, setIsEditingContact] = useState<boolean>(false);
  const [inputName, setInputName] = useState<string>('');
  const [inputPhone, setInputPhone] = useState<string>('');
  const [inputRelationship, setInputRelationship] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  // Load contact from storage on mount
  useEffect(() => {
    let isMounted = true;
    loadTrustedContact()
      .then((contact) => {
        if (isMounted) {
          setTrustedContact(contact);
          if (contact) {
            setInputName(contact.name);
            setInputPhone(contact.phoneNumber);
            setInputRelationship(contact.relationship ?? '');
          }
        }
      })
      .catch((err) => {
        console.warn('[QuickHelpScreen] Failed to load trusted contact on mount:', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Save contact handler
  const handleSaveContact = async () => {
    setFormError(null);
    if (!inputName.trim()) {
      setFormError('Please enter a name for your contact.');
      return;
    }
    const phoneVal = validatePhoneNumber(inputPhone);
    if (!phoneVal.valid) {
      setFormError(phoneVal.reason || 'Please enter a valid phone number.');
      return;
    }

    try {
      const contactToSave: TrustedContact = {
        name: inputName.trim(),
        phoneNumber: inputPhone.trim(),
        relationship: inputRelationship.trim() || undefined,
      };
      await saveTrustedContact(contactToSave);
      setTrustedContact(contactToSave);
      setIsEditingContact(false);
      Alert.alert('Contact Saved', `${contactToSave.name} has been saved as your trusted contact on this device.`);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save contact.');
    }
  };

  // Clear contact handler
  const handleClearContact = () => {
    Alert.alert(
      'Remove Trusted Contact?',
      'Are you sure you want to remove this contact from your device?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearTrustedContact();
              setTrustedContact(null);
              setInputName('');
              setInputPhone('');
              setInputRelationship('');
              setIsEditingContact(false);
            } catch (err: any) {
              console.warn('[QuickHelpScreen] Failed to remove contact:', err);
              Alert.alert('Error', err.message || 'Could not remove contact from device storage.');
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.root}>
      {/* ── Subdued Category Bar / Tabs ───────────────────────── */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'responses' && styles.tabButtonActive]}
          onPress={() => setActiveTab('responses')}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'responses' }}
          accessibilityLabel="Polite Responses tab"
        >
          <Text style={[styles.tabButtonText, activeTab === 'responses' && styles.tabButtonTextActive]}>
            💬 Responses
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'places' && styles.tabButtonActive]}
          onPress={() => setActiveTab('places')}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'places' }}
          accessibilityLabel="Safer Places tab"
        >
          <Text style={[styles.tabButtonText, activeTab === 'places' && styles.tabButtonTextActive]}>
            🏢 Safe Places
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'contacts' && styles.tabButtonActive]}
          onPress={() => setActiveTab('contacts')}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'contacts' }}
          accessibilityLabel="Trusted Contact tab"
        >
          <Text style={[styles.tabButtonText, activeTab === 'contacts' && styles.tabButtonTextActive]}>
            👤 Contact
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'emergency' && styles.tabButtonActive]}
          onPress={() => setActiveTab('emergency')}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'emergency' }}
          accessibilityLabel="Emergency Help tab"
        >
          <Text style={[styles.tabButtonText, activeTab === 'emergency' && styles.tabButtonTextActive]}>
            🚨 Emergency
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ══════════════════════════════════════════════════════════ */}
        {/* TAB 1: POLITE RESPONSES                                    */}
        {/* ══════════════════════════════════════════════════════════ */}
        {activeTab === 'responses' && (
          <View style={styles.tabContent}>
            {/* Core Safety Reminder Banner */}
            <View style={styles.reminderCard}>
              <Text style={styles.reminderIcon}>🛡️</Text>
              <View style={styles.reminderTextCol}>
                <Text style={styles.reminderTitle}>Safety First</Text>
                <Text style={styles.reminderBody}>{SAFETY_BOUNDARY_REMINDER}</Text>
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionEyebrow}>TULU QUICK HELP PHRASES</Text>
              <Text style={styles.sectionHeading}>Phrases for safety and setting boundaries</Text>
              <Text style={styles.sectionSub}>
                Authentic Tulu phrases written in English/Roman letters with English meanings. Show or speak these phrases to disengage from uncomfortable situations or seek immediate help.
              </Text>
            </View>

            <View style={styles.cardsCol}>
              {POLITE_RESPONSES.map((item) => (
                <View key={item.id} style={styles.phraseCard}>
                  {/* English meaning */}
                  <View style={styles.phraseHeader}>
                    <Text style={styles.phraseQuotes}>“</Text>
                    <Text style={styles.phraseEnglishText}>{item.english}</Text>
                  </View>

                  {/* Tulu translation (prominently underneath) */}
                  <View style={styles.tuluContainer}>
                    <Text style={styles.tuluLabel}>Tulu (Roman script):</Text>
                    {item.genderAlternatives ? (
                      <View style={styles.genderAlternativesCol}>
                        <View style={styles.genderRow}>
                          <Text style={styles.genderLabel}>For a male:</Text>
                          <Text style={styles.tuluText}>{item.genderAlternatives.male}</Text>
                        </View>
                        <View style={styles.genderRow}>
                          <Text style={styles.genderLabel}>For a female:</Text>
                          <Text style={styles.tuluText}>{item.genderAlternatives.female}</Text>
                        </View>
                      </View>
                    ) : (
                      <Text style={styles.tuluText}>{item.tulu}</Text>
                    )}
                  </View>

                  {/* Respect distinction if specified */}
                  {item.respectDistinction && (
                    <View style={styles.respectBox}>
                      <Text style={styles.respectTitle}>Respect distinction:</Text>
                      <Text style={styles.respectItem}>
                        • <Text style={styles.respectBold}>{item.respectDistinction.withRespect}</Text> = With respect (default)
                      </Text>
                      <Text style={styles.respectItem}>
                        • <Text style={styles.respectBold}>{item.respectDistinction.withoutRespect}</Text> = Without respect
                      </Text>
                    </View>
                  )}

                  {item.context && (
                    <View style={styles.phraseFooter}>
                      <Text style={styles.phraseContext}>💡 {item.context}</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>

            {/* Cultural Addition: Useful Tulu Expressions */}
            <View style={styles.expressionsSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionEyebrow}>CULTURAL EXPRESSIONS</Text>
                <Text style={styles.sectionHeading}>Useful Tulu Expressions</Text>
                <Text style={styles.sectionSub}>
                  Everyday expressions of gratitude to connect warmly and respectfully with locals in Coastal Karnataka. These are cultural additions, not emergency phrases.
                </Text>
              </View>

              <View style={styles.cardsCol}>
                {USEFUL_TULU_EXPRESSIONS.map((expr) => (
                  <View key={expr.id} style={styles.expressionCard}>
                    <View style={styles.expressionHeader}>
                      <Text style={styles.expressionTulu}>{expr.tulu}</Text>
                      <View style={styles.culturalBadge}>
                        <Text style={styles.culturalBadgeText}>Cultural Note</Text>
                      </View>
                    </View>
                    <Text style={styles.expressionEnglish}>“{expr.english}”</Text>
                    {expr.context && (
                      <Text style={styles.expressionContext}>{expr.context}</Text>
                    )}
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* TAB 2: SAFER PUBLIC PLACES                                 */}
        {/* ══════════════════════════════════════════════════════════ */}
        {activeTab === 'places' && (
          <View style={styles.tabContent}>
            {/* General Safety Disclaimer */}
            <View style={styles.disclaimerCard}>
              <Text style={styles.disclaimerIcon}>ℹ️</Text>
              <Text style={styles.disclaimerText}>{SAFETY_GENERAL_DISCLAIMER}</Text>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionEyebrow}>PUBLIC SAFETY</Text>
              <Text style={styles.sectionHeading}>Move toward a busy, staffed place</Text>
              <Text style={styles.sectionSub}>
                If you feel uneasy or are being followed, calmly relocate toward active public areas where people and staff are present.
              </Text>
            </View>

            <View style={styles.cardsCol}>
              {SAFER_PLACE_GUIDELINES.map((guideline) => (
                <View key={guideline.id} style={styles.guideCard}>
                  <View style={styles.guideTopRow}>
                    <Text style={styles.guideIcon}>{guideline.icon}</Text>
                    <Text style={styles.guideTitle}>{guideline.title}</Text>
                  </View>

                  <Text style={styles.guideBody}>{guideline.guidance}</Text>

                  <View style={styles.examplesList}>
                    {guideline.examples.map((ex, idx) => (
                      <View key={idx} style={styles.exampleRow}>
                        <Text style={styles.exampleBullet}>•</Text>
                        <Text style={styles.exampleText}>{ex}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* TAB 3: TRUSTED CONTACT                                     */}
        {/* ══════════════════════════════════════════════════════════ */}
        {activeTab === 'contacts' && (
          <View style={styles.tabContent}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionEyebrow}>PERSONAL SUPPORT</Text>
              <Text style={styles.sectionHeading}>Reach someone you trust</Text>
              <Text style={styles.sectionSub}>
                Save a trusted friend, family member, or hotel front desk on this device so you can reach them quickly with one tap.
              </Text>
            </View>

            {/* Privacy note */}
            <View style={styles.privacyNote}>
              <Text style={styles.privacyNoteText}>
                🔒 Saved on your device only. The app will never make calls or send messages silently—every contact action requires your explicit confirmation.
              </Text>
            </View>

            {/* If contact is saved and not editing */}
            {trustedContact && !isEditingContact ? (
              <View style={styles.contactDisplayCard}>
                <View style={styles.contactTopRow}>
                  <View style={styles.contactAvatar}>
                    <Text style={styles.contactAvatarText}>
                      {trustedContact.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.contactMetaCol}>
                    <Text style={styles.contactName}>{trustedContact.name}</Text>
                    <Text style={styles.contactPhone}>{trustedContact.phoneNumber}</Text>
                    {trustedContact.relationship && (
                      <Text style={styles.contactRelationship}>
                        {trustedContact.relationship}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Explicit Contact Action Buttons */}
                <View style={styles.contactActionsRow}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.callActionBtn]}
                    onPress={() =>
                      requestCallConfirmation({
                        recipientName: trustedContact.name,
                        phoneNumber: trustedContact.phoneNumber,
                      })
                    }
                    accessibilityRole="button"
                    accessibilityLabel={`Call ${trustedContact.name}`}
                  >
                    <Text style={styles.callActionBtnText}>📞 Call {trustedContact.name}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.smsActionBtn]}
                    onPress={() =>
                      requestSmsConfirmation({
                        recipientName: trustedContact.name,
                        phoneNumber: trustedContact.phoneNumber,
                      })
                    }
                    accessibilityRole="button"
                    accessibilityLabel={`Send SMS to ${trustedContact.name}`}
                  >
                    <Text style={styles.smsActionBtnText}>💬 Text Check-in</Text>
                  </TouchableOpacity>
                </View>

                {/* Edit / Remove Options */}
                <View style={styles.contactManageRow}>
                  <TouchableOpacity
                    onPress={() => setIsEditingContact(true)}
                    accessibilityRole="button"
                    accessibilityLabel="Edit trusted contact"
                  >
                    <Text style={styles.manageLinkText}>Edit Contact</Text>
                  </TouchableOpacity>
                  <View style={styles.manageDivider} />
                  <TouchableOpacity
                    onPress={handleClearContact}
                    accessibilityRole="button"
                    accessibilityLabel="Remove trusted contact"
                  >
                    <Text style={[styles.manageLinkText, styles.manageLinkDanger]}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              /* Contact Form (New or Edit) */
              <View style={styles.contactFormCard}>
                <Text style={styles.formTitle}>
                  {trustedContact ? 'Edit Trusted Contact' : 'Set Up a Trusted Contact'}
                </Text>
                <Text style={styles.formSubtitle}>
                  Enter the details of a companion, relative, or accommodation reception.
                </Text>

                {formError && (
                  <View style={styles.formErrorBox}>
                    <Text style={styles.formErrorText}>{formError}</Text>
                  </View>
                )}

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Name *</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Maya, Hotel Reception, Brother"
                    placeholderTextColor={Colors.textTertiary}
                    value={inputName}
                    onChangeText={setInputName}
                    autoCapitalize="words"
                    accessibilityLabel="Trusted contact name input"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Phone Number *</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. +91 98765 43210"
                    placeholderTextColor={Colors.textTertiary}
                    value={inputPhone}
                    onChangeText={setInputPhone}
                    keyboardType="phone-pad"
                    accessibilityLabel="Trusted contact phone number input"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Relationship (Optional)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Travel partner, Parent, Hotel desk"
                    placeholderTextColor={Colors.textTertiary}
                    value={inputRelationship}
                    onChangeText={setInputRelationship}
                    accessibilityLabel="Trusted contact relationship input"
                  />
                </View>

                <View style={styles.formActionsRow}>
                  <PrimaryButton
                    label="Save Contact"
                    onPress={handleSaveContact}
                    accessibilityLabel="Save trusted contact details"
                  />
                  {trustedContact && (
                    <SecondaryButton
                      label="Cancel"
                      onPress={() => {
                        setIsEditingContact(false);
                        setFormError(null);
                      }}
                      accessibilityLabel="Cancel editing contact"
                    />
                  )}
                </View>
              </View>
            )}
          </View>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* TAB 4: EMERGENCY HELP                                      */}
        {/* ══════════════════════════════════════════════════════════ */}
        {activeTab === 'emergency' && (
          <View style={styles.tabContent}>
            {/* Immediate Danger Notice */}
            <View style={styles.emergencyHeroCard}>
              <Text style={styles.emergencyHeroIcon}>🚨</Text>
              <View style={styles.emergencyHeroTextCol}>
                <Text style={styles.emergencyHeroTitle}>Immediate Danger</Text>
                <Text style={styles.emergencyHeroBody}>
                  {EMERGENCY_IMMEDIATE_DANGER_NOTICE}
                </Text>
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionEyebrow}>VERIFIED CONTACTS</Text>
              <Text style={styles.sectionHeading}>Official Regional Helplines</Text>
              <Text style={styles.sectionSub}>
                Verified numbers from the Government of India and Karnataka State Police. Every call opens your device dialer for manual confirmation.
              </Text>
            </View>

            <View style={styles.cardsCol}>
              {VERIFIED_EMERGENCY_CONTACTS.map((item) => (
                <View key={item.id} style={styles.emergencyCard}>
                  <View style={styles.emergencyHeaderRow}>
                    <View style={styles.emergencyNumberPill}>
                      <Text style={styles.emergencyNumberText}>
                        {formatEmergencyNumber(item.number)}
                      </Text>
                    </View>
                    <Text style={styles.emergencyTitle}>{item.name}</Text>
                  </View>

                  <Text style={styles.emergencyDesc}>{item.description}</Text>

                  <View style={styles.sourceRow}>
                    <Text style={styles.sourceLabel}>Authority:</Text>
                    <Text style={styles.sourceText}>{item.authoritySource}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.emergencyCallBtn}
                    onPress={() =>
                      requestCallConfirmation({
                        recipientName: item.name,
                        phoneNumber: item.number,
                        isEmergency: true,
                      })
                    }
                    accessibilityRole="button"
                    accessibilityLabel={`Call ${item.name} at ${item.number}`}
                  >
                    <Text style={styles.emergencyCallBtnText}>
                      Call {formatEmergencyNumber(item.number)} →
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {/* Non-autodispatch disclaimer */}
            <View style={styles.disclaimerBottomBox}>
              <Text style={styles.disclaimerBottomText}>
                {EMERGENCY_NO_AUTODISPATCH_DISCLAIMER}
              </Text>
            </View>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.sm,
  },
  tabButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: Colors.primary,
  },
  tabButtonText: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabButtonTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  scroll: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  tabContent: {
    gap: Spacing.lg,
  },
  sectionHeader: {
    gap: 4,
  },
  sectionEyebrow: {
    ...Typography.overline,
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  sectionHeading: {
    ...Typography.heading,
    fontSize: 22,
    color: Colors.textPrimary,
  },
  sectionSub: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  cardsCol: {
    gap: Spacing.md,
  },
  reminderCard: {
    flexDirection: 'row',
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#EFE1C4',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm + 2,
    alignItems: 'flex-start',
  },
  reminderIcon: {
    fontSize: 22,
    marginTop: 2,
  },
  reminderTextCol: {
    flex: 1,
    gap: 2,
  },
  reminderTitle: {
    ...Typography.subheading,
    fontSize: 15,
    fontWeight: '700',
    color: '#8A5D19',
  },
  reminderBody: {
    ...Typography.bodySmall,
    fontSize: 13,
    lineHeight: 19,
    color: '#5C4318',
  },
  phraseCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.xs + 2,
    ...Shadow.sm,
  },
  phraseHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
  },
  phraseQuotes: {
    fontSize: 24,
    lineHeight: 24,
    color: Colors.primary,
    fontWeight: '700',
  },
  phraseEnglishText: {
    ...Typography.body,
    fontSize: 15,
    color: Colors.textPrimary,
    fontWeight: '600',
    flex: 1,
    lineHeight: 22,
  },
  tuluContainer: {
    backgroundColor: '#F5F8FC',
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 8,
    borderRadius: Radius.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
    marginTop: 2,
    gap: 3,
  },
  tuluLabel: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  tuluText: {
    ...Typography.subheading,
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '700',
    lineHeight: 22,
  },
  genderAlternativesCol: {
    gap: 6,
    marginTop: 2,
  },
  genderRow: {
    gap: 2,
  },
  genderLabel: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  respectBox: {
    backgroundColor: '#FAF5EE',
    padding: Spacing.sm,
    borderRadius: Radius.xs,
    borderWidth: 1,
    borderColor: '#EFE1C4',
    gap: 2,
    marginTop: 2,
  },
  respectTitle: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: '#8A5D19',
  },
  respectItem: {
    ...Typography.caption,
    fontSize: 12,
    color: '#5C4318',
    lineHeight: 16,
  },
  respectBold: {
    fontWeight: '700',
    color: '#3D2A08',
  },
  phraseFooter: {
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  phraseContext: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  expressionsSection: {
    marginTop: Spacing.md,
    gap: Spacing.md,
  },
  expressionCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
    ...Shadow.sm,
  },
  expressionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  expressionTulu: {
    ...Typography.subheading,
    fontSize: 17,
    fontWeight: '700',
    color: Colors.primary,
  },
  culturalBadge: {
    backgroundColor: '#EAF5EE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  culturalBadgeText: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: '#1B6B3E',
  },
  expressionEnglish: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.textPrimary,
    fontStyle: 'italic',
  },
  expressionContext: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  disclaimerCard: {
    flexDirection: 'row',
    backgroundColor: '#F7F8FA',
    borderWidth: 1,
    borderColor: '#E2E6EC',
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
    alignItems: 'flex-start',
  },
  disclaimerIcon: {
    fontSize: 18,
    marginTop: 1,
  },
  disclaimerText: {
    ...Typography.bodySmall,
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
    flex: 1,
  },
  guideCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.xs,
    ...Shadow.sm,
  },
  guideTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  guideIcon: {
    fontSize: 20,
  },
  guideTitle: {
    ...Typography.subheading,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    flex: 1,
  },
  guideBody: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 20,
    fontSize: 13,
    marginTop: 2,
  },
  examplesList: {
    marginTop: 6,
    gap: 3,
    backgroundColor: '#FBF9F6',
    padding: Spacing.sm,
    borderRadius: Radius.xs,
  },
  exampleRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'flex-start',
  },
  exampleBullet: {
    fontSize: 12,
    color: Colors.primary,
  },
  exampleText: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.textSecondary,
    flex: 1,
  },
  privacyNote: {
    backgroundColor: '#F3F7FA',
    padding: Spacing.sm + 2,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#D8E5F0',
  },
  privacyNoteText: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  contactDisplayCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
    ...Shadow.sm,
  },
  contactTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  contactAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  contactAvatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
  },
  contactMetaCol: {
    flex: 1,
    gap: 2,
  },
  contactName: {
    ...Typography.subheading,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  contactPhone: {
    ...Typography.bodySmall,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  contactRelationship: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.textTertiary,
    textTransform: 'capitalize',
  },
  contactActionsRow: {
    gap: Spacing.sm,
  },
  actionBtn: {
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callActionBtn: {
    backgroundColor: Colors.primary,
  },
  callActionBtnText: {
    ...Typography.button,
    color: Colors.white,
    fontSize: 15,
  },
  smsActionBtn: {
    backgroundColor: '#EAF3FB',
    borderWidth: 1,
    borderColor: '#C7DDF6',
  },
  smsActionBtnText: {
    ...Typography.button,
    color: Colors.primary,
    fontSize: 14,
  },
  contactManageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    gap: Spacing.md,
  },
  manageLinkText: {
    ...Typography.caption,
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
  },
  manageLinkDanger: {
    color: Colors.error,
  },
  manageDivider: {
    width: 1,
    height: 14,
    backgroundColor: Colors.divider,
  },
  contactFormCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
    ...Shadow.sm,
  },
  formTitle: {
    ...Typography.subheading,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  formSubtitle: {
    ...Typography.bodySmall,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  formErrorBox: {
    backgroundColor: '#FDECEA',
    padding: Spacing.sm,
    borderRadius: Radius.xs,
    borderWidth: 1,
    borderColor: '#F8B4AF',
  },
  formErrorText: {
    ...Typography.caption,
    color: Colors.error,
    fontWeight: '600',
  },
  inputGroup: {
    gap: 4,
  },
  inputLabel: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  textInput: {
    backgroundColor: Colors.background,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  formActionsRow: {
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  emergencyHeroCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FED7D7',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm + 2,
    alignItems: 'flex-start',
  },
  emergencyHeroIcon: {
    fontSize: 24,
    marginTop: 2,
  },
  emergencyHeroTextCol: {
    flex: 1,
    gap: 2,
  },
  emergencyHeroTitle: {
    ...Typography.subheading,
    fontSize: 15,
    fontWeight: '700',
    color: '#9B2C2C',
  },
  emergencyHeroBody: {
    ...Typography.bodySmall,
    fontSize: 13,
    lineHeight: 19,
    color: '#742A2A',
  },
  emergencyCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.xs + 2,
    ...Shadow.sm,
  },
  emergencyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  emergencyNumberPill: {
    backgroundColor: '#F7EBEB',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.xs,
    borderWidth: 1,
    borderColor: '#E6B8B8',
  },
  emergencyNumberText: {
    ...Typography.button,
    fontSize: 13,
    fontWeight: '800',
    color: '#A82828',
  },
  emergencyTitle: {
    ...Typography.subheading,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    flex: 1,
  },
  emergencyDesc: {
    ...Typography.bodySmall,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  sourceRow: {
    flexDirection: 'row',
    gap: 4,
    paddingTop: 2,
  },
  sourceLabel: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textTertiary,
    textTransform: 'uppercase',
  },
  sourceText: {
    ...Typography.caption,
    fontSize: 10,
    color: Colors.textSecondary,
    flex: 1,
  },
  emergencyCallBtn: {
    marginTop: 4,
    backgroundColor: '#F5F8FC',
    borderWidth: 1,
    borderColor: '#D4E2F2',
    paddingVertical: 9,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.sm,
    alignItems: 'center',
  },
  emergencyCallBtnText: {
    ...Typography.button,
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '700',
  },
  disclaimerBottomBox: {
    padding: Spacing.md,
    backgroundColor: '#F8F9FA',
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  disclaimerBottomText: {
    ...Typography.caption,
    fontSize: 11,
    lineHeight: 16,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
});
