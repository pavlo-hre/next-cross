'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@/types/models';
import { addToast } from '@heroui/toast';
import supabaseClient from '@/app/lib/supabaseClient';
import { getProjectUser } from '@/app/lib/getProjectUser';

export type Project = "EA" | "ECHO" | "NORWAY" | "BHA";

const AuthContext = createContext<any>(null);

export function AuthProvider({children}: { children: React.ReactNode }) {
  // State
  const [session, setSession] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userProject, setUserProject] = useState<Project | null>(null);

  // Helper functions
  const clearError = () => setError(null);


  const updateSessionState = async (newSession: any) => {
    setSession(newSession);
    setUser(newSession?.user || null);
    setIsLoggedIn(!!newSession);
    setIsLoading(false);
  };

  // Auth methods
  const signOut = async () => {
    try {
      await supabaseClient.auth.signOut();
      setSession(null);
      setIsLoggedIn(false);
      window.localStorage.removeItem('supabase.auth.token');
    } catch (error: any) {
      setError(error.message);
      console.error('Error signing out:', error);
    }
  };

  const checkUserPermissions = async (email: string) => {
    const data = await getProjectUser(email);
    if(data?.length){
      setUserProject(data?.at(0)!.project);
      return true;
    }
    return false;
  }


  const handleGoogleLogin = async () => {
    try {
      await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}`,
        },
      });
    } catch (error: any) {
      setError(error.message);
      console.error('Error with Google login:', error);
    }
  };


  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        const {
          data: {session},
        } = await supabaseClient.auth.getSession();
        const userEmail = session?.user?.email;
        if (!userEmail) {
          await signOut();
          return;
        }
        const isLoginAllowed = await checkUserPermissions(userEmail);
        if (isLoginAllowed) {
          await updateSessionState(session);
        } else {
          addToast({
            title: 'Доступ не надано!',
            description: 'Зверніться до адміністратора',
            color: 'danger',
            timeout: 1000 * 120,
          });
          await signOut();
        }
      } catch (error: any) {
        console.error('Error initializing auth:', error);
        setError(error.message);
        await signOut();
      }
    };

    initAuth();

    const {
      data: {subscription},
    } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      updateSessionState(session);
    });

    return () => subscription.unsubscribe();
  }, []);


  return (
    <AuthContext.Provider value={{
      // State
      session,
      isLoggedIn,
      isLoading,
      error,
      user,
      userProject,

      // Operations
      signOut,
      handleGoogleLogin,
      clearError,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
