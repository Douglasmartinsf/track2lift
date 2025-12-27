
import React, { useState, useEffect } from 'react';
import { supabase } from './services/supabaseClient';
import { ViewState, DashboardTab, UserProfile } from './types';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import InstallPrompt from './components/InstallPrompt';
import AuthView from './views/Auth';
import DashboardView from './views/Dashboard';
import SettingsView from './views/Settings';
import OnboardingView from './views/Onboarding';
import { LogoMobile } from './components/icons/LogoMobile';

function App() {
  const [view, setView] = useState<ViewState>(ViewState.AUTH);
  const [activeTab, setActiveTab] = useState<DashboardTab>(DashboardTab.WORKOUTS);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper to construct user object from session
  const constructUser = (sessionUser: any): UserProfile => {
      const meta = sessionUser.user_metadata || {};
      return {
        id: sessionUser.id,
        email: sessionUser.email || '',
        name: meta.name || meta.full_name,
        age: meta.age,
        weight: meta.weight,
        height: meta.height,
        goal: meta.goal,
        custom_exercises: meta.custom_exercises || [],
        hidden_exercises: meta.hidden_exercises || []
      };
  };

  // Initial Session Check
  useEffect(() => {
    const checkSession = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
            setView(ViewState.AUTH);
            setLoading(false);
            return;
        }

        if (data?.session?.user) {
          const profile = constructUser(data.session.user);
          setUser(profile);
          
          if (!profile.goal || !profile.weight) {
              setView(ViewState.ONBOARDING);
          } else {
              setView(ViewState.DASHBOARD);
          }
        } else {
          setView(ViewState.AUTH);
        }
      } catch (err) {
          console.error("Session check failed:", err);
          setView(ViewState.AUTH);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') {
             if (session?.user) {
                 const profile = constructUser(session.user);
                 setUser(profile);
                 
                 if (event === 'SIGNED_IN') {
                     if (!profile.goal) setView(ViewState.ONBOARDING);
                     else setView(ViewState.DASHBOARD);
                 }
             }
        } else if (event === 'SIGNED_OUT') {
            setUser(null);
            setView(ViewState.AUTH);
        }
    });

    return () => {
        authListener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    try {
        await supabase.auth.signOut();
    } catch (error) {
        console.error("Logout error:", error);
    }
    setView(ViewState.AUTH);
    setUser(null);
  };

  const handleOnboardingComplete = async (data: Partial<UserProfile>) => {
      if (!user) return;
      try {
          const { error } = await supabase.auth.updateUser({
              data: { ...data }
          });
          if (error) throw error;
          // Local update will be handled by onAuthStateChange USER_UPDATED event usually, 
          // but for instant feedback we update state
          setUser({ ...user, ...data });
          setView(ViewState.DASHBOARD);
      } catch (err) {
          console.error("Onboarding error", err);
      }
  };

  const handleUserUpdate = (updatedUser: UserProfile) => {
      setUser(updatedUser);
  };

  if (loading) {
      return (
          <div className="fixed inset-0 bg-fundo flex flex-col items-center justify-center z-50">
              <div className="mb-8 animate-pulse">
                <LogoMobile className="w-40 h-auto" />
              </div>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-destaque"></div>
          </div>
      );
  }

  const isDashboard = view === ViewState.DASHBOARD && user;
  const showHeader = view !== ViewState.AUTH;

  return (
    <div className="h-[100dvh] bg-fundo text-texto font-sans flex flex-col overflow-hidden">
      {showHeader && (
        <Header 
            view={view} 
            user={user} 
            setView={setView} 
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onLogout={handleLogout}
        />
      )}
      
      {/* The scroll must occur inside this main element */}
      <main className="flex-1 w-full overflow-y-auto no-scrollbar relative">
        {view === ViewState.AUTH && <AuthView onSuccess={() => setView(ViewState.DASHBOARD)} />}
        {view === ViewState.ONBOARDING && <OnboardingView onComplete={handleOnboardingComplete} />}
        {view === ViewState.DASHBOARD && user && (
            <DashboardView 
                user={user} 
                activeTab={activeTab} 
                setActiveTab={setActiveTab}
            />
        )}
        {view === ViewState.SETTINGS && user && (
            <SettingsView 
                user={user} 
                onUpdateUser={handleUserUpdate}
                onBack={() => setView(ViewState.DASHBOARD)} 
            />
        )}
      </main>
      
      {isDashboard && (
          <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      )}
      <InstallPrompt />
    </div>
  );
}

export default App;
