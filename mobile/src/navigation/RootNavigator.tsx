// src/navigation/RootNavigator.tsx
// The single stack navigator. Add new screens here as milestones are completed.

import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { Colors } from '../theme';
import type { RootStackParamList } from './types';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { TripBuilderScreen } from '../screens/TripBuilderScreen';
import { PersonalizedTourPreviewScreen } from '../screens/PersonalizedTourPreviewScreen';
import { ChooseInterestScreen } from '../screens/ChooseInterestScreen';
import { ChooseTourScreen } from '../screens/ChooseTourScreen';
import { TourPreviewScreen } from '../screens/TourPreviewScreen';
import { ActiveTourScreen } from '../screens/ActiveTourScreen';
import { StopStoryScreen } from '../screens/StopStoryScreen';
import { DevLocationDiagnosticScreen } from '../screens/DevLocationDiagnosticScreen';
import { QuickHelpScreen } from '../screens/QuickHelpScreen';

function QuickHelpHeaderButton({ onPress }: { onPress: () => void }): React.JSX.Element {
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Open Quick Help"
      style={{
        paddingHorizontal: 10,
        paddingVertical: 5,
        backgroundColor: 'rgba(255, 255, 255, 0.16)',
        borderRadius: 14,
      }}
      activeOpacity={0.7}
    >
      <Text style={{ color: Colors.white, fontSize: 12, fontWeight: '600' }}>
        Quick Help
      </Text>
    </TouchableOpacity>
  );
}

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
        name="TripBuilder"
        component={TripBuilderScreen}
        options={({ navigation }) => ({
          title: 'Build My Own Guide',
          headerRight: () => (
            <QuickHelpHeaderButton onPress={() => navigation.navigate('QuickHelp', { source: 'destination' })} />
          ),
        })}
      />
      <Stack.Screen
        name="PersonalizedTourPreview"
        component={PersonalizedTourPreviewScreen}
        options={({ navigation }) => ({
          title: 'Your Custom Itinerary',
          headerRight: () => (
            <QuickHelpHeaderButton onPress={() => navigation.navigate('QuickHelp', { source: 'destination' })} />
          ),
        })}
      />
      <Stack.Screen
        name="ChooseInterest"
        component={ChooseInterestScreen}
        options={({ navigation }) => ({
          title: 'Choose Your Interest',
          headerRight: () => (
            <QuickHelpHeaderButton onPress={() => navigation.navigate('QuickHelp', { source: 'destination' })} />
          ),
        })}
      />
      <Stack.Screen
        name="ChooseTour"
        component={ChooseTourScreen}
        options={({ navigation }) => ({
          title: 'Tours',
          headerRight: () => (
            <QuickHelpHeaderButton onPress={() => navigation.navigate('QuickHelp', { source: 'destination' })} />
          ),
        })}
      />
      <Stack.Screen
        name="TourPreview"
        component={TourPreviewScreen}
        options={({ navigation }) => ({
          title: 'Tour Details',
          headerRight: () => (
            <QuickHelpHeaderButton onPress={() => navigation.navigate('QuickHelp', { source: 'destination' })} />
          ),
        })}
      />
      <Stack.Screen
        name="ActiveTour"
        component={ActiveTourScreen}
        options={({ navigation }) => ({
          title: 'Active Tour',
          headerRight: () => (
            <QuickHelpHeaderButton onPress={() => navigation.navigate('QuickHelp', { source: 'active_tour' })} />
          ),
        })}
      />
      <Stack.Screen
        name="StopStory"
        component={StopStoryScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="QuickHelp"
        component={QuickHelpScreen}
        options={{
          title: 'Quick Help',
        }}
      />
      {__DEV__ && (
        <Stack.Screen
          name="DevLocationDiagnostic"
          component={DevLocationDiagnosticScreen}
          options={{
            title: 'GPS Diagnostic (Dev)',
            headerStyle: { backgroundColor: '#4A3B25' },
          }}
        />
      )}
    </Stack.Navigator>
  );
}
