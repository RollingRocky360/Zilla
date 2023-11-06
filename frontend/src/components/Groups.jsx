// import '../styles/Groups.css'

import { useEffect, useRef, useState } from "react"

import { BASE_URL } from '../config'
import { Link } from 'react-router-dom'
import PageLoader from "./PageLoader"


export default function Groups() {
    const authH = { 'authorization': 'BEARER ' + localStorage.getItem('token') } 
    const [groups, setGroups] = useState([])
    const [groupName, setGroupName] = useState('')
    const [loading, setLoading] = useState(false)
    
    const dialog = useRef(null)

    async function handleSubmit() {
        const resp = await fetch(BASE_URL + '/groups', {
            method: 'POST',
            body: groupName,
            headers: { ...authH }
        })
        if (resp.ok) {
            const group = await resp.json()
            setGroups(prev => [...prev, group])
        } else {
            alert('something went wrong')
            throw Error('couldnt fetch groups')
        }
    }

    useEffect(() => {
        setLoading(true)
        fetch(BASE_URL + '/groups', { headers: { ...authH }})
            .then(resp => {
                if (resp.ok) 
                    return resp.json()
                else { alert('something went wrong'); throw Error('couldnt fetch roles/groups'); }
            })
            .then(data => { setLoading(false); setGroups(data) })
    // eslint-disable-next-line
    }, [])

    return (
        loading ? <PageLoader /> :
        <div id="groups" className='py-8 px-24'>
                <div className={"title-create w-full flex " + (groups.length > 0 ? ' justify-between' : 'flex-col h-full justify-center gap-8 items-center')}>
                <p className="title text-3xl">Groups</p>
                <button className="high-emph" onClick={() => dialog.current.showModal()}>New Group</button>
            </div>

            {groups.length > 0 && <ul id="groups-list" className="py-8 flex flex-col gap h-full overflow-auto">
                {groups.length === 0 ? <p>no groups</p> :
                    groups.map(group => (
                        <li className="text-xl w-[40%] hover:bg-slate-50 py-4 px-5 rounded-md">
                            <Link to={'/groups/' + group.ID} className="flex gap-2 w-full h-full items-center">
                                <div
                                    style={{backgroundColor: group.color + '30', color: group.color}} 
                                    className="aspect-square h-12 rounded-xl flex items-center justify-center">{group.title[0]}</div>
                                <p className="">{group.title}</p>
                            </Link>
                        </li>    
                    ))
                }
            </ul>}

            <dialog ref={dialog}>
                <form method='dialog' 
                    onSubmit={handleSubmit} 
                    className='py-8 px-10 flex gap-6 flex-col items-center justify-center'>
                    <label className="flex flex-col gap-2 w-full">
                        Group Name
                        <input 
                            className='border-2 w-full rounded-sm px-[1rem] py-2 outline-none border-slate-500 text-sm'
                            type="text" value={groupName} onChange={e => setGroupName(e.target.value)} />
                    </label>
                    <button className='med-emph'>
                        Create
                    </button>
                </form>
            </dialog>
        </div>
    )
}