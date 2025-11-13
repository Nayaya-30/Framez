import React,{createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  session: Session | null;
  user: User | null;
 loading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  createProfile: (user: User, username?:string) => Promise<void>; // Add this line
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

 useEffect(()=> {
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
// First check if profile alreadyexists
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('id,username')
        .eq('id', user.id)
        .maybeSingle();

      console.log('Profile fetch result:', {existingProfile, fetchError });
      
// If there was an error other than "not found", log it
      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching profile:', fetchError);
      }

      // If profile doesn't exist, create it
if (!existingProfile) {
// Generate a unique username if the one from metadata already exists
        const baseUsername = user.user_metadata?.username || user.email?.split('@')[0] || 'user';
        let username = baseUsername;
        let counter = 1;
        
        while (true) {
try {
const profileData = {
              id: user.id,
              username: username,
              avatar_url: user.user_metadata?.avatar_url || null
            };
            
            console.log('Attempting to create profile with data:', profileData);

            // Try to insert the profile
            const { error: insertError} = await supabase
             .from('profiles')
              .insert(profileData);
              
            if (insertError) {
              if (insertError.code === '23505') { // Unique violation
                console.log(`Username ${username} already exists, trying another`);
                username = `${baseUsername}_${counter}`;
counter++;
               continue;
              } else {
                throw insertError;
              }
            }
            
            console.log('Profile created successfully with username:', username);
            break;
          } catch (insertError) {
            console.error('Error inserting profile:', insertError);
            throw insertError;
          }
}
      } else{
        console.log('Profile already exists with username:', existingProfile.username);
      }
    } catch (error) {
      console.error('Error in ensureProfileExists:', error);
      // Even if we can't create a profile, don't break the signup process
    }
  };

 const signUp = async (email: string, password: string, username: string) =>{
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
console.log('Supabase signupresult:', { error, data });
    
    // Evenif there's an error with automatic profile creation,
    // we still want to ensure the user has a profile
    if (data.user) {
      console.log('Signup successful,ensuring profile for user:', data.user);
      setTimeout(() => {
        ensureProfileExists(data.user!);
      }, 1000); // Delay to allow trigger to execute
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

 //Manualprofile creation function
  const createProfile = async (user: User, username?: string) => {
    try{
      const profileData = {
        id: user.id,
        username: username || user.email?.split('@')[0] || 'user',
        avatar_url: user.user_metadata?.avatar_url || null};

      console.log('Manually creating profile with data:', profileData);

      const { error } = await supabase
        .from('profiles')
        .insert(profileData);

      if (error) {
        console.error('Error creating profile manually:', error);
        throw error;
      }

      console.log('Profile created manually successfully');
    } catch (error) {
      console.error('Error in createProfile:', error);
throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signUp, signIn, signOut, createProfile }}>
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