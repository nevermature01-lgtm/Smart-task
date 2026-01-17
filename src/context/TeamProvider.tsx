'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

type TeamContextType = {
  activeTeam: string | null; // 'personal' or team_id
  setActiveTeam: (teamId: string | null) => void;
  isLoading: boolean;
};

const TeamContext = createContext<TeamContextType | undefined>(undefined);

const TEAM_STORAGE_KEY = 'activeTeamId';

export default function TeamProvider({ children }: { children: ReactNode }) {
  const [activeTeam, setActiveTeamState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // On initial load, try to get the active team from localStorage.
    // Default to 'personal' if nothing is found.
    try {
      const savedTeam = localStorage.getItem(TEAM_STORAGE_KEY);
      setActiveTeamState(savedTeam || 'personal');
    } catch (error) {
      console.error("Could not access localStorage:", error);
      setActiveTeamState('personal');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setActiveTeam = useCallback((teamId: string | null) => {
    const newActiveTeam = teamId || 'personal';
    setActiveTeamState(newActiveTeam);
    try {
      if (newActiveTeam === 'personal') {
        // We can remove the key or set it to 'personal'
        localStorage.setItem(TEAM_STORAGE_KEY, 'personal');
      } else {
        localStorage.setItem(TEAM_STORAGE_KEY, newActiveTeam);
      }
    } catch (error) {
        console.error("Could not access localStorage:", error);
    }
  }, []);

  const value = { activeTeam, setActiveTeam, isLoading };

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>;
}

export const useTeam = () => {
  const context = useContext(TeamContext);
  if (context === undefined) {
    throw new Error('useTeam must be used within a TeamProvider');
  }
  return context;
};
