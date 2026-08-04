import { Tabs } from 'expo-router';
import React from 'react';

export default function TabLayout() {
  return (
    // uses our own bottom nav instead of the expo tab bar
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
      }}>
      {/* the file name index makes this the home route */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
        }}
      />
      {/* explore holds the insights screen */}
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Insights',
        }}
      />
    </Tabs>
  );
}
