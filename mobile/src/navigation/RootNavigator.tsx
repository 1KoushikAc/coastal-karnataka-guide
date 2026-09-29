// src/navigation/RootNavigator.tsx
// The single stack navigator. Add new screens here as milestones are completed.

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { Colors } from '../theme';
import type { RootStackParamList } from './types';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { ChooseInterestScreen } from '../screens/ChooseInterestScreen';
import { ChooseTourScreen } from '../screens/ChooseTourScreen';
import { TourPreviewScreen } from '../screens/TourPreviewScreen';
import { ActiveTourScreen } from '../screens/ActiveTourScreen';
import { DevLocationDiagnosticScreen } from '../screens/DevLocationDiagnosticScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator(): React.JSX.Element {
  return (
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{
        headerStyle: { backgroundColor: Colors.ocean },
        headerTintColor: Colors.white,
        headerTitleStyle: { fontWeight: '600', fontSize: 17 },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: Colors.sandLight },
      }}
    >
      <Stack.Screen
        name="Welcome"
        component={WelcomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ChooseInterest"
        component={ChooseInterestScreen}
        options={{ title: 'Choose Your Interest' }}
      />
      <Stack.Screen
        name="ChooseTour"
        component={ChooseTourScreen}
        options={{ title: 'Tours' }}
      />
      <Stack.Screen
        name="TourPreview"
        component={TourPreviewScreen}
        options={{ title: 'Tour Details' }}
      />
      <Stack.Screen
        name="ActiveTour"
        component={ActiveTourScreen}
        options={{ title: 'Active Tour' }}
      />
      <Stack.Screen
        name="DevLocationDiagnostic"
        component={DevLocationDiagnosticScreen}
        options={{
          title: 'GPS Diagnostic (Dev)',
          headerStyle: { backgroundColor: '#4A3B25' },
        }}
      />
    </Stack.Navigator>
  );
}

