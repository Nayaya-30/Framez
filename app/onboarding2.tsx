import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function OnboardingScreen2() {
  const handleSkip = async () => {
    // Mark onboarding as complete
    await AsyncStorage.setItem('onboardingComplete', 'true');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Discover Amazing Content</Text>
        <Text style={styles.subtitle}>Browse thousands of creative posts from users around the globe</Text>
        <View style={styles.imageContainer}>
          <Image 
            source={require('@/assets/images/frame.png')} 
            style={styles.image}
          />
        </View>
      </View>
      
      <View style={styles.footer}>
        <Link href="/onboarding3" asChild>
          <TouchableOpacity style={styles.nextButton}>
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        </Link>
        
        <Link href="/(auth)/login" asChild>
          <TouchableOpacity onPress={handleSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 50,
    paddingHorizontal: 20,
  },
  imageContainer: {
    width: '100%',
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '80%',
    height: '80%',
    borderRadius: 20,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  nextButton: {
    backgroundColor: '#0095F6',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 30,
    marginBottom: 20,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  skipText: {
    color: '#666',
    fontSize: 16,
  },
});