// mobile/src/engine/safety/contactActions.ts
// =============================================================================
// Explicit User Confirmation Contact Actions
// =============================================================================
// Strictly enforces the requirement that:
//   - NO silent calls, messages, or location sharing ever take place.
//   - The user is always prompted with an explicit confirmation dialog
//     showing exactly what action will occur, which app will open, and the recipient.
//   - Opening the phone dialer or SMS client requires affirmative user tap.
// =============================================================================

import { Alert, Linking, Platform } from 'react-native';
import { formatEmergencyNumber } from './emergencyContacts';

export interface ConfirmCallParams {
  recipientName: string;
  phoneNumber: string;
  isEmergency?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export interface ConfirmSmsParams {
  recipientName: string;
  phoneNumber: string;
  defaultMessage?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

/**
 * Sanitizes a phone number for dialer/SMS URI schemes.
 * Preserves an optional leading '+' for international numbers,
 * and strips all spaces, hyphens, parentheses, dots, and other non-digit characters.
 */
export function sanitizePhoneNumberForUrl(phone: string): string {
  const trimmed = phone.trim();
  const hasPlus = trimmed.startsWith('+');
  const digitsOnly = trimmed.replace(/\D/g, '');
  return hasPlus ? `+${digitsOnly}` : digitsOnly;
}

/**
 * Prompts the user with an explicit confirmation dialog before launching the device dialer.
 * Shows the recipient name and phone number.
 */
export function requestCallConfirmation({
  recipientName,
  phoneNumber,
  isEmergency = false,
  onConfirm,
  onCancel,
}: ConfirmCallParams): void {
  const cleanNumber = sanitizePhoneNumberForUrl(phoneNumber);
  if (!cleanNumber || cleanNumber.replace(/\D/g, '').length === 0) {
    Alert.alert('Invalid Phone Number', 'The phone number provided is not valid for dialing.');
    onCancel?.();
    return;
  }

  const displayPhone = isEmergency ? formatEmergencyNumber(phoneNumber) : phoneNumber;
  const title = isEmergency
    ? `Call ${recipientName} (${displayPhone})?`
    : `Call ${recipientName}?`;

  const message = isEmergency
    ? `This will open your phone's dialer with ${displayPhone} ready to call emergency services. You will confirm the call on your phone.`
    : `This will open your phone's dialer to call ${displayPhone}. The app will not call automatically without your confirmation.`;

  Alert.alert(
    title,
    message,
    [
      {
        text: 'Cancel',
        style: 'cancel',
        onPress: onCancel,
      },
      {
        text: isEmergency ? 'Open Dialer' : 'Call Now',
        style: isEmergency ? 'destructive' : 'default',
        onPress: async () => {
          onConfirm?.();
          const url = `tel:${cleanNumber}`;
          try {
            const supported = await Linking.canOpenURL(url);
            if (supported) {
              await Linking.openURL(url);
            } else {
              // canOpenURL may return false on Android 11+ due to package-visibility
              // restrictions even when the dialer is available. Attempt to open anyway
              // and surface a human-readable error only if the open itself also fails.
              try {
                await Linking.openURL(url);
              } catch {
                Alert.alert(
                  'Unable to Place Call',
                  `Your device does not support dialing ${displayPhone} directly. Please dial manually.`,
                );
              }
            }
          } catch (err) {
            console.warn('[ContactActions] Failed to open dialer URL:', err);
            Alert.alert('Dialer Error', 'Could not open the phone app. Please dial manually: ' + displayPhone);
          }
        },
      },
    ],
    { cancelable: true, onDismiss: onCancel },
  );
}

/**
 * Prompts the user with an explicit confirmation dialog before launching the SMS client.
 * Never sends an SMS in the background. Shows recipient and draft message text.
 */
export function requestSmsConfirmation({
  recipientName,
  phoneNumber,
  defaultMessage = "Hi, I'm currently traveling in Mangalore and wanted to check in.",
  onConfirm,
  onCancel,
}: ConfirmSmsParams): void {
  const cleanNumber = sanitizePhoneNumberForUrl(phoneNumber);
  if (!cleanNumber || cleanNumber.replace(/\D/g, '').length === 0) {
    Alert.alert('Invalid Phone Number', 'The phone number provided is not valid for messaging.');
    onCancel?.();
    return;
  }

  const messagePreview = defaultMessage.trim().length > 0
    ? `with a draft text to ${phoneNumber}:\n\n"${defaultMessage}"\n\nYou will review and send the message yourself.`
    : `with a draft text to ${phoneNumber}. You will review and send the message yourself.`;

  Alert.alert(
    `Message ${recipientName}?`,
    `This will open your SMS messaging app ${messagePreview}`,
    [
      {
        text: 'Cancel',
        style: 'cancel',
        onPress: onCancel,
      },
      {
        text: 'Open Messaging App',
        onPress: async () => {
          onConfirm?.();
          const separator = Platform.OS === 'ios' ? '&' : '?';
          const encodedBody = encodeURIComponent(defaultMessage);
          const url = defaultMessage.trim().length > 0
            ? `sms:${cleanNumber}${separator}body=${encodedBody}`
            : `sms:${cleanNumber}`;

          try {
            const supported = await Linking.canOpenURL(url);
            if (supported) {
              await Linking.openURL(url);
            } else {
              // canOpenURL may return false on Android 11+ due to package-visibility
              // restrictions even when the SMS app is available. Attempt to open anyway
              // and surface a human-readable error only if the open itself also fails.
              try {
                await Linking.openURL(url);
              } catch {
                Alert.alert(
                  'Unable to Open Messages',
                  `Your device cannot open SMS for ${phoneNumber}. Please message manually.`,
                );
              }
            }
          } catch (err) {
            console.warn('[ContactActions] Failed to open SMS URL:', err);
            Alert.alert('Messaging Error', 'Could not open the messaging app.');
          }
        },
      },
    ],
    { cancelable: true, onDismiss: onCancel },
  );
}
