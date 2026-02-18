'use client'
import { useAuth } from '@/providers/AuthProvider';
import { RiLogoutBoxRLine, RiTeamLine } from 'react-icons/ri';
import { Autocomplete, AutocompleteItem } from '@heroui/react';
import React from 'react';
import { InfoTooltip } from '@/components/Tooltip';
import { useProject, UserProjectEnum } from '@/providers/ProjectProvider';


const Header = () => {
  const {isLoggedIn, user, signOut} = useAuth();
  const {selectedProject, setSelectedProject} = useProject();
  const projects = Object.values(UserProjectEnum).map((item) => ({label: item, value: item, key: item}));

  const onSelectionChange = (key: any) => {
    setSelectedProject(key);
  };


  return isLoggedIn ?
    <div className="flex justify-end gap-3 items-center bg-gray-300 p-2 fixed right-0 top-0 left-0 z-100 min-h-[56px]">
      <div className="flex gap-1">
        {selectedProject && projects.length ? (
          <Autocomplete className="w-[120px]"
                        aria-label="Project"
                        variant="flat"
                        required={true}
                        isClearable={false}
                        items={projects}
                        inputValue={selectedProject}
                        selectedKey={selectedProject}
                        onSelectionChange={onSelectionChange}
          >
            {projects.map((project) => (
              <AutocompleteItem key={project.value}>{project.label}</AutocompleteItem>
            ))}
          </Autocomplete>) : null}
          <InfoTooltip placement="bottom-end" content="Для обраного проєкту результати пошуку будуть відображатися за весь період, для інших лише за 3 місяці!"/>
      </div>
      <RiTeamLine/>
      <div className="text-sm mr-2">
        {user?.email?.replace(/@.*$/, '')}
      </div>
      <RiLogoutBoxRLine onClick={signOut} className="cursor-pointer hover:opacity-60"/>
    </div> : null
}

export default Header;
