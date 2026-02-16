'use client'

import { HeroUIProvider } from '@heroui/react';
import { ToastProvider } from '@heroui/toast';
import { AuthProvider } from '@/providers/AuthProvider';

export function Providers({children}: { children: React.ReactNode }) {
  return (
    <HeroUIProvider>
      <ToastProvider/>
      <AuthProvider>
      {children}
      </AuthProvider>
    </HeroUIProvider>
  )
}
