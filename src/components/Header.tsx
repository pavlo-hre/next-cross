'use client'
import { useAuth } from '@/providers/AuthProvider';
import { RiLogoutBoxRLine, RiTeamLine } from 'react-icons/ri';


const Header = () => {
  const {isLoggedIn, user, signOut, userProject} = useAuth();

  return isLoggedIn ?
    <div className="flex justify-end gap-2 items-center bg-gray-300 p-2 fixed right-0 top-0 left-0 z-100">
      <div>
        {userProject}
      </div>
      <RiTeamLine />
      <div className="text-sm mr-2">
        {user?.email?.replace(/@.*$/, "")}
      </div>
      <RiLogoutBoxRLine onClick={signOut} className="cursor-pointer hover:opacity-60"/>
    </div> : null
}

export default Header;
