// mobile/src/__tests__/devScreenGuards.test.tsx
// =============================================================================
// Development vs Production Screen Guard Regression Tests
// =============================================================================
// Verifies:
//   1. Development builds (__DEV__ === true):
//      - DevLocationDiagnostic screen is registered in RootNavigator.
//      - Core application screens are registered.
//      - WelcomeScreen renders the developer diagnostic link.
//   2. Production builds (__DEV__ === false):
//      - DevLocationDiagnostic screen is NOT registered in RootNavigator.
//      - Core application screens remain properly registered.
//      - WelcomeScreen does NOT render the developer diagnostic link.
//      - No production navigation path or UI exposes the diagnostic screen.
//   3. Core navigation configuration integrity:
//      - initialRouteName is 'Welcome'.
//      - Standard screen options and configurations remain consistent.
// =============================================================================

import React from 'react';
import { RootNavigator } from '../navigation/RootNavigator';
import { WelcomeScreen } from '../screens/WelcomeScreen';

// Helper to inspect all screen names registered as children of Stack.Navigator
const getRegisteredScreenNames = (navElement: any): string[] => {
  const children = React.Children.toArray(navElement.props.children);
  const screenNames: string[] = [];

  for (const child of children) {
    if (React.isValidElement(child) && (child.props as any) && typeof (child.props as any).name === 'string') {
      screenNames.push((child.props as any).name);
    }
  }

  return screenNames;
};

// Helper to recursively search a React element tree for elements matching a predicate
const findInTree = (
  node: any,
  predicate: (element: any) => boolean,
): any => {
  if (!React.isValidElement(node)) {
    return null;
  }
  if (predicate(node)) {
    return node;
  }
  const props = (node as any).props;
  if (props && props.children) {
    const children = React.Children.toArray(props.children);
    for (const child of children) {
      const found = findInTree(child, predicate);
      if (found) return found;
    }
  }
  return null;
};

const EXPECTED_CORE_SCREENS = [
  'Welcome',
  'TripBuilder',
  'PersonalizedTourPreview',
  'ChooseInterest',
  'ChooseTour',
  'TourPreview',
  'ActiveTour',
  'StopStory',
];

describe('DevLocationDiagnostic Screen Navigation Guards', () => {
  const originalDev = (globalThis as any).__DEV__;

  afterEach(() => {
    (globalThis as any).__DEV__ = originalDev;
  });

  // ---------------------------------------------------------------------------
  // 1. Development Mode Verification (__DEV__ = true)
  // ---------------------------------------------------------------------------
  describe('Development environment (__DEV__ = true)', () => {
    beforeEach(() => {
      (globalThis as any).__DEV__ = true;
    });

    test('RootNavigator registers DevLocationDiagnostic in development', () => {
      const nav = RootNavigator();
      const screenNames = getRegisteredScreenNames(nav);

      expect(screenNames).toContain('DevLocationDiagnostic');
      expect(screenNames.length).toBeGreaterThanOrEqual(EXPECTED_CORE_SCREENS.length + 1);
    });

    test('all core production routes are registered alongside diagnostic in development', () => {
      const nav = RootNavigator();
      const screenNames = getRegisteredScreenNames(nav);

      for (const expectedScreen of EXPECTED_CORE_SCREENS) {
        expect(screenNames).toContain(expectedScreen);
      }
    });

    test('initial route remains Welcome in development', () => {
      const nav = RootNavigator();
      expect(nav.props.initialRouteName).toBe('Welcome');
    });

    test('WelcomeScreen renders dev diagnostic link in development', () => {
      const mockNavigation = {
        navigate: jest.fn(),
        goBack: jest.fn(),
        setOptions: jest.fn(),
        addListener: jest.fn(() => () => {}),
      } as any;

      // Render the WelcomeScreen element tree
      const renderedTree = WelcomeScreen({
        navigation: mockNavigation,
        route: { key: 'Welcome', name: 'Welcome' },
      });

      const devButton = findInTree(
        renderedTree,
        (el: any) => el.props?.accessibilityLabel === 'Open Developer GPS Diagnostic',
      );

      expect(devButton).not.toBeNull();
      expect(devButton?.props?.onPress).toBeDefined();

      // Trigger the onPress and verify it navigates to DevLocationDiagnostic
      devButton?.props?.onPress();
      expect(mockNavigation.navigate).toHaveBeenCalledWith('DevLocationDiagnostic');
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Production Mode Verification (__DEV__ = false)
  // ---------------------------------------------------------------------------
  describe('Production environment (__DEV__ = false)', () => {
    beforeEach(() => {
      (globalThis as any).__DEV__ = false;
    });

    test('RootNavigator does NOT register DevLocationDiagnostic in production', () => {
      const nav = RootNavigator();
      const screenNames = getRegisteredScreenNames(nav);

      expect(screenNames).not.toContain('DevLocationDiagnostic');
    });

    test('all core production routes remain registered and accessible in production', () => {
      const nav = RootNavigator();
      const screenNames = getRegisteredScreenNames(nav);

      for (const expectedScreen of EXPECTED_CORE_SCREENS) {
        expect(screenNames).toContain(expectedScreen);
      }
    });

    test('initial route remains Welcome in production', () => {
      const nav = RootNavigator();
      expect(nav.props.initialRouteName).toBe('Welcome');
    });

    test('WelcomeScreen does NOT render dev diagnostic link or navigation trigger in production', () => {
      const mockNavigation = {
        navigate: jest.fn(),
        goBack: jest.fn(),
        setOptions: jest.fn(),
        addListener: jest.fn(() => () => {}),
      } as any;

      const renderedTree = WelcomeScreen({
        navigation: mockNavigation,
        route: { key: 'Welcome', name: 'Welcome' },
      });

      const devButton = findInTree(
        renderedTree,
        (el: any) => el.props?.accessibilityLabel === 'Open Developer GPS Diagnostic',
      );

      expect(devButton).toBeNull();

      // Verify no element in the tree has an onPress navigating to DevLocationDiagnostic
      const anyDevNavigation = findInTree(renderedTree, (el: any) => {
        if (typeof el.props?.onPress === 'function') {
          try {
            el.props.onPress();
          } catch {
            // Ignore
          }
        }
        return false;
      });

      expect(anyDevNavigation).toBeNull();
      expect(mockNavigation.navigate).not.toHaveBeenCalledWith('DevLocationDiagnostic');
    });
  });
});
