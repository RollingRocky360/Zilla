import '../styles/Header.css'

import { Link, useLocation } from 'react-router-dom'

export default function Header() {
    const location = useLocation();

    return (
        <header className='w-[100%] h-[100%] z-20 flex text-[1.1rem] items-center px-[1.5rem] shadow-md shadow-slate-200'>
            <Link to={'/'} className='mr-5'>
                <span className='rounded-md px-4 text-white py-2 bg-indigo-400'>Zilla</span>
            </Link>
            <Link to={'/projects'} className={(location.pathname.startsWith('/projects') ? 'curr-link ' : '') + 'h-full flex items-center w-[6rem]'}>
                <span className='px-3  text-center rounded-md w-full'> Projects</span>
            </Link>
            <Link to={'/groups'} className={(location.pathname.startsWith('/groups') ? 'curr-link ' : '') + 'h-full flex items-center w-[6rem]'}>
                <span className='px-3  text-center rounded-md w-full'>Groups</span>
            </Link>
            <Link to={'/profile'} className={(location.pathname.startsWith('/profile') ? 'curr-link ' : '') + 'h-full flex items-center w-[6rem]'}>
                <span className='px-3  text-center rounded-md w-full'>Profile</span>
            </Link>
            <Link to={'/invites'} className={(location.pathname.startsWith('/invites') ? 'curr-link ' : '') + 'h-full flex items-center w-[7rem]'}>
                <span className='px-3 text-center rounded-md w-full'>Invitations</span>
            </Link>
        </header>
    )
}