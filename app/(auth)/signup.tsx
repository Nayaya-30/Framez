import{ useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ImageBackground } from 'react-native'
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export default function SignUp() {
  const [email,setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signUp } = useAuth();
  const router = useRouter();

  const handleSignUp= async () => {
    if (!email || !username || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');

const { error } = await signUp(email, password, username);

    if (error) {
      setError(error.message);
      setLoading(false);
    } 
// User will be automatically redirected to the main app after signup
    // due to the auth state change listener in AuthContext
  };

return (
    <ImageBackground 
      source={{ uri: 'https://images.unsplash.com/photo-1515537163457-a4d3cefab7c8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1746&q=80' }} 
      style={styles.container}
      resizeMode="cover"
>
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.contentContainer}
        >
          <View style={styles.content}>
            <Text style={styles.logo}>Framez</Text>

           <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholderTextColor="#ccc"
              />

              <TextInput
                style={styles.input}
               placeholder="Username"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                placeholderTextColor="#ccc"
              />

              <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholderTextColor="#ccc"
              />

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleSignUp}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? 'Creating account...' : 'Sign Up'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                <Text style={styles.loginLink}>Log in</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 10, 10, 0.8)',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  content: {
    justifyContent: 'center',
    padding: 20,
  },
 logo: {
    fontSize: 48,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 50,
    color: '#fff',
    textShadowColor: 'rgba(138, 43, 226, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    fontFamily: Platform.select({ ios: 'Helvetica Neue', android: 'sans-serif' }),
  },
  form: {
    gap: 15,
  },
  input: {
    backgroundColor: 'rgba(250, 250, 250, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(51, 51, 51, 0.3)',
    borderRadius: 10,
    padding: 15,
    fontSize: 14,
    color: '#000',
    shadowColor: '#8a2be2',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
},
  button: {
    backgroundColor: 'rgba(138, 43, 226, 0.9)',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#8a2be2',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  error: {
    color: '#FF6B6B',
    fontSize: 14,
    textAlign: 'center',
    backgroundColor: 'rgba(255, 107,107, 0.2)',
    padding: 10,
    borderRadius: 5,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
  },
  footerText: {
    color: '#ddd',
    fontSize: 14,
  },
  loginLink: {
    color: '#8a2be2',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});