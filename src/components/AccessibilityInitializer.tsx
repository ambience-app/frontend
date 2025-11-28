"use client";

import { useEffect } from "react";
import { initializeAccessibility } from "@/lib/accessibility";

/**
 * AccessibilityInitializer component
 * 
 * Initializes accessibility features when the app mounts
 * This should be rendered in the layout to ensure accessibility features are available throughout the app
 */
export function AccessibilityInitializer() {
  useEffect(() => {
    initializeAccessibility();
  }, []);

  return null;
}

export default AccessibilityInitializer;