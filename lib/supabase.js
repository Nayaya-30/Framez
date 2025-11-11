"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabase = void 0;
require("react-native-url-polyfill/auto");
var supabase_js_1 = require("@supabase/supabase-js");
var SecureStore = require("expo-secure-store");
var react_native_1 = require("react-native");
var supabaseUrl = "https://ydzrckztosmhewerljys.supabase.co";
var supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkenJja3p0b3NtaGV3ZXJsanlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4MTY1NTgsImV4cCI6MjA3ODM5MjU1OH0.9BhJzvHOYwZavfNiXfuw3aL9tc7erP0ajKcOO26ZJ_s";
var ExpoSecureStoreAdapter = {
    getItem: function (key) {
        if (react_native_1.Platform.OS === 'web') {
            return localStorage.getItem(key);
        }
        return SecureStore.getItemAsync(key);
    },
    setItem: function (key, value) {
        if (react_native_1.Platform.OS === 'web') {
            localStorage.setItem(key, value);
            return;
        }
        SecureStore.setItemAsync(key, value);
    },
    removeItem: function (key) {
        if (react_native_1.Platform.OS === 'web') {
            localStorage.removeItem(key);
            return;
        }
        SecureStore.deleteItemAsync(key);
    },
};
exports.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: ExpoSecureStoreAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});
