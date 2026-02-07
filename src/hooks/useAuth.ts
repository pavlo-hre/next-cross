import { useState, useEffect } from "react";
import { User } from "@/types/models";
import { UseAuthReturn } from "@/types/auth";
import { createBrowserClient } from "@supabase/ssr";

export function useAuth(): UseAuthReturn {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // State
  const [session, setSession] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

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
      await supabase.auth.signOut();
      setSession(null);
      setIsLoggedIn(false);
      window.localStorage.removeItem("supabase.auth.token");
    } catch (error: any) {
      setError(error.message);
      console.error("Error signing out:", error);
    }
  };


  const handleGoogleLogin = async () => {
    try {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}`,
        },
      });
    } catch (error: any) {
      setError(error.message);
      console.error("Error with Google login:", error);
    }
  };


  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        await updateSessionState(session);
      } catch (error: any) {
        console.error("Error initializing auth:", error);
        setError(error.message);
        await signOut();
      }
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      updateSessionState(session);
    });

    return () => subscription.unsubscribe();
  }, []);



  return {
    // State
    session,
    isLoggedIn,
    isLoading,
    error,
    user,

    // Operations
    signOut,
    handleGoogleLogin,
    clearError,
  } as any;
}
