import * as Sentry from '@sentry/nextjs';

type ErrorContext = {
  [key: string]: any;
  user?: {
    id?: string;
    email?: string;
    walletAddress?: string;
  };
  tags?: Record<string, string>;
};

export const reportError = (
  error: Error,
  context: ErrorContext = {}
) => {
  // Add context to the error if provided
  if (context.user) {
    Sentry.setUser({
      id: context.user.id,
      email: context.user.email,
      ip_address: '{{auto}}',
      username: context.user.walletAddress,
    });
  }

  // Add tags if provided
  if (context.tags) {
    Sentry.setTags(context.tags);
  }

  // Add extra context
  const { user, tags, ...extra } = context;
  if (Object.keys(extra).length > 0) {
    Sentry.setExtras(extra);
  }

  // Capture the error
  Sentry.captureException(error);
};

export const captureMessage = (message: string, level: 'info' | 'warning' | 'error' | 'debug' = 'info') => {
  Sentry.captureMessage(message, level);
};

export const setUser = (user: { id?: string; email?: string; walletAddress?: string }) => {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    ip_address: '{{auto}}',
    username: user.walletAddress,
  });
};

export const addBreadcrumb = (message: string, data?: Record<string, any>) => {
  Sentry.addBreadcrumb({
    message,
    data,
    level: 'info',
  });
};
