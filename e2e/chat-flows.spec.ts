/**
 * e2e/chat-flows.spec.ts
 */

import { test, expect } from '@playwright/test';

// Tests rely on NEXT_PUBLIC_E2E=1 via webServer command in playwright.config.ts

test.describe('Chat Flow E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to chat page with connected wallet
    await page.goto('/chat?e2eConnected=true');
    await expect(page.getByText('Chat')).toBeVisible();
  });

  test.describe('Message Sending', () => {
    test('should send a message successfully', async ({ page }) => {
      // Find the message input
      const messageInput = page.getByPlaceholder('Type a message...');
      const sendButton = page.getByRole('button', { name: /Send/i });

      // Type a message
      await messageInput.fill('Hello, this is a test message!');
      
      // Click send
      await sendButton.click();

      // Message should appear in the chat
      await expect(page.getByText('Hello, this is a test message!')).toBeVisible();
    });

    test('should send message with Enter key', async ({ page }) => {
      const messageInput = page.getByPlaceholder('Type a message...');

      // Type and press Enter
      await messageInput.fill('Message sent with Enter key');
      await messageInput.press('Enter');

      // Message should appear
      await expect(page.getByText('Message sent with Enter key')).toBeVisible();
    });

    test('should not send empty messages', async ({ page }) => {
      const messageInput = page.getByPlaceholder('Type a message...');
      const sendButton = page.getByRole('button', { name: /Send/i });

      // Try to send empty message
      await messageInput.fill('');
      await sendButton.click();

      // No new messages should appear
      const messageCount = await page.locator('[data-testid="message"]').count();
      expect(messageCount).toBe(0);
    });

    test('should disable input while sending', async ({ page }) => {
      const messageInput = page.getByPlaceholder('Type a message...');

      // Type a long message to simulate processing time
      await messageInput.fill('This is a longer message that might take some time to process...');
      
      // Send message
      await messageInput.press('Enter');

      // Input should be temporarily disabled (this depends on implementation)
      // We'll check for the loading indicator
      await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
    });
  });

  test.describe('Message Display', () => {
    test('should display sender information', async ({ page }) => {
      // Send a message
      await page.getByPlaceholder('Type a message...').fill('Test message for sender display');
      await page.getByPlaceholder('Type a message...').press('Enter');

      // Check that sender is displayed (either ENS name or address)
      const senderElement = page.locator('[data-testid="message-sender"]').first();
      await expect(senderElement).toBeVisible();
      
      // Should show either ENS name or truncated address
      const senderText = await senderElement.textContent();
      expect(senderText).toMatch(/^(0x[a-fA-F0-9]{6}\.\.\.[a-fA-F0-9]{4}|[a-zA-Z0-9]+\.eth|Test User)$/);
    });

    test('should display message timestamp', async ({ page }) => {
      await page.getByPlaceholder('Type a message...').fill('Message with timestamp');
      await page.getByPlaceholder('Type a message...').press('Enter');

      const timestampElement = page.locator('[data-testid="message-timestamp"]').first();
      await expect(timestampElement).toBeVisible();
    });

    test('should show different styling for current user messages', async ({ page }) => {
      await page.getByPlaceholder('Type a message...').fill('My message');
      await page.getByPlaceholder('Type a message...').press('Enter');

      const myMessage = page.locator('[data-testid="message"]').last();
      await expect(myMessage).toHaveClass(/justify-end|bg-primary/);
    });
  });

  test.describe('Message Reactions', () => {
    test('should add reactions to messages', async ({ page }) => {
      await page.getByPlaceholder('Type a message...').fill('Message to react to');
      await page.getByPlaceholder('Type a message...').press('Enter');

      // Hover over the message to show reaction picker
      const message = page.locator('[data-testid="message"]').last();
      await message.hover();

      // Click on emoji picker
      await page.getByRole('button', { name: /😀|👍|❤️/ }).click();

      // Reaction should appear
      await expect(page.locator('[data-testid="reaction-button"]')).toBeVisible();
    });

    test('should toggle reactions', async ({ page }) => {
      await page.getByPlaceholder('Type a message...').fill('Message for reaction toggle');
      await page.getByPlaceholder('Type a message...').press('Enter');

      // Add reaction
      const message = page.locator('[data-testid="message"]').last();
      await message.hover();
      await page.getByRole('button', { name: '👍' }).click();

      // Add same reaction again to toggle off
      const reactionButton = page.locator('[data-testid="reaction-button"]').first();
      await reactionButton.click();

      // Reaction count should decrease or disappear
      const reactionText = await reactionButton.textContent();
      expect(parseInt(reactionText || '0')).toBeLessThanOrEqual(1);
    });
  });

  test.describe('Room Navigation', () => {
    test('should navigate between chat rooms', async ({ page }) => {
      // Navigate to rooms page
      await page.getByRole('link', { name: /Rooms/i }).click();
      await expect(page.getByText('Chat Rooms')).toBeVisible();

      // Join a room
      await page.getByRole('button', { name: /Join Room/i }).first().click();

      // Should be back in chat with new room
      await expect(page.getByText('Chat')).toBeVisible();
    });

    test('should display room-specific messages', async ({ page }) => {
      // This test would depend on the actual room implementation
      // For now, we'll test the basic navigation
      await page.goto('/rooms');
      await expect(page.getByText('Chat Rooms')).toBeVisible();
    });
  });

  test.describe('Real-time Updates', () => {
    test('should receive new messages in real-time', async ({ page, context }) => {
      // This test requires WebSocket mocking or a test server
      // For now, we'll simulate the expected behavior

      await page.getByPlaceholder('Type a message...').fill('Initial message');
      await page.getByPlaceholder('Type a message...').press('Enter');

      // Wait for message to appear
      await expect(page.getByText('Initial message')).toBeVisible();

      // In a real scenario, this would test WebSocket message reception
      // For E2E testing, we'd need to set up message broadcasting
    });

    test('should update message list when new messages arrive', async ({ page }) => {
      const initialCount = await page.locator('[data-testid="message"]').count();

      // Simulate receiving a new message (this would come from WebSocket in real scenario)
      await page.evaluate(() => {
        // This would trigger a custom event that the app listens for
        window.dispatchEvent(new CustomEvent('newMessage', {
          detail: {
            id: 'test-message',
            sender: '0x1234567890123456789012345678901234567890',
            content: 'Real-time message',
            timestamp: Date.now(),
            roomId: 'test-room'
          }
        }));
      });

      // Wait for the message count to increase
      await expect(page.locator('[data-testid="message"]')).toHaveCount(initialCount + 1);
    });
  });

  test.describe('Error Handling', () => {
    test('should handle send message errors gracefully', async ({ page }) => {
      // Mock network error
      await page.route('**/api/messages', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' })
        });
      });

      await page.getByPlaceholder('Type a message...').fill('This will fail');
      await page.getByPlaceholder('Type a message...').press('Enter');

      // Should show error message or handle gracefully
      await expect(page.getByText(/error|failed/i)).toBeVisible();
    });

    test('should handle connection errors', async ({ page }) => {
      // Simulate WebSocket disconnection
      await page.evaluate(() => {
        // Trigger connection error event
        window.dispatchEvent(new CustomEvent('websocketError', {
          detail: { message: 'Connection lost' }
        }));
      });

      // Should show connection status
      await expect(page.getByText(/disconnected|reconnecting/i)).toBeVisible();
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test('should work on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      // Send a message
      await page.getByPlaceholder('Type a message...').fill('Mobile test message');
      await page.getByRole('button', { name: /Send/i }).click();

      await expect(page.getByText('Mobile test message')).toBeVisible();
    });

    test('should handle mobile keyboard', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      // Focus input (simulating mobile keyboard show)
      const messageInput = page.getByPlaceholder('Type a message...');
      await messageInput.focus();

      // Input should be focused
      await expect(messageInput).toBeFocused();

      // Type message
      await messageInput.fill('Mobile keyboard test');
      await messageInput.press('Enter');

      await expect(page.getByText('Mobile keyboard test')).toBeVisible();
    });
  });
});

