"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Check } from "lucide-react";

const themes = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

/**
 * ThemeToggle component
 *
 * A dropdown menu that allows users to switch between light, dark, and system themes.
 * Uses the next-themes library to manage the theme state.
 *
 * @component
 * @returns {JSX.Element} A dropdown menu for theme selection
 */

export default function ThemeToggle() {
  const { theme, setTheme, systemTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Only render the UI after mounting to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70" />
    );
  }

  const currentTheme = theme === "system" ? systemTheme : theme;
  const isDark = resolvedTheme === "dark";
  const currentThemeLabel = themes.find((t) => t.value === theme)?.label || 'System';

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          aria-label="Theme toggle"
          className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          {isDark ? (
            <Moon className="w-5 h-5" />
          ) : (
            <Sun className="w-5 h-5" />
          )}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="min-w-[180px] bg-white dark:bg-slate-800 rounded-lg p-2 shadow-lg border border-slate-200 dark:border-slate-700 z-50"
          sideOffset={10}
          align="end"
        >
          <DropdownMenu.Label className="px-2 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
            Theme
          </DropdownMenu.Label>
          <DropdownMenu.Separator className="h-px bg-slate-100 dark:bg-slate-700 m-1" />
          {themes.map(({ value, label, icon: Icon }) => {
            const isActive = theme === value;
            return (
              <DropdownMenu.Item
                key={value}
                onSelect={() => setTheme(value)}
                className="flex items-center justify-between px-2 py-1.5 text-sm rounded-md cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 outline-none"
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </div>
                {isActive && <Check className="w-4 h-4 text-blue-500" />}
              </DropdownMenu.Item>
            );
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
