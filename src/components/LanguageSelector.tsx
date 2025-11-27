"use client";

import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Check } from 'lucide-react';

const languages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
];

export default function LanguageSelector() {
  const { i18n } = useTranslation();
  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    // Update HTML lang attribute
    document.documentElement.lang = lng;
    // Handle RTL for RTL languages (e.g., Arabic, Hebrew)
    document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          aria-label="Change language"
          className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <Globe className="w-5 h-5" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="min-w-[180px] bg-white dark:bg-slate-800 rounded-lg p-2 shadow-lg border border-slate-200 dark:border-slate-700 z-50"
          sideOffset={10}
          align="end"
        >
          <DropdownMenu.Label className="px-2 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
            Language
          </DropdownMenu.Label>
          <DropdownMenu.Separator className="h-px bg-slate-100 dark:bg-slate-700 m-1" />
          {languages.map(({ code, name }) => {
            const isActive = i18n.language === code;
            return (
              <DropdownMenu.Item
                key={code}
                onSelect={() => changeLanguage(code)}
                className="flex items-center justify-between px-2 py-1.5 text-sm rounded-md cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 outline-none"
              >
                <span>{name}</span>
                {isActive && <Check className="w-4 h-4 text-blue-500" />}
              </DropdownMenu.Item>
            );
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
