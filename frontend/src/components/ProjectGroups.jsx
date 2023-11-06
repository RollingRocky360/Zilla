import { useOutletContext, Link, useParams } from 'react-router-dom'
import { BASE_URL } from '../config'

import { useEffect, useRef, useState } from "react"
import PageLoader from './PageLoader'


export default function Groups() {
    const [groups, setGroups] = useState(undefined)
    const [roles, setRoles] = useState(undefined)
    const [groupName, setGroupName] = useState('')
    const [searchGroup, setSearchGroup] = useState(undefined)
    const [groupRole, setGroupRole] = useState({})
    
    const { projectId } = useParams()
    const { userRole } = useOutletContext()
    
    const dialog = useRef(null)
    
    const opts = { headers: { 'authorization': 'BEARER ' + localStorage.getItem('token') } }
    async function search() {
        const resp = await fetch(BASE_URL + `/groups/search?term=${encodeURI(groupName)}` , opts)
        if (resp.ok) setSearchGroup(await resp.json())
        else {
            alert('something went wrong')
            throw Error('Couldnt search group')
        }
    }

    async function addGroup() {
        const resp = await fetch(
            BASE_URL + `/projects/${projectId}/groups?roleID=${groupRole}&groupID=${searchGroup.ID}`, {
                method: 'POST',
                body: '',
                headers: { 
                    'content-type': "text/plain",
                    'authorization': 'BEARER ' + localStorage.getItem('token')
                },
            }
        )
        if (resp.ok) {
            const newGroup = await resp.json();
            setGroups(prev => [...prev, newGroup])
        }
    }

    useEffect(() => {
        Promise.all([
            fetch(BASE_URL + '/projects/' + projectId + '/groups', opts),
            fetch(BASE_URL + '/roles?projectID=' + projectId, opts)
        ]).then(([groupsResp, rolesResp]) => {
            if (groupsResp.ok && rolesResp.ok)
                return Promise.all([groupsResp.json(), rolesResp.json()])
            else { alert('something went wrong'); throw Error('couldnt fetch roles/groups'); }
        }).then(([groupsData, rolesData]) => {
            setGroups(groupsData)
            setRoles(rolesData)
            setGroupRole(rolesData[0])
        })
    // eslint-disable-next-line
    }, [])

    return (
        groups === undefined ? <PageLoader /> :
            <div id="groups" className='px-4 py-2 shadow-lg z-10'>
            <div className={"title-create flex gap-2 items-center box-border p-8" + 
                    (groups.length === 0 ? ' flex-col justify-center gap-6 m-auto w-fit h-full' : ' w-full gap-2')}>
                <p className={"title text-3xl mr-auto" + (groups.length === 0 ? ' ml-auto' : '')}>Groups</p>
                {userRole.title === 'owner' &&
                    <button className="high-emph" onClick={() => dialog.current.showModal()}>
                        Add Group
                    </button>
                }
            </div>

            {groups.length > 0 && <ul id="groups-list px-8">
                {groups === undefined ? <p>loading</p> : groups.length === 0 ? <p>no groups</p> :
                    groups.map(item => (
                        <li className='w-fit px-8'>
                        <Link className='flex gap-2 items-center' to={'/groups/'+item.group.ID}>
                            <div
                                style={{ backgroundColor: searchGroup.color + '30', color: searchGroup.color }}
                                className='rounded-full w-12 flex items-center justify-center aspect-square'>
                                {searchGroup.title[0]}
                            </div>
                            <p className='w-fit text-lg'>{searchGroup.title}</p>
                        </Link></li>
                    ))
                }
            </ul>}

            <dialog ref={dialog}>
                <form 
                    className='py-8 px-10 flex gap-6 flex-col items-center justify-center'
                    method='dialog'>
                    {roles && <label className='flex flex-col gap-2 w-full'>
                        Group Role
                        <select className="border py-1 px-2" onChange={e => setGroupRole(e.target.value)}>
                            {roles.map(role => (
                                <option 
                                    selected={role.ID === groupRole.ID} 
                                    value={role.ID} 
                                    key={role.ID}>
                                        {role.title}
                                </option>
                            ))}
                        </select>
                    </label>}
                    <label className='flex flex-col gap-2 w-full'>
                        Search Your Groups
                        <div className='flex'>
                            <input 
                                className='border-2 w-full border-r-0 rounded-sm px-[1rem] py-2 outline-none border-slate-500 text-sm'
                                type="text" value={groupName} onChange={e => setGroupName(e.target.value)} />
                            <button type="button"
                                className='border-2 -ml-3 border-l-0 rounded-sm flex items-center aspect-square p-2 border-slate-500'
                                onClick={search}>
                                <span class="material-symbols-outlined text-slate-400 hover:text-slate-500"
                                    title='search'>
                                    search
                                </span>
                            </button>
                        </div>
                    </label>

                    {searchGroup === null ? <p>no such group</p>: (searchGroup !== undefined && 
                        <button 
                            className='flex cursor-pointer items-center gap-x-2 box-content rounded-md px-4 py-2 hover:bg-slate-100 overflow-hidden'
                            onClick={addGroup}>
                            <div
                                style={{ backgroundColor: searchGroup.color + '30', color: searchGroup.color }}
                                className='pfp rounded-full row-span-2 w-8 flex items-center justify-center aspect-square'>
                                {searchGroup.title[0]}
                            </div>
                            <p>{ searchGroup.title}</p>
                        </button>
                    )}
                </form>
            </dialog>
        </div>
    )
}