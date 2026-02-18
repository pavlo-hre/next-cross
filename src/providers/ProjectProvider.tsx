'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';


export enum UserProjectEnum {
  ECHO = 'ECHO',
  NORWAY = 'NORWAY',
  EA = 'EA',
  BHA = 'BHA'
}

const ProjectContext = createContext<any>(null);

export function ProjectProvider({children}: { children: React.ReactNode }) {
  const {userProject} = useAuth();
  const [selectedProject, setSelectedProject] = useState<UserProjectEnum | null>( null);

  useEffect(() => {
    if (userProject && !selectedProject) {
      setSelectedProject(userProject);
    }
  }, [userProject]);

  return (
    <ProjectContext.Provider value={{
      selectedProject, setSelectedProject
    }}>
      {children}
    </ProjectContext.Provider>
  );
}

export const useProject = () => useContext(ProjectContext);
