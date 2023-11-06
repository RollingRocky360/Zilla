import '../styles/Profile.css'

import { UserContext } from "../contexts/UserContext"
import { useContext, useState } from 'react'
import ButtonLoader from './ButtonLoader'

import { BASE_URL } from '../config'

const opts = { headers: {'authorization': 'BEARER ' + localStorage.getItem('token')} }

export default function Profile() {
    const um = useContext(UserContext)
    const [loading, setLoading] = useState(false)
    
    async function disableUser() {
        if (prompt('Do you want to disable your account? You can enable it later. Type "yes" to confirm') !== 'yes') return
        
        setLoading(true)
        const resp = await fetch(BASE_URL + '/user/able/disable', {
            method: 'PATCH',
            headers: opts.headers
        })
        if (resp.ok) um.fetchUser()
        else alert('something went wrong')
        setLoading(false)
    }

    async function deleteUser() {
        if (prompt('Do you want to delete your account? You can enable it later. Type "yes" to confirm') !== 'yes') return

        setLoading(true)
        const resp = await fetch(BASE_URL + '/user', {
            method: 'DELETE',
            headers: opts.headers,
        })
        if (resp.ok) um.fetchUser()
        else alert('something went wrong')
        setLoading(false)
    }
    
    return (
        <div id="profile" className='w-[100%] h-[100%] flex flex-col gap-3'>
            <div className={`pfp w-[7rem] h-[7rem] text-5xl rounded-full flex text-white items-center justify-center`}
                style={{backgroundColor: um.user.color}}>{ um.user.username[0] }</div>
            <p className='text-4xl'>{ um.user.username }</p>
            <p className='text-slate-400 mb-8'>{ um.user.email }</p>

            {loading ? <ButtonLoader /> : <>
                <button className='hover:bg-slate-50 border border-slate-500 text-slate-500 w-[11rem] px-5 py-2 rounded-md' onClick={um.logout}>Logout</button>
                <button className='text-red-400 border-red-400 hover:bg-slate-50 border w-[11rem] px-5 py-2 rounded-md' onClick={disableUser}>Disable Account</button>
                <button className='bg-red-400 px-5 py-2 hover:bg-red-500 rounded-md text-white w-[11rem]' onClick={deleteUser}>Delete Account</button>
            </>}
        </div>
    )
}