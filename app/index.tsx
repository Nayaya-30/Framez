import { Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

export default function Index() {
  const { session, loading } = useAuth();
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      const value = await AsyncStorage.getItem('onboardingComplete');
      setOnboardingComplete(!!value);
    };

    checkOnboardingStatus();
  }, []);

  if (loading || onboardingComplete === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  // If onboarding not complete, redirect to onboarding
  if (!onboardingComplete) {
    return <Redirect href="/onboarding1" />;
  }

  // If user is logged in, redirect to main app
  if (session) {
    return <Redirect href="/(tabs)" />;
  }

  // Otherwise, redirect to login
  return <Redirect href="/(auth)/login" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});