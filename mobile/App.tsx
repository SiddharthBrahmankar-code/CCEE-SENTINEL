
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { View, Text } from 'react-native';

import { DashboardScreen } from './src/screens/DashboardScreen';
import { NotesScreen } from './src/screens/NotesScreen';
import { MockScreen } from './src/screens/MockScreen';
import { FlashcardScreen } from './src/screens/FlashcardScreen';
import { ChatScreen } from './src/screens/ChatScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            headerShown: false, // We use custom headers in screens
            tabBarStyle: { 
                backgroundColor: '#0a0a1a', 
                borderTopColor: '#333', 
                height: 60,
                paddingBottom: 10 
            },
            tabBarActiveTintColor: '#00f0ff',
            tabBarInactiveTintColor: '#64748b',
            tabBarLabelStyle: { fontSize: 12 }
          }}
        >
           <Tab.Screen 
              name="Dashboard" 
              component={DashboardScreen} 
              options={{
                 tabBarIcon: ({ color, size }) => <Feather name="layout" size={size} color={color} />
              }}
           />
           <Tab.Screen 
              name="Notes" 
              component={NotesScreen} 
              options={{
                 tabBarIcon: ({ color, size }) => <Feather name="book-open" size={size} color={color} />
              }}
           />
           <Tab.Screen 
              name="Flash" 
              component={FlashcardScreen} 
              options={{
                 tabBarIcon: ({ color, size }) => <Feather name="zap" size={size} color={color} />
              }}
           />
           <Tab.Screen 
              name="Chat" 
              component={ChatScreen} 
              options={{
                 tabBarIcon: ({ color, size }) => <Feather name="message-square" size={size} color={color} />
              }}
           />
           <Tab.Screen 
              name="Mock" 
              component={MockScreen} 
              options={{
                 tabBarIcon: ({ color, size }) => <Feather name="target" size={size} color={color} />
              }}
           />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
