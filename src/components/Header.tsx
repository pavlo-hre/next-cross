'use client'
import { CgProfile } from 'react-icons/cg';
import { useAuth } from '@/hooks/useAuth';
import { RiLogoutBoxRLine } from 'react-icons/ri';

const Header = () => {
  const {isLoggedIn, user, signOut} = useAuth();
  return isLoggedIn ?
    <div className="flex justify-end gap-2 items-center bg-gray-300 p-2 absolute right-0 top-0 left-0">
      <CgProfile/>
      <div className="text-sm mr-2">
        {user?.email}
      </div>
      <RiLogoutBoxRLine onClick={signOut} className="cursor-pointer hover:opacity-60"/>
    </div> : null
}

export default Header;
