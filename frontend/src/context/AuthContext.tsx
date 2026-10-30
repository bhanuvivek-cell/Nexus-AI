import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { API_BASE_URL, apiRequest } from '../lib/api';
import { UserProfile } from '../types';

export interface AuthUser {
  id: string;
  username: string;
  role?: string;
  full_name?: string;
  email?: string;
  user_metadata?: Record<string, any>;
}

interface AuthContextType {
  user: AuthUser | null;
  session: any | null;
  profile: UserProfile | null;
  loading: boolean;
  profileLoading: boolean;
  signIn: (username: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (username: string, password: string, fullName: string) => Promise<{ error: Error | null; user?: AuthUser | null; session?: any | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [profileLoading, setProfileLoading] = useState<boolean>(false);

  const fetchProfile = async (userId: string) => {
    setProfileLoading(true);
    try {
      // 1. Fetch from backend API
      const res = await apiRequest<UserProfile>(`/profiles/${userId}`);
      if (res && res.id) {
        setProfile(res);
        setProfileLoading(false);
        return;
      }
    } catch (apiErr) {
      console.debug('Backend profile fetch note:', apiErr);
    }

    // 2. Fallback to Supabase direct query if backend returned 404 or had error
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileData) {
        const { data: skillsData } = await supabase
          .from('profile_skills')
          .select('proficiency, is_learning_goal, skills(id, name, category)')
          .eq('profile_id', userId);

        const formattedSkills = (skillsData || []).map((item: any) => ({
          id: item.skills?.id,
          name: item.skills?.name || '',
          category: item.skills?.category,
          proficiency: item.proficiency,
          is_learning_goal: item.is_learning_goal,
        }));

        setProfile({
          ...profileData,
          skills: formattedSkills,
        });
      } else {
        setProfile(null);
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      const token = localStorage.getItem('nexus_auth_token');
      if (token) {
        try {
          const res = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const userData = await res.json();
            const authUser: AuthUser = {
              id: userData.id,
              username: userData.username,
              role: userData.role || 'student',
              full_name: userData.full_name,
            };
            setUser(authUser);
            setSession({ access_token: token, user: authUser });
            await fetchProfile(userData.id);
            setLoading(false);
            return;
          } else {
            localStorage.removeItem('nexus_auth_token');
          }
        } catch (err) {
          console.warn('Backend session restore note:', err);
        }
      }

      // Fallback check on Supabase session
      try {
        const { data: { session: sbSession } } = await supabase.auth.getSession();
        if (sbSession?.user) {
          setSession(sbSession);
          const sbUser: AuthUser = {
            id: sbSession.user.id,
            username: sbSession.user.user_metadata?.username || sbSession.user.email?.split('@')[0] || 'student',
            email: sbSession.user.email,
          };
          setUser(sbUser);
          await fetchProfile(sbSession.user.id);
        }
      } catch {
        // Not authenticated
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const signIn = async (username: string, password: string): Promise<{ error: Error | null }> => {
    try {
      const trimmedUsername = username.trim().toLowerCase();
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: trimmedUsername, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { error: new Error(data.detail || 'Invalid username or password.') };
      }

      const token = data.access_token || data.session?.access_token;
      if (token) {
        localStorage.setItem('nexus_auth_token', token);
      }

      const authUser: AuthUser = {
        id: data.user.id,
        username: data.user.username,
        role: data.user.role || 'student',
        full_name: data.user.full_name,
      };

      setUser(authUser);
      setSession({ access_token: token, user: authUser });
      await fetchProfile(data.user.id);
      return { error: null };
    } catch (err: any) {
      return {
        error: new Error(
          err.message?.toLowerCase().includes('failed to fetch')
            ? `Unable to connect to Nexus AI backend at ${API_BASE_URL}. Please check your network connection.`
            : (err.message || 'Login failed. Please check your credentials.')
        ),
      };
    }
  };

  const signUp = async (
    username: string,
    password: string,
    fullName: string
  ): Promise<{ error: Error | null; user?: AuthUser | null; session?: any | null }> => {
    try {
      const trimmedUsername = username.trim().toLowerCase();
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: trimmedUsername,
          password,
          confirm_password: password,
          full_name: fullName.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { error: new Error(data.detail || 'Registration failed.') };
      }

      const token = data.access_token || data.session?.access_token;
      if (token) {
        localStorage.setItem('nexus_auth_token', token);
      }

      const authUser: AuthUser = {
        id: data.user.id,
        username: data.user.username,
        role: data.user.role || 'student',
        full_name: data.user.full_name,
      };

      setUser(authUser);
      setSession({ access_token: token, user: authUser });
      await fetchProfile(data.user.id);

      return {
        error: null,
        user: authUser,
        session: { access_token: token, user: authUser },
      };
    } catch (err: any) {
      return {
        error: new Error(
          err.message?.toLowerCase().includes('failed to fetch')
            ? `Unable to connect to Nexus AI backend at ${API_BASE_URL}. Please check your network connection.`
            : (err.message || 'Registration failed. Please try again.')
        ),
      };
    }
  };

  const signOut = async () => {
    const token = localStorage.getItem('nexus_auth_token');
    if (token) {
      try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
      } catch {
        // Best effort
      }
    }
    localStorage.removeItem('nexus_auth_token');
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore
    }
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const resetPassword = async (_email: string) => {
    return {
      error: new Error('Nexus AI uses username-only authentication. Email password recovery is disabled.')
    };
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        profileLoading,
        signIn,
        signUp,
        signOut,
        resetPassword,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
