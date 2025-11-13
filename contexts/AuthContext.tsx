import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Ensure profile exists when we have a session
      if (session?.user) {
        ensureProfileExists(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Ensure profile exists when user logs in/signs up
      if (session?.user) {
        ensureProfileExists(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Ensure user profile exists in the database
  const ensureProfileExists = async (user: User) => {
    try {
      console.log('Checking if profile exists for user:', user.id);
      
      // First check if profile already exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      console.log('Profile fetch result:', { existingProfile, fetchError });
      
      // If there was an error other than "not found", log it
      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching profile:', fetchError);
      }

      // If profile doesn't exist, create it
      if (!existingProfile) {
        const profileData = {
          id: user.id,
          username: user.user_metadata?.username || user.email?.split('@')[0] || 'user' + Math.floor(Math.random() * 1000),
          avatar_url: user.user_metadata?.avatar_url || null
        };
        
        console.log('Profile does not exist, creating with data:', profileData);

        // Try to insert the profile
        const { error: insertError } = await supabase
          .from('profiles')
          .insert(profileData);

        if (insertError) {
          console.error('Error creating profile:', insertError);
          console.log('Profile data:', profileData);
          
          // If insert fails, try updating (in case it exists but wasn't returned due to RLS)
          console.log('Trying to update profile instead');
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              username: profileData.username
            })
            .eq('id', user.id);

          if (updateError) {
            console.error('Error updating profile:', updateError);
          } else {
            console.log('Profile updated successfully');
          }
        } else {
          console.log('Profile created successfully');
        }
      } else {
        console.log('Profile already exists');
      }
    } catch (error) {
      console.error('Error in ensureProfileExists:', error);
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    console.log('Attempting to sign up user:', { email, username });
    
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
      },
    });
    
    console.log('Supabase signup result:', { error, data });
    
    // If signup was successful, log the user in immediately
    if (!error && data.user) {
      console.log('Signup successful, creating profile for user:', data.user);
      // Create profile for the new user
      await ensureProfileExists(data.user);
    }
    
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};