# Contributing to Ambience Frontend

Thanks for your interest in contributing! This guide helps you set up the project, follow our style, and ship quality PRs.

## Development setup

- Requirements
  - Node.js 20+
  - npm (or pnpm/yarn)
- Clone and install
  - Fork this repo and clone your fork
  - Install deps: `npm install`
- Environment
  - Copy `.env.example` to `.env.local` and fill in:
    - `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=`
    - `NEXT_PUBLIC_NETWORK=mainnet` (or `testnet`)
    - `NEXT_PUBLIC_CONTRACT_ADDRESS=`
    - `NEXT_PUBLIC_BASE_RPC_URL=`
    - `NEXT_PUBLIC_GRAPH_API_URL=`
- Run
  - Dev server: `npm run dev`
  - Storybook: `npm run storybook`
  - Lint: `npm run lint`
  - Build: `npm run build`

## Code style guidelines

- TypeScript strict mode is enabled — fix all type errors.
- Use the path alias `@/*` for imports from `src/*`.
- Tailwind CSS v4 is used for styling; prefer utility classes and avoid inline styles.
- Keep providers, hooks, and components small and composable.
- Follow existing patterns for wallet/auth (Reown AppKit + Wagmi).

## PR process

1. Fork the repo and create a feature branch from the latest default branch.
2. Keep changes focused and small; include context in the PR description.
3. Ensure the following before opening a PR:
   - `npm run lint` passes
   - App builds: `npm run build`
   - Storybook runs locally if you touched UI components: `npm run storybook`
   - Tests pass (see Testing section)
4. Open a PR from your fork/branch to this repo. Link related issues (e.g., `Fixes #123`).
5. Address review feedback; squash or tidy commits if requested.

## Testing requirements

- Unit/story tests use Vitest + Storybook test runner (Playwright provider).
- Commands:
  - Run Storybook tests via Vitest: `npm run test` (or `vitest` if configured locally)
  - Build Storybook: `npm run build-storybook`
- If you add or change UI components, consider adding/adjusting a Storybook story.

## Commit message conventions

- Use Conventional Commits to keep history readable and enable automation:
  - `feat: add wallet dropdown copy-to-clipboard`
  - `fix: correct basescan link on testnet`
  - `docs: add contributing guide`
  - `chore: update eslint config`
  - `refactor: simplify wallet icon sanitization`
  - `test: add vitest story checks`

## Security and sensitive data

- Never commit real secrets. `.env.example` exists for documentation only.
- Do not hardcode API keys; use `NEXT_PUBLIC_*` vars only when safe for client exposure.

## Community conduct

- Be respectful and constructive. This project follows the Contributor Covenant 2.1 (see `CODE_OF_CONDUCT.md`).

## Documentation Standards

This project maintains comprehensive documentation standards to ensure code is understandable, maintainable, and accessible to all contributors.

### JSDoc Requirements

All public APIs, utility functions, components, and hooks **must** include comprehensive JSDoc documentation.

#### Required Documentation Coverage

- ✅ **100% JSDoc coverage** for:
  - All exported functions and components
  - All public utility functions
  - All React hooks (custom hooks)
  - All TypeScript interfaces and types
  - All public methods in classes

#### JSDoc Format Guidelines

##### Component Documentation Template
```typescript
/**
 * ComponentName component
 *
 * Brief description of what the component does and its main purpose.
 * 
 * Features:
 * - Feature 1 with brief explanation
 * - Feature 2 with brief explanation
 * - Feature 3 with brief explanation
 *
 * @component
 * @param {ComponentProps} props - Component props
 * @param {string} props.requiredProp - Description of required prop
 * @param {number} [props.optionalProp] - Description of optional prop
 *
 * @example
 * ```tsx
 * // Basic usage example
 * <ComponentName requiredProp="value" />
 * ```
 *
 * @example
 * ```tsx
 * // Advanced usage with all props
 * <ComponentName 
 *   requiredProp="value"
 *   optionalProp={42}
 *   onEvent={handleEvent}
 * />
 * ```
 *
 * @returns {JSX.Element} Description of what the component renders
 */
interface ComponentProps {
  requiredProp: string;
  optionalProp?: number;
  onEvent?: () => void;
}

export function ComponentName({ requiredProp, optionalProp, onEvent }: ComponentProps) {
  // Component implementation
}
```

