import { useCallback, useEffect, useState } from 'react';
import { useAccount } from 'wagmi';

type FeatureFlag = {
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number;
  users: string[];
};

export const useFeatureFlags = () => {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const { address } = useAccount();

  const fetchFlags = useCallback(async () => {
    try {
      const savedFlags = localStorage.getItem('featureFlags');
      if (savedFlags) {
        setFlags(JSON.parse(savedFlags));
      }
    } catch (error) {
      console.error('Failed to fetch feature flags:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateFlag = useCallback((flagName: string, updates: Partial<FeatureFlag>) => {
    setFlags((prevFlags) => {
      const updatedFlags = prevFlags.map((flag) =>
        flag.name === flagName ? { ...flag, ...updates } : flag
      );
      localStorage.setItem('featureFlags', JSON.stringify(updatedFlags));
      return updatedFlags;
    });
  }, []);

  const addFlag = useCallback((flag: Omit<FeatureFlag, 'enabled'>) => {
    setFlags((prevFlags) => {
      const newFlag = { ...flag, enabled: false };
      const updatedFlags = [...prevFlags, newFlag];
      localStorage.setItem('featureFlags', JSON.stringify(updatedFlags));
      return updatedFlags;
    });
  }, []);

  const removeFlag = useCallback((flagName: string) => {
    setFlags((prevFlags) => {
      const updatedFlags = prevFlags.filter((flag) => flag.name !== flagName);
      localStorage.setItem('featureFlags', JSON.stringify(updatedFlags));
      return updatedFlags;
    });
  }, []);

  const isAdmin = useCallback(() => {
    // In a real app, you would check the user's role/permissions
    const adminAddresses = process.env.NEXT_PUBLIC_ADMIN_ADDRESSES?.split(',') || [];
    return address && adminAddresses.includes(address.toLowerCase());
  }, [address]);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  return {
    flags,
    loading,
    isAdmin: isAdmin(),
    updateFlag,
    addFlag,
    removeFlag,
    refetch: fetchFlags,
  };
};

export const useFeatureFlag = (flagName: string) => {
  const { flags, loading } = useFeatureFlags();
  const { address } = useAccount();

  const isEnabled = useCallback(() => {
    if (loading) return false;
    
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
  }, [flagName, flags, loading, address]);

  return {
    isEnabled: isEnabled(),
    loading,
  };
};
