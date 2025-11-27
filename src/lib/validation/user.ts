import { z } from 'zod';

// Common validation patterns
export const ethereumAddressSchema = z.string()
  .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address');

export const usernameSchema = z.string()
  .min(3, 'Username must be at least 3 characters')
  .max(20, 'Username must be less than 20 characters')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens')
  .trim();

export const bioSchema = z.string()
  .max(500, 'Bio must be less than 500 characters')
  .trim();

export const roomNameSchema = z.string()
  .min(1, 'Room name is required')
  .max(50, 'Room name must be less than 50 characters')
  .regex(/^[a-zA-Z0-9\s_-]+$/, 'Room name can only contain letters, numbers, spaces, underscores, and hyphens')
  .trim();

export const roomDescriptionSchema = z.string()
  .max(200, 'Room description must be less than 200 characters')
  .trim();

export const messageSchema = z.string()
  .min(1, 'Message cannot be empty')
  .max(1000, 'Message must be less than 1000 characters')
  .refine((value: string) => {
    // Prevent script injection and XSS
    const dangerousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
      /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi
    ];
    
    return !dangerousPatterns.some(pattern => pattern.test(value));
  }, 'Message contains potentially dangerous content');

export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password must be less than 100 characters')
  .optional();

// Profile validation schema
export const profileUpdateSchema = z.object({
  username: usernameSchema,
  bio: bioSchema,
  avatarFile: z.instanceof(File)
    .refine((file: File) => {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      return allowedTypes.includes(file.type);
    }, 'Avatar must be a valid image file (JPEG, PNG, GIF, or WebP)')
    .refine((file: File) => file.size <= 5 * 1024 * 1024, 'Avatar file must be less than 5MB')
    .optional()
});

// Room creation validation schema
export const createRoomSchema = z.object({
  name: roomNameSchema,
  description: roomDescriptionSchema.optional(),
  isPrivate: z.boolean(),
  password: passwordSchema
}).refine((data: any) => {
  if (data.isPrivate && data.password && data.password.length < 8) {
    return false;
  }
  return true;
}, {
  message: 'Private room password must be at least 8 characters',
  path: ['password']
});

// Room settings update schema
export const updateRoomSchema = z.object({
  name: roomNameSchema,
  description: roomDescriptionSchema.optional(),
  isPrivate: z.boolean(),
  password: z.string().max(100, 'Password must be less than 100 characters').optional()
}).refine((data: any) => {
  if (data.isPrivate && data.password && data.password.length > 0 && data.password.length < 8) {
    return false;
  }
  return true;
}, {
  message: 'Private room password must be at least 8 characters',
  path: ['password']
});

// Message validation schema
export const sendMessageSchema = z.object({
  roomId: z.number().positive('Invalid room ID'),
  content: messageSchema
});

// Contract interaction validation schema
export const contractCallSchema = z.object({
  contractAddress: ethereumAddressSchema,
  functionName: z.string().min(1, 'Function name is required'),
  args: z.array(z.any())
});

// WebSocket message validation schema
export const websocketMessageSchema = z.object({
  type: z.enum(['message', 'join_room', 'leave_room', 'typing', 'user_presence']),
  data: z.record(z.any())
});

export type ProfileUpdate = z.infer<typeof profileUpdateSchema>;
export type CreateRoom = z.infer<typeof createRoomSchema>;
export type UpdateRoom = z.infer<typeof updateRoomSchema>;
export type SendMessage = z.infer<typeof sendMessageSchema>;
export type ContractCall = z.infer<typeof contractCallSchema>;
export type WebSocketMessage = z.infer<typeof websocketMessageSchema>;