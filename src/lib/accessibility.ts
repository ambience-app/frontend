/**
 * Accessibility utilities for managing focus, ARIA live regions, and keyboard navigation
 */

/**
 * Manages focus trapping within modals and other focusable containers
 */
export class FocusManager {
  private static focusableElements = [
    'a[href]',
    'area[href]',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'button:not([disabled])',
    'iframe',
    '[tabindex]:not([tabindex="-1"])',
    '[contentEditable=true]'
  ];

  /**
   * Trap focus within a container element
   */
  static trapFocus(container: HTMLElement) {
    const focusableElements = container.querySelectorAll(this.focusableElements.join(', '));
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }

      if (e.key === 'Escape') {
        // Allow escape key to close modals
        const closeButton = container.querySelector('[data-close-modal]') as HTMLElement;
        if (closeButton) {
          closeButton.click();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    
    // Focus the first element
    firstElement?.focus();

    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }

  /**
   * Return focus to a previously focused element
   */
  static returnFocus(element?: HTMLElement) {
    if (element && typeof element.focus === 'function') {
      element.focus();
    }
  }

  /**
   * Move focus to a specific element
   */
  static moveFocus(element: HTMLElement | string) {
    const target = typeof element === 'string' 
      ? document.querySelector(element) as HTMLElement
      : element;
    
    if (target && typeof target.focus === 'function') {
      target.focus();
    }
  }

  /**
   * Get all focusable elements within a container
   */
  static getFocusableElements(container: HTMLElement): HTMLElement[] {
    return Array.from(container.querySelectorAll(this.focusableElements.join(', '))) as HTMLElement[];
  }
}

/**
 * Manages ARIA live regions for announcing dynamic content changes
 */
export class LiveRegionManager {
  private static liveRegion: HTMLElement | null = null;

  /**
   * Initialize the live region (should be called once)
   */
  static initialize() {
    if (typeof window !== 'undefined') {
      this.liveRegion = document.getElementById('live-region');
      
      if (!this.liveRegion) {
        this.liveRegion = document.createElement('div');
        this.liveRegion.id = 'live-region';
        this.liveRegion.className = 'sr-only';
        this.liveRegion.setAttribute('aria-live', 'polite');
        this.liveRegion.setAttribute('aria-atomic', 'true');
        document.body.appendChild(this.liveRegion);
      }
    }
  }

  /**
   * Announce a message to screen readers
   */
  static announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
    if (typeof window === 'undefined' || !this.liveRegion) {
      this.initialize();
    }

    if (this.liveRegion) {
      this.liveRegion.setAttribute('aria-live', priority);
      this.liveRegion.textContent = message;
      
      // Clear after a short delay to allow for repeated announcements
      setTimeout(() => {
        if (this.liveRegion) {
          this.liveRegion.textContent = '';
        }
      }, 1000);
    }
  }

  /**
   * Announce form validation errors
   */
  static announceFormError(fieldName: string, message: string) {
    this.announce(`${fieldName}: ${message}`, 'assertive');
  }

  /**
   * Announce successful actions
   */
  static announceSuccess(message: string) {
    this.announce(message, 'polite');
  }

  /**
   * Announce navigation changes
   */
  static announceNavigation(message: string) {
    this.announce(message, 'polite');
  }

  /**
   * Announce modal states
   */
  static announceModalState(action: 'opened' | 'closed', modalName: string) {
    if (action === 'opened') {
      this.announce(`${modalName} dialog opened`, 'assertive');
    } else {
      this.announce(`${modalName} dialog closed`, 'polite');
    }
  }
}

/**
 * Keyboard navigation utilities
 */
export class KeyboardNavigation {
  /**
   * Handle arrow key navigation in lists/menus
   */
  static handleArrowNavigation(
    event: KeyboardEvent,
    items: HTMLElement[],
    currentIndex: number,
    orientation: 'vertical' | 'horizontal' = 'vertical'
  ): number {
    let newIndex = currentIndex;

    switch (event.key) {
      case 'ArrowUp':
        if (orientation === 'vertical') {
          event.preventDefault();
          newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        }
        break;
      case 'ArrowDown':
        if (orientation === 'vertical') {
          event.preventDefault();
          newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        }
        break;
      case 'ArrowLeft':
        if (orientation === 'horizontal') {
          event.preventDefault();
          newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        }
        break;
      case 'ArrowRight':
        if (orientation === 'horizontal') {
          event.preventDefault();
          newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        }
        break;
      case 'Home':
        event.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        newIndex = items.length - 1;
        break;
    }

    if (newIndex !== currentIndex) {
      items[newIndex]?.focus();
    }

    return newIndex;
  }

  /**
   * Check if keyboard navigation should be handled
   */
  static isNavigationKey(event: KeyboardEvent): boolean {
    const navigationKeys = [
      'ArrowUp',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      'Home',
      'End',
      'Escape',
      'Enter',
      'Space'
    ];
    
    return navigationKeys.includes(event.key);
  }
}

/**
 * Color contrast utilities
 */
export class ContrastChecker {
  /**
   * Calculate relative luminance of a color
   */
  private static getLuminance(rgb: number[]): number {
    const [r, g, b] = rgb.map(val => {
      val = val / 255;
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  /**
   * Convert hex color to RGB
   */
  private static hexToRgb(hex: string): number[] | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : null;
  }

  /**
   * Calculate contrast ratio between two colors
   */
  static getContrastRatio(color1: string, color2: string): number | null {
    const rgb1 = this.hexToRgb(color1);
    const rgb2 = this.hexToRgb(color2);

    if (!rgb1 || !rgb2) return null;

    const lum1 = this.getLuminance(rgb1);
    const lum2 = this.getLuminance(rgb2);
    
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    
    return (brightest + 0.05) / (darkest + 0.05);
  }

  /**
   * Check if contrast ratio meets WCAG AA standards
   */
  static meetsWCAGAA(color1: string, color2: string): boolean {
    const ratio = this.getContrastRatio(color1, color2);
    return ratio ? ratio >= 4.5 : false;
  }

  /**
   * Check if contrast ratio meets WCAG AA standards for large text
   */
  static meetsWCAGLargeText(color1: string, color2: string): boolean {
    const ratio = this.getContrastRatio(color1, color2);
    return ratio ? ratio >= 3 : false;
  }
}

/**
 * Screen reader utilities
 */
export class ScreenReader {
  /**
   * Create an invisible element for screen reader announcements
   */
  static createAnnouncement(text: string, priority: 'polite' | 'assertive' = 'polite'): HTMLElement {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = text;
    return announcement;
  }

  /**
   * Announce to screen readers and clean up
   */
  static announce(text: string, priority: 'polite' | 'assertive' = 'polite') {
    if (typeof window === 'undefined') return;

    const announcement = this.createAnnouncement(text, priority);
    document.body.appendChild(announcement);

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }
}

/**
 * Initialize accessibility features
 */
export function initializeAccessibility() {
  if (typeof window !== 'undefined') {
    LiveRegionManager.initialize();
    
    // Add global keyboard event listener for skip links
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        // Show skip links when user tabs
        const skipLinks = document.querySelectorAll('.skip-nav-link');
        skipLinks.forEach(link => {
          link.classList.add('skip-nav-link-visible');
        });
      }
    });
  }
}