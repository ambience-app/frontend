import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { Address, Room, User } from '@/types';

/**
 * useRoomPermissions hook
 *
 * A hook that provides room permissions functionality.
 * It allows checking if a user has a specific permission,
 * and adding/removing members from the room.
 *
 * @returns {Object} An object with functions to check if a user has a specific permission, and add/remove members from the room.
 * @property {function} hasPermission - A function to check if a user has a specific permission.
 * @property {function} can - A function to check if the current user has a specific permission.
 * @property {function} addMember - A function to add a member to the room.
 * @property {function} removeMember - A function to remove a member from the room.
 * @property {function} updateMemberRole - A function to update a member's role.
 * @property {function} getMember - A function to get a member by address.
 * @property {function} getMembersByRole - A function to get all members with a specific role.
 */
type Permission = 
  | 'send_messages'
  | 'manage_messages'
  | 'invite_users'
  | 'remove_users'
  | 'manage_room'
  | 'pin_messages';

type Role = 'admin' | 'moderator' | 'member' | 'guest';

interface RoomMember extends Pick<User, 'id' | 'address' | 'name' | 'avatarUrl'> {
  role: Role;
  joinedAt: number;
  permissions: Permission[];
}

interface RoomPermissionsHookProps {
  room: Room;
  currentUser: Address;
  initialMembers?: RoomMember[];
}

// Default permissions for each role
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    'send_messages',
    'manage_messages',
    'invite_users',
    'remove_users',
    'manage_room',
    'pin_messages',
  ],
  moderator: [
    'send_messages',
    'manage_messages',
    'invite_users',
    'remove_users',
    'pin_messages',
  ],
  member: ['send_messages'],
  guest: [],
};

// Cache for permission checks
const permissionCache = new Map<string, boolean>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const useRoomPermissions = ({ room, currentUser, initialMembers = [] }: RoomPermissionsHookProps) => {
  const { address } = useAccount();
  const [members, setMembers] = useState<RoomMember[]>(() => {
    // Initialize with current user if not present
    const userExists = initialMembers.some(m => m.address.toLowerCase() === currentUser.toLowerCase());
    if (!userExists && currentUser) {
      return [
        ...initialMembers,
        {
          id: currentUser,
          address: currentUser,
          name: '',
          role: 'member',
          joinedAt: Date.now(),
          permissions: [...ROLE_PERMISSIONS.member],
        },
      ];
    }
    return initialMembers;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Get member by address
  const getMember = useCallback((userAddress: Address): RoomMember | undefined => {
    return members.find(member => 
      member.address.toLowerCase() === userAddress.toLowerCase()
    );
  }, [members]);

  // Check if user has a specific permission
  const hasPermission = useCallback((userAddress: Address, permission: Permission): boolean => {
    if (!userAddress) return false;

    const cacheKey = `${userAddress}:${permission}:${room.id}`;
    const cachedValue = permissionCache.get(cacheKey);
    
    if (cachedValue !== undefined) {
      return cachedValue;
    }

    const member = getMember(userAddress);
    if (!member) return false;

    // Admins have all permissions
    if (member.role === 'admin') {
      permissionCache.set(cacheKey, true);
      return true;
    }

    const hasPerm = member.permissions.includes(permission) || 
                   ROLE_PERMISSIONS[member.role]?.includes(permission);
    
    permissionCache.set(cacheKey, hasPerm);
    return hasPerm;
  }, [getMember, room.id]);

  // Check if current user has a specific permission
  const can = useCallback((permission: Permission): boolean => {
    if (!currentUser) return false;
    return hasPermission(currentUser, permission);
  }, [currentUser, hasPermission]);

  // Add a member to the room
  const addMember = useCallback(async (user: Pick<User, 'id' | 'address' | 'name' | 'avatarUrl'>, role: Role = 'member') => {
    if (!can('invite_users')) {
      throw new Error('You do not have permission to invite users');
    }

    setIsLoading(true);
    try {
      // In a real app, this would be an API call
      const newMember: RoomMember = {
        ...user,
        role,
        joinedAt: Date.now(),
        permissions: [...ROLE_PERMISSIONS[role] || []],
      };

      setMembers(prev => {
        const exists = prev.some(m => m.address.toLowerCase() === user.address.toLowerCase());
        return exists ? prev : [...prev, newMember];
      });
      
      return newMember;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to add member'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [can]);

  // Remove a member from the room
  const removeMember = useCallback(async (userAddress: Address) => {
    if (!can('remove_users')) {
      throw new Error('You do not have permission to remove users');
    }

    const targetMember = getMember(userAddress);
    if (targetMember?.role === 'admin') {
      throw new Error('Cannot remove an admin');
    }

    setIsLoading(true);
    try {
      // In a real app, this would be an API call
      setMembers(prev => 
        prev.filter(member => member.address.toLowerCase() !== userAddress.toLowerCase())
      );
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to remove member'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [can, getMember]);

  // Update a member's role
  const updateMemberRole = useCallback(async (userAddress: Address, newRole: Role) => {
    if (!can('manage_room')) {
      throw new Error('You do not have permission to update roles');
    }

    setIsLoading(true);
    try {
      // In a real app, this would be an API call
      setMembers(prev =>
        prev.map(member =>
          member.address.toLowerCase() === userAddress.toLowerCase()
            ? {
                ...member,
                role: newRole,
                permissions: [...ROLE_PERMISSIONS[newRole] || []],
              }
            : member
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update role'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [can]);

  // Get all members with a specific role
  const getMembersByRole = useCallback((role: Role): RoomMember[] => {
    return members.filter(member => member.role === role);
  }, [members]);

  // Clear permission cache periodically
  useEffect(() => {
    const interval = setInterval(() => {
      permissionCache.clear();
    }, CACHE_TTL);

    return () => clearInterval(interval);
  }, []);

  // Current user's role and permissions
  const currentUserRole = useMemo(() => 
    getMember(currentUser)?.role || 'guest',
    [getMember, currentUser]
  );

  const currentUserPermissions = useMemo(() => 
    getMember(currentUser)?.permissions || [],
    [getMember, currentUser]
  );

  return {
    // State
    members,
    isLoading,
    error,
    currentUserRole,
    currentUserPermissions,
    
    // Actions
    hasPermission,
    can,
    addMember,
    removeMember,
    updateMemberRole,
    getMember,
    getMembersByRole,
    
    // Helper functions
    isAdmin: can('manage_room'),
    isModerator: can('manage_messages'),
    canSendMessages: can('send_messages'),
  };
};

export default useRoomPermissions;
