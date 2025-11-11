import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const supabaseUrl = "https://ydzrckztosmhewerljys.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkenJja3p0b3NtaGV3ZXJsanlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4MTY1NTgsImV4cCI6MjA3ODM5MjU1OH0.9BhJzvHOYwZavfNiXfuw3aL9tc7erP0ajKcOO26ZJ_s";

const ExpoSecureStoreAdapter = {
	getItem: (key: string) => {
		if (Platform.OS === 'web') {
			return localStorage.getItem(key);
		}
		return SecureStore.getItemAsync(key);
	},
	setItem: (key: string, value: string) => {
		if (Platform.OS === 'web') {
			localStorage.setItem(key, value);
			return;
		}
		SecureStore.setItemAsync(key, value);
	},
	removeItem: (key: string) => {
		if (Platform.OS === 'web') {
			localStorage.removeItem(key);
			return;
		}
		SecureStore.deleteItemAsync(key);
	},
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
	auth: {
		storage: ExpoSecureStoreAdapter as any,
		autoRefreshToken: true,
		persistSession: true,
		detectSessionInUrl: false,
	},
});
