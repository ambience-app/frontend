# Components Directory

This directory contains all React components used throughout the Ambiance Chat application. Components are organized by functionality and follow a consistent pattern for props, styling, and documentation.

## Directory Structure

```
src/components/
├── README.md                 # This file
├── ConnectionStatus.tsx      # WebSocket connection status indicator
├── ErrorBoundary.tsx         # React error boundary wrapper
├── ErrorBoundaryWrapper.tsx  # Enhanced error boundary with recovery
├── ProfileForm.tsx           # User profile creation/editing form
├── ProfileView.tsx           # User profile display component
├── Providers.tsx             # App-wide context providers wrapper
├── ThemeToggle.tsx           # Dark/light theme switcher
├── TransactionToast.tsx      # Blockchain transaction notifications
├── WalletConnect.tsx         # Web3 wallet connection component
├── errors/                   # Error handling components
│   ├── ChatErrorBoundary.tsx
│   └── WalletErrorBoundary.tsx
├── rooms/                    # Chat room related components
│   ├── CreateRoomForm.tsx
│   ├── RoomListItem.tsx
│   ├── RoomSearch.tsx
│   └── RoomSettingsModal.tsx
├── skeletons/                # Loading state components
│   ├── MessageSkeleton.tsx
│   ├── ProfileSkeleton.tsx
│   └── RoomSkeleton.tsx
└── ui/                       # Reusable UI components
    ├── button.tsx
    └── toast.tsx
```

## Component Categories

### Core Components
- **ConnectionStatus**: Real-time WebSocket connection status with reconnection
- **ErrorBoundary**: Global error handling with user-friendly fallbacks
- **ProfileForm**: Comprehensive profile editing with validation and rate limiting
- **ProfileView**: Clean profile display with avatar and user information
- **ThemeToggle**: Accessible theme switching with system preference detection
- **WalletConnect**: Web3 wallet connection with multiple provider support

### Room Management
- **CreateRoomForm**: Room creation with privacy settings and validation
- **RoomListItem**: Individual room display with join/leave functionality
- **RoomSearch**: Advanced search and filtering for rooms
- **RoomSettingsModal**: Room configuration and moderation tools

### UI Components
- **Button**: Styled button component with variants and sizes
- **Toast**: Notification system for user feedback

### Error Handling
- **ChatErrorBoundary**: Specialized error boundary for chat components
- **WalletErrorBoundary**: Wallet-specific error handling

### Skeleton Loaders
- **MessageSkeleton**: Loading placeholder for chat messages
- **ProfileSkeleton**: Profile loading state
- **RoomSkeleton**: Room list loading state

## Component Patterns

### Props Documentation
All components include comprehensive JSDoc documentation with:
- Component description and purpose
- Props interface with types and descriptions
- Usage examples
- Return type information

### Styling
- Uses Tailwind CSS for styling
- Consistent color scheme with design tokens
- Responsive design patterns
- Dark/light theme support

### Error Handling
- Consistent error boundary integration
- User-friendly error messages
- Graceful degradation for missing data
- Loading state management

### Accessibility
- Proper ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- High contrast support

## Usage Examples

### Basic Component Usage
```tsx
import { WalletConnect } from '@/components/WalletConnect';
import { ThemeToggle } from '@/components/ThemeToggle';

function Header() {
  return (
    <div className="flex items-center gap-4">
      <ThemeToggle />
      <WalletConnect />
    </div>
  );
}
```

### With Error Boundaries
```tsx
import { ErrorBoundary } from '@/components/ErrorBoundary';

function ChatInterface() {
  return (
    <ErrorBoundary
      fallback={<div>Something went wrong in the chat.</div>}
      onError={(error, errorInfo) => {
        console.error('Chat error:', error, errorInfo);
      }}
    >
      <ChatMessages />
      <MessageInput />
    </ErrorBoundary>
  );
}
```

### Profile Management
```tsx
import { ProfileForm } from '@/components/ProfileForm';
import { ProfileView } from '@/components/ProfileView';

function ProfileSection() {
  const [showForm, setShowForm] = useState(false);
  
  return (
    <div>
      <ProfileView />
      <button onClick={() => setShowForm(!showForm)}>
        Edit Profile
      </button>
      {showForm && (
        <ProfileForm 
          onSuccess={() => setShowForm(false)}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
```

## Development Guidelines

### Creating New Components
1. Follow the established naming convention
2. Include comprehensive JSDoc documentation
3. Use TypeScript for all props and state
4. Include loading and error states
5. Add appropriate accessibility attributes
6. Test with Storybook when applicable

### Code Style
- Use functional components with hooks
- Follow React best practices
- Keep components focused and reusable
- Use consistent prop naming patterns
- Implement proper cleanup in useEffect

### Testing
- Unit test complex logic
- Test error scenarios
- Verify accessibility features
- Test with different screen sizes

## Dependencies
- React 18+
- Next.js 13+
- Tailwind CSS
- Lucide React (icons)
- Various UI libraries for enhanced functionality

## Contributing
When adding new components:
1. Ensure comprehensive JSDoc documentation
2. Include usage examples
3. Test accessibility compliance
4. Update this README if adding new categories
5. Consider creating stories for Storybook