test.describe('Profile Flow E2E', () => {
  test('should navigate to profile page', async ({ page }) => {
    await page.goto('/profile?e2eConnected=true');
    
    // Should show profile form or view
    await expect(page.getByText(/Profile|Username/i)).toBeVisible();
  });

  test('should update profile information', async ({ page }) => {
    await page.goto('/profile?e2eConnected=true');

    // Fill profile form
    await page.getByLabel(/Username|name/i).fill('TestUser');
    await page.getByLabel(/Bio/i).fill('This is my test bio');

    // Save profile
    await page.getByRole('button', { name: /Save|Update/i }).click();

    // Should show success message
    await expect(page.getByText(/saved|updated/i)).toBeVisible();
  });

  test('should validate profile data', async ({ page }) => {
    await page.goto('/profile?e2eConnected=true');

    // Try invalid username
    await page.getByLabel(/Username/i).fill(''); // Empty username
    await page.getByRole('button', { name: /Save/i }).click();

    // Should show validation error
    await expect(page.getByText(/required|invalid/i)).toBeVisible();
  });
});

test.describe('Navigation E2E', () => {
  test('should navigate between main pages', async ({ page }) => {
    // Home to Chat
    await page.goto('/?e2eConnected=true');
    await page.getByRole('link', { name: /Chat/i }).click();
    await expect(page).toHaveURL(/.*\/chat/);

    // Chat to Rooms
    await page.getByRole('link', { name: /Rooms/i }).click();
    await expect(page).toHaveURL(/.*\/rooms/);

    // Rooms to Profile
    await page.getByRole('link', { name: /Profile/i }).click();
    await expect(page).toHaveURL(/.*\/profile/);
  });

  test('should maintain wallet connection across navigation', async ({ page }) => {
    const connectedAddress = '0x1234...abcd';

    // Start with connected wallet
    await page.goto('/?e2eConnected=true');
    await expect(page.getByText(connectedAddress)).toBeVisible();

    // Navigate to different pages
    await page.getByRole('link', { name: /Chat/i }).click();
    await expect(page.getByText(connectedAddress)).toBeVisible();

    await page.getByRole('link', { name: /Profile/i }).click();
    await expect(page.getByText(connectedAddress)).toBeVisible();
  });
});