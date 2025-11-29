import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAccount } from 'wagmi';

type FeatureFlag = {
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number;
  users: string[]; // specific users who should see the feature
};

type FeatureFlagContextType = {
  isEnabled: (flagName: string) => boolean;
  getVariant: <T>(flagName: string, variants: T[]) => T | null;
  loading: boolean;
};

const defaultContext: FeatureFlagContextType = {
  isEnabled: () => false,
  getVariant: () => null,
  loading: true,
};

const FeatureFlagsContext = createContext<FeatureFlagContextType>(defaultContext);

export const useFeatureFlags = () => useContext(FeatureFlagsContext);

type FeatureFlagsProviderProps = {
  children: ReactNode;
  initialFlags?: FeatureFlag[];
  onFlagChange?: (flagName: string, enabled: boolean) => void;
};

export const FeatureFlagsProvider: React.FC<FeatureFlagsProviderProps> = ({
  children,
  initialFlags = [],
  onFlagChange,
}) => {
  const [flags, setFlags] = useState<FeatureFlag[]>(initialFlags);
  const [loading, setLoading] = useState(true);
  const { address } = useAccount();

  // Load feature flags from API or localStorage
  useEffect(() => {
    const loadFeatureFlags = async () => {
      try {
        // In a real app, you would fetch this from your backend
        const savedFlags = localStorage.getItem('featureFlags');
        if (savedFlags) {
          setFlags(JSON.parse(savedFlags));
        } else {
          // Default flags for initial setup
          const defaultFlags: FeatureFlag[] = [
            {
              name: 'newChatUI',
              description: 'Enable the new chat UI',
              enabled: false,
              rolloutPercentage: 0,
              users: [],
            },
            {
              name: 'darkMode',
              description: 'Enable dark mode',
              enabled: true,
              rolloutPercentage: 100,
              users: [],
            },
          ];
          setFlags(defaultFlags);
          localStorage.setItem('featureFlags', JSON.stringify(defaultFlags));
        }
      } catch (error) {
        console.error('Failed to load feature flags:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFeatureFlags();
  }, []);

  const isEnabled = (flagName: string): boolean => {
    const flag = flags.find((f) => f.name === flagName);
    if (!flag) return false;

    // Check if user is in the explicit users list
    if (address && flag.users.includes(address.toLowerCase())) {
      return true;
    }

    // Check rollout percentage
    if (flag.rolloutPercentage === 100) return flag.enabled;
    if (flag.rolloutPercentage === 0) return false;

    // Simple hash-based distribution
    if (address) {
      const userHash = parseInt(address.slice(2, 10), 16) % 100;
      return flag.enabled && userHash < flag.rolloutPercentage;
    }

    return flag.enabled;
  };

  const getVariant = <T,>(flagName: string, variants: T[]): T | null => {
    if (!isEnabled(flagName) || variants.length === 0) return null;
    if (variants.length === 1) return variants[0];
    
    // Simple deterministic variant selection based on user address
    if (address) {
      const hash = parseInt(address.slice(2, 10), 16);
      return variants[hash % variants.length];
    }
    
    return variants[0];
  };

  const value = {
    isEnabled,
    getVariant,
    loading,
  };

  return (
    <FeatureFlagsContext.Provider value={value}>
      {children}
    </FeatureFlagsContext.Provider>
  );
};

export default FeatureFlagsContext;