##### Hook Documentation Template
```typescript
/**
 * useHookName hook
 *
 * Brief description of what the hook does and its main purpose.
 *
 * Features:
 * - Feature 1 with brief explanation
 * - Feature 2 with brief explanation
 * - Feature 3 with brief explanation
 *
 * @example
 * ```tsx
 * // Basic usage example
 * const { data, loading, error } = useHookName();
 * ```
 *
 * @example
 * ```tsx
 * // Advanced usage with options
 * const result = useHookName(options, { enabled: true });
 * ```
 *
 * @param {HookParams} params - Hook parameters
 * @param {string} params.param1 - Description of parameter
 * @param {Options} [params.options] - Optional parameters object
 *
 * @returns {HookReturnType} Description of returned object and its properties
 * @property {DataType} data - Description of data property
 * @property {boolean} loading - Description of loading state
 * @property {Error | null} error - Description of error state
 */
export function useHookName(params: HookParams) {
  // Hook implementation
}
```

##### Function Documentation Template
```typescript
/**
 * functionName function
 *
 * Brief description of what the function does and its purpose.
 *
 * Features:
 * - Feature 1 with brief explanation
 * - Feature 2 with brief explanation
 *
 * @example
 * ```typescript
 * // Basic usage
 * const result = functionName('input');
 * // result: 'expected-output'
 * ```
 *
 * @example
 * ```typescript
 * // Advanced usage with options
 * const result = functionName('input', { option: true });
 * // result: 'advanced-output'
 * ```
 *
 * @param {InputType} param1 - Description of first parameter
 * @param {OptionsType} [options] - Optional configuration object
 * @returns {ReturnType} Description of return value
 * @throws {ErrorType} When specific error condition occurs
 */
export function functionName(param1: InputType, options?: OptionsType): ReturnType {
  // Function implementation
}
```

##### Type Definition Documentation
```typescript
/**
 * InterfaceName interface
 *
 * Description of what this interface represents and when to use it.
 * 
 * Properties:
 * @property {string} property1 - Description of first property
 * @property {number} property2 - Description of second property
 * @property {boolean} [property3] - Description of optional property
 * 
 * @example
 * ```typescript
 * const example: InterfaceName = {
 *   property1: 'value',
 *   property2: 42,
 *   property3: true
 * };
 * ```
 */
export interface InterfaceName {
  property1: string;
  property2: number;
  property3?: boolean;
}
```

#### JSDoc Tags Reference

| Tag | Usage | Required |
|-----|-------|----------|
| `@component` | React components | ✅ |
| `@param` | Function/parameter documentation | ✅ |
| `@returns` | Return value description | ✅ |
| `@example` | Usage examples | ✅ |
| `@property` | Object property documentation | ✅ |
| `@throws` | Possible exceptions | ⚠️ |
| `@deprecated` | Deprecated features | ⚠️ |
| `@see` | Reference to related items | ⚠️ |

#### Documentation Quality Checklist

Before submitting PRs, ensure:

- [ ] All exported functions have complete JSDoc
- [ ] All React components have JSDoc with examples
- [ ] All custom hooks have comprehensive documentation
- [ ] All interfaces and types are documented
- [ ] JSDoc examples are accurate and functional
- [ ] Parameter descriptions are clear and helpful
- [ ] Return types and values are documented
- [ ] Error conditions are documented where applicable

### README Requirements

Create or update README.md files for:

- ✅ **All major directories** (components/, hooks/, lib/, types/, etc.)
- ✅ **Complex modules** with multiple related files
- ✅ **Feature modules** with significant functionality

