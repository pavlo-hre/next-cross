'use client'

import { HeroUIProvider } from '@heroui/react';
import { ToastProvider } from '@heroui/toast';
import { AuthProvider } from '@/providers/AuthProvider';
import { ProjectProvider } from '@/providers/ProjectProvider';

export function Providers({children}: { children: React.ReactNode }) {
  return (
    <HeroUIProvider>
      <ToastProvider/>
      <AuthProvider>
        <ProjectProvider>
          {children}
        </ProjectProvider>
      </AuthProvider>
    </HeroUIProvider>
  )
}
