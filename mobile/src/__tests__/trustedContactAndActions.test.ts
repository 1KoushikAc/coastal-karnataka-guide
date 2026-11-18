// mobile/src/__tests__/trustedContactAndActions.test.ts
// =============================================================================
// Trusted Contact Storage & Explicit Confirmation Actions Tests
// =============================================================================
// Verifies:
//   1. Local AsyncStorage management for trusted contact (save, load, clear).
//   2. Phone number validation (Indian numbers, STD landlines, international format).
//   3. Missing trusted contact handling: returns null gracefully without blocking app.
//   4. Explicit user confirmation: NO calls or SMS are ever placed silently.
//      Both requestCallConfirmation and requestSmsConfirmation display clear
//      Alert dialogs showing recipient details and action implications.
// =============================================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Linking } from 'react-native';
import {
  saveTrustedContact,
  loadTrustedContact,
  clearTrustedContact,
  validatePhoneNumber,
  isValidTrustedContact,
} from '../engine/safety/trustedContactStorage';
import {
  requestCallConfirmation,
  requestSmsConfirmation,
  sanitizePhoneNumberForUrl,
} from '../engine/safety/contactActions';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

describe('Trusted Contact Storage & Explicit Action Confirmation', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // 1. Phone Number Validation & URL Sanitization
  // ---------------------------------------------------------------------------
  describe('Phone Number Validation & URL Sanitization', () => {
    test('accepts valid 10-digit mobile numbers', () => {
      expect(validatePhoneNumber('9876543210').valid).toBe(true);
      expect(validatePhoneNumber(' 9876543210 ').valid).toBe(true);
    });

    test('accepts valid numbers with + country code and spaces/dashes', () => {
      expect(validatePhoneNumber('+91 98765 43210').valid).toBe(true);
      expect(validatePhoneNumber('+91-824-2220800').valid).toBe(true);
      expect(validatePhoneNumber('(0824) 2220800').valid).toBe(true);
    });

    test('rejects empty, non-digit or too short inputs', () => {
      expect(validatePhoneNumber('').valid).toBe(false);
      expect(validatePhoneNumber('   ').valid).toBe(false);
      expect(validatePhoneNumber('12345').valid).toBe(false);
      expect(validatePhoneNumber('not-a-number').valid).toBe(false);
    });

    test('sanitizePhoneNumberForUrl strips parentheses, spaces, hyphens and dots', () => {
      expect(sanitizePhoneNumberForUrl('(0824) 2220800')).toBe('08242220800');
      expect(sanitizePhoneNumberForUrl('+91 (824) 222-0800')).toBe('+918242220800');
      expect(sanitizePhoneNumberForUrl('0824.222.0800')).toBe('08242220800');
      expect(sanitizePhoneNumberForUrl('  +91 98765 43210  ')).toBe('+919876543210');
      expect(sanitizePhoneNumberForUrl('abc')).toBe('');
      expect(sanitizePhoneNumberForUrl('')).toBe('');
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Trusted Contact Storage
  // ---------------------------------------------------------------------------
  describe('Trusted Contact Storage Lifecycle', () => {
    test('returns null when no trusted contact is saved', async () => {
      const contact = await loadTrustedContact();
      expect(contact).toBeNull();
    });

    test('saves and loads a valid trusted contact', async () => {
      const newContact = {
        name: 'Anita Rao',
        phoneNumber: '+91 98765 43210',
        relationship: 'Sister',
      };

      await saveTrustedContact(newContact);

      const loaded = await loadTrustedContact();
      expect(loaded).not.toBeNull();
      expect(loaded?.name).toBe('Anita Rao');
      expect(loaded?.phoneNumber).toBe('+91 98765 43210');
      expect(loaded?.relationship).toBe('Sister');
    });

    test('throws error when saving contact with invalid phone or empty name', async () => {
      await expect(
        saveTrustedContact({
          name: '',
          phoneNumber: '9876543210',
        }),
      ).rejects.toThrow('Contact name is required');

      await expect(
        saveTrustedContact({
          name: 'Praveen',
          phoneNumber: 'invalid-phone',
        }),
      ).rejects.toThrow();
    });

    test('clears trusted contact cleanly from storage', async () => {
      await saveTrustedContact({
        name: 'Hotel Deepa Comforts Front Desk',
        phoneNumber: '08242497101',
      });

      expect(await loadTrustedContact()).not.toBeNull();

      await clearTrustedContact();
      expect(await loadTrustedContact()).toBeNull();
    });

    test('clearTrustedContact propagates storage rejection', async () => {
      jest.spyOn(AsyncStorage, 'removeItem').mockRejectedValueOnce(new Error('Disk I/O failure'));
      await expect(clearTrustedContact()).rejects.toThrow('Disk I/O failure');
    });

    test('gracefully ignores corrupted stored JSON', async () => {
      await AsyncStorage.setItem(
        '@coastal_karnataka/trusted_contact_v1',
        '{ invalid json string',
      );
      const contact = await loadTrustedContact();
      expect(contact).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Explicit User Confirmation on Actions
  // ---------------------------------------------------------------------------
  describe('Explicit Confirmation for Contact Actions', () => {
    let alertSpy: jest.SpyInstance;

    beforeEach(() => {
      alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    });

    afterEach(() => {
      alertSpy.mockRestore();
    });

    test('requestCallConfirmation prompts user with explicit confirmation dialog', () => {
      const onConfirm = jest.fn();
      const onCancel = jest.fn();

      requestCallConfirmation({
        recipientName: 'Anita',
        phoneNumber: '9876543210',
        onConfirm,
        onCancel,
      });

      // Verify Alert was shown with recipient name and phone number
      expect(alertSpy).toHaveBeenCalledTimes(1);
      const [title, message, buttons, options] = alertSpy.mock.calls[0];

      expect(title).toBe('Call Anita?');
      expect(message).toContain('9876543210');
      expect(message).toContain('phone\'s dialer');
      expect(message).toContain('not call automatically');

      // Verify buttons have Cancel and Call Now
      expect(buttons).toHaveLength(2);
      expect(buttons[0].text).toBe('Cancel');
      expect(buttons[1].text).toBe('Call Now');

      // Verify Android onDismiss triggers onCancel
      expect(options).toBeDefined();
      expect(options.cancelable).toBe(true);
      expect(typeof options.onDismiss).toBe('function');
      options.onDismiss();
      expect(onCancel).toHaveBeenCalledTimes(1);

      // Test cancel button
      buttons[0].onPress();
      expect(onCancel).toHaveBeenCalledTimes(2);
      expect(onConfirm).not.toHaveBeenCalled();

      // Test confirm button
      buttons[1].onPress();
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    test('requestCallConfirmation format for emergency helplines formats landlines', () => {
      const onConfirm = jest.fn();

      requestCallConfirmation({
        recipientName: 'Mangaluru City Police Control Room',
        phoneNumber: '08242220800',
        isEmergency: true,
        onConfirm,
      });

      expect(alertSpy).toHaveBeenCalledTimes(1);
      const [title, message, buttons] = alertSpy.mock.calls[0];

      expect(title).toContain('0824-2220800');
      expect(message).toContain('0824-2220800');
      expect(message).toContain('emergency services');
      expect(buttons[1].text).toBe('Open Dialer');
      expect(buttons[1].style).toBe('destructive');
    });

    test('requestCallConfirmation rejects invalid or empty phone numbers', () => {
      const onCancel = jest.fn();

      requestCallConfirmation({
        recipientName: 'Unknown',
        phoneNumber: 'invalid-non-digits',
        onCancel,
      });

      expect(alertSpy).toHaveBeenCalledTimes(1);
      const [title, message] = alertSpy.mock.calls[0];
      expect(title).toBe('Invalid Phone Number');
      expect(message).toContain('not valid for dialing');
      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    test('requestCallConfirmation strips parentheses when opening tel URL', async () => {
      const canOpenSpy = jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);
      const openSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined as any);

      requestCallConfirmation({
        recipientName: 'Hotel Desk',
        phoneNumber: '(0824) 2220800',
      });

      const buttons = alertSpy.mock.calls[0][2];
      await buttons[1].onPress();

      expect(canOpenSpy).toHaveBeenCalledWith('tel:08242220800');
      expect(openSpy).toHaveBeenCalledWith('tel:08242220800');
    });

    test('requestSmsConfirmation prompts user before opening messaging app and previews message', () => {
      const onConfirm = jest.fn();
      const onCancel = jest.fn();

      requestSmsConfirmation({
        recipientName: 'Anita',
        phoneNumber: '9876543210',
        defaultMessage: 'Checking in from Kadri Temple',
        onConfirm,
        onCancel,
      });

      expect(alertSpy).toHaveBeenCalledTimes(1);
      const [title, message, buttons, options] = alertSpy.mock.calls[0];

      expect(title).toBe('Message Anita?');
      expect(message).toContain('SMS messaging app');
      expect(message).toContain('review and send');
      expect(message).toContain('9876543210');
      expect(message).toContain('Checking in from Kadri Temple');

      expect(buttons).toHaveLength(2);
      expect(buttons[0].text).toBe('Cancel');
      expect(buttons[1].text).toBe('Open Messaging App');

      // Verify Android onDismiss triggers onCancel
      expect(options.cancelable).toBe(true);
      options.onDismiss();
      expect(onCancel).toHaveBeenCalledTimes(1);

      // Clicking Open Messaging App triggers onConfirm
      buttons[1].onPress();
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    test('requestSmsConfirmation rejects invalid or empty phone numbers', () => {
      const onCancel = jest.fn();

      requestSmsConfirmation({
        recipientName: 'Unknown',
        phoneNumber: '',
        onCancel,
      });

      expect(alertSpy).toHaveBeenCalledTimes(1);
      const [title, message] = alertSpy.mock.calls[0];
      expect(title).toBe('Invalid Phone Number');
      expect(message).toContain('not valid for messaging');
      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    test('requestSmsConfirmation strips parentheses and constructs clean sms URL', async () => {
      const canOpenSpy = jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);
      const openSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined as any);

      requestSmsConfirmation({
        recipientName: 'Hotel Desk',
        phoneNumber: '(0824) 222-0800',
        defaultMessage: 'Checking in',
      });

      const buttons = alertSpy.mock.calls[0][2];
      await buttons[1].onPress();

      expect(canOpenSpy).toHaveBeenCalledWith(expect.stringContaining('sms:08242220800'));
      expect(openSpy).toHaveBeenCalledWith(expect.stringContaining('sms:08242220800'));
      expect(openSpy).toHaveBeenCalledWith(expect.stringContaining('body=Checking%20in'));
    });

    test('handles device without dialer support gracefully with manual dial alert', async () => {
      jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(false);
      jest.spyOn(Linking, 'openURL').mockRejectedValue(new Error('No dialer installed'));

      requestCallConfirmation({
        recipientName: 'Hotel Desk',
        phoneNumber: '08242220800',
      });

      const buttons = alertSpy.mock.calls[0][2];
      await buttons[1].onPress();

      // Check fallback alert is presented
      expect(alertSpy).toHaveBeenCalledTimes(2);
      const [errTitle, errMsg] = alertSpy.mock.calls[1];
      expect(errTitle).toBe('Unable to Place Call');
      expect(errMsg).toContain('08242220800');
    });
  });
});