#### README Structure Template
```markdown
# Directory Name

Brief description of what this directory contains and its purpose.

## Overview
High-level description of the functionality provided.

## Directory Structure
```
directory/
├── file1.ts      # Description of file1
├── file2.ts      # Description of file2
└── README.md     # This file
```

## Key Features
- Feature 1: Brief description
- Feature 2: Brief description
- Feature 3: Brief description

## Usage Examples
Code examples showing how to use the main functionality.

## Development Guidelines
Guidelines for contributors working in this directory.

## Dependencies
List of main dependencies used in this directory.
```

### TypeScript Type Documentation

- Document all interfaces and types
- Use JSDoc for complex type relationships
- Include examples for non-obvious types
- Document optional vs required properties

### Example Templates

#### React Component Example
```tsx
/**
 * UserProfile Component
 *
 * Displays user profile information including avatar, username, and bio.
 * Supports both viewing and editing modes with validation.
 *
 * Features:
 * - Displays user avatar with fallback
 * - Shows username and bio information
 * - Supports edit mode with form validation
 * - Handles loading and error states
 * - Responsive design for all screen sizes
 *
 * @component
 * @param {UserProfileProps} props - Component props
 * @param {User} props.user - User data to display
 * @param {boolean} [props.editable=false] - Whether profile is editable
 * @param {(user: Partial<User>) => void} [props.onUpdate] - Update callback
 *
 * @example
 * ```tsx
 * // Basic profile display
 * <UserProfile user={currentUser} />
 * ```
 *
 * @example
 * ```tsx
 * // Editable profile
 * <UserProfile 
 *   user={currentUser}
 *   editable={true}
 *   onUpdate={handleProfileUpdate}
 * />
 * ```
 *
 * @returns {JSX.Element} User profile component
 */
interface UserProfileProps {
  user: User;
  editable?: boolean;
  onUpdate?: (user: Partial<User>) => void;
}

export function UserProfile({ user, editable = false, onUpdate }: UserProfileProps) {
  // Component implementation
}
```

#### Custom Hook Example
```tsx
/**
 * useUserProfile Hook
 *
 * Manages user profile data fetching, caching, and updates.
 * Provides loading states and error handling for profile operations.
 *
 * Features:
 * - Fetches profile data from API
 * - Caches data for performance
 * - Handles loading and error states
 * - Provides update functionality
 * - Real-time data synchronization
 *
 * @example
 * ```tsx
 * // Basic usage
 * const { profile, loading, error } = useUserProfile(userAddress);
 * ```
 *
 * @example
 * ```tsx
 * // With real-time updates
 * const { 
 *   profile, 
 *   loading, 
 *   error, 
 *   updateProfile,
 *   refetch 
 * } = useUserProfile(userAddress, { realtime: true });
 * ```
 *
 * @param {Address} address - User's wallet address
 * @param {UseUserProfileOptions} [options] - Configuration options
 * @returns {UseUserProfileResult} Hook result with data and methods
 * @property {User | undefined} profile - User profile data
 * @property {boolean} loading - Loading state indicator
 * @property {Error | null} error - Current error state
 * @property {(data: Partial<User>) => Promise<void>} updateProfile - Update profile
 * @property {() => Promise<void>} refetch - Refresh profile data
 */
export function useUserProfile(
  address: Address, 
  options?: UseUserProfileOptions
): UseUserProfileResult {
  // Hook implementation
}
```

### Implementation Priority

1. **High Priority** (Document first):
   - Public APIs and exported functions
   - React components
   - Custom hooks
   - Utility functions used across the app

2. **Medium Priority**:
   - Internal helper functions
   - Private class methods
   - Complex type definitions

3. **Low Priority**:
   - Simple utility functions with obvious behavior
   - Internal implementation details

### Tools and Integration

- Use TypeScript for better IDE support
- Consider documentation generation tools (TypeDoc)
- Integrate documentation checks into CI/CD
- Use linting rules to enforce documentation standards

### Review Process

During code review, reviewers should check:

- [ ] Documentation completeness
- [ ] JSDoc accuracy and clarity
- [ ] Example functionality
- [ ] Type documentation coverage
- [ ] README updates for new features

By maintaining these standards, we ensure the codebase remains accessible and maintainable for all contributors, both current and future.
