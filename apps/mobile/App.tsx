/**
 * MasterLinc Mobile App
 * Healthcare on the go
 */

import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'

// Screens (to be implemented)
import HomeScreen from './src/screens/HomeScreen'
import AppointmentsScreen from './src/screens/AppointmentsScreen'
import TelehealthScreen from './src/screens/TelehealthScreen'
import PrescriptionsScreen from './src/screens/PrescriptionsScreen'

const Stack = createStackNavigator()

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Home"
        screenOptions={{
          headerStyle: { backgroundColor: '#0066cc' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' }
        }}
      >
        <Stack.Screen 
          name="Home" 
          component={HomeScreen}
          options={{ title: 'MasterLinc Health' }}
        />
        <Stack.Screen 
          name="Appointments" 
          component={AppointmentsScreen}
          options={{ title: 'My Appointments' }}
        />
        <Stack.Screen 
          name="Telehealth" 
          component={TelehealthScreen}
          options={{ title: 'Video Consultation' }}
        />
        <Stack.Screen 
          name="Prescriptions" 
          component={PrescriptionsScreen}
          options={{ title: 'My Prescriptions' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  )
}
