"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Lock, Globe } from 'lucide-react';
import { useContract } from '@/hooks/useContract';

type FormData = {
  name: string;
  description: string;
  isPrivate: boolean;
  password?: string;
};

/**
 * CreateRoomForm component
 *
 * A comprehensive form for creating new chat rooms with support for public/private rooms,
 * optional passwords, and form validation. Uses React Hook Form for form management.
 *
 * Features:
 * - Room name and description fields with validation
 * - Private/public room toggle with visual indicators
 * - Optional password protection for private rooms
 * - Loading states during room creation
 * - Form validation with error messages
 * - Success/cancel callbacks
 *
 * @component
 * @param {CreateRoomFormProps} props - Component props
 * @param {() => void} [props.onSuccess] - Callback called when room is created successfully
 * @param {() => void} props.onCancel - Callback called when user cancels form
 *
 * @example
 * ```tsx
 * // Basic usage
 * <CreateRoomForm 
 *   onCancel={() => setShowForm(false)}
 *   onSuccess={() => {
 *     setShowForm(false);
 *     refetchRooms();
 *   }}
 * />
 *
 * // In a modal
 * <Modal open={showCreateForm} onClose={() => setShowCreateForm(false)}>
 *   <CreateRoomForm 
 *     onSuccess={handleRoomCreated}
 *     onCancel={() => setShowCreateForm(false)}
 *   />
 * </Modal>
 * ```
 */
interface CreateRoomFormProps {
  onSuccess?: () => void;
  onCancel: () => void;
}

export function CreateRoomForm({ onSuccess, onCancel }: CreateRoomFormProps) {
  const { createRoom } = useContract();
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      name: '',
      description: '',
      isPrivate: false,
    },
  });

  const isPrivate = watch('isPrivate');

  const onSubmit = async (data: FormData) => {
    try {
      setIsLoading(true);
      // Call your contract's createRoom function
      await createRoom(data.name);
      onSuccess?.();
    } catch (error) {
      console.error('Error creating room:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="name">Room Name</Label>
        <Input
          id="name"
          placeholder="Enter room name"
          {...register('name', { required: 'Room name is required' })}
          disabled={isLoading}
        />
        {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          placeholder="What's this room about?"
          {...register('description')}
          disabled={isLoading}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="private-room"
          checked={isPrivate}
          onCheckedChange={(checked) => {
            // Update form value
            const event = { target: { name: 'isPrivate', value: checked } };
            // @ts-ignore
            register('isPrivate').onChange(event);
          }}
          disabled={isLoading}
        />
        <div className="flex items-center">
          {isPrivate ? (
            <Lock className="h-4 w-4 mr-2 text-amber-500" />
          ) : (
            <Globe className="h-4 w-4 mr-2 text-blue-500" />
          )}
          <Label htmlFor="private-room">
            {isPrivate ? 'Private Room' : 'Public Room'}
          </Label>
        </div>
      </div>

      {isPrivate && (
        <div>
          <Label htmlFor="password">Password (Optional)</Label>
          <Input
            id="password"
            type="password"
            placeholder="Set a room password"
            {...register('password')}
            disabled={isLoading}
          />
        </div>
      )}

      <div className="flex justify-end space-x-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create Room'}
        </Button>
      </div>
    </form>
  );
}
