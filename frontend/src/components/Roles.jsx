import '../styles/Roles.css'

import { useOutletContext, useParams } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'

import { BASE_URL } from '../config'
import { access } from '../enums'
import PageLoader from './PageLoader'

const accesses = [access.view, access.create, access.edit, access.delete]

export default function Roles() {

    const [accessState, setAccessState] = useState(Array(4).fill(false))
    const [roles, setRoles] = useState([])
    const [title, setTitle] = useState('')

    const { userRole } = useOutletContext()
    const dialog = useRef(null)

    let { projectId } = useParams()
    projectId = parseInt(projectId)

    function showModal() {
        setAccessState(Array(4).fill(false))
        setTitle('')
        dialog.current.showModal()
    }

    async function handleSubmit() {
        let issueAccess = 0
        accessState.forEach((acc, i) => { if (acc) issueAccess |= accesses[i] })
        const resp = await fetch(BASE_URL + '/roles', {
            method: 'POST',
            body: JSON.stringify({ projectId, title, issueAccess }),
            headers: {
                'content-type': 'application/json',
                'authorization': 'BEARER ' + localStorage.getItem('token'),
            },
        })
        if (resp.ok) {
            const newRole = await resp.json()
            setRoles(prev => [...prev, newRole])
        } else {
            alert('something went wrong')
        }
    }

    async function deleteRole(role) {
        if (["owner", "lead", "dev"].includes(role.title)) return;
        const resp = await fetch(BASE_URL + '/roles/' + role.ID, {
            method: 'DELETE',
            headers: {
                'authorization': 'BEARER ' + localStorage.getItem('token')
            }
        })
        if (resp.ok) {
            setRoles(prev => prev.filter(r => r.ID !== role.ID))
        } else {
            alert('something went wrong')
            throw Error('Couldnt delete Role')
        }
    }

    function handleAccessChange(index) {
        setAccessState(prev => {
            const next = [...prev]
            next[index] = !next[index]
            return next
        })
    }

    useEffect(() => {
        fetch(BASE_URL + '/roles?projectID=' + projectId, {
            headers: {
                'Authorization': 'BEARER ' + localStorage.getItem('token')
            }
        }).then(resp => {
            if (resp.ok) return resp.json()
            else {
                alert('something went wrong')
                throw Error('couldnt fetch Roles')
            }
        }).then(data => setRoles(data))
        // eslint-disable-next-line
    }, [])

    return (
        roles.length === 0 ? <PageLoader /> :
        <div id="roles" className='shadow-xl z-10'>
            <div className="title-create w-full flex gap-2 items-center box-border p-8">
                <p className="title text-3xl mr-auto">Roles</p>
                {userRole.title === 'owner' &&
                    <button className="high-emph" onClick={showModal}>
                        New Role
                    </button>
                }
            </div>
            <ul id="roles-list" className='flex gap-4'>
                {roles.map(role => { 
                return <li 
                    title={'Delete ' + role.title}
                    onClick={() => deleteRole(role)}
                    style={{backgroundColor: role.color + '20', color: role.color}}
                    className={`px-3 py-1 rounded-full hover:scale-105 duration-200 cursor-pointer`}>
                    <li key={role.ID }>
                        {role.title}
                    </li>
                </li>
                })}
            </ul>

            <dialog ref={dialog}>
                <form
                    className='py-8 px-16 flex gap-6 flex-col items-center justify-center' 
                    method='dialog' 
                    onSubmit={handleSubmit}>
                    <label
                        className=' flex flex-col gap-2 w-full'>
                        Role Title
                        <input
                            className='border w-full rounded-sm px-[1rem] py-2 outline-none border-slate-400 text-sm' 
                            required type="text" 
                            value={title}
                            onChange={e => setTitle(e.target.value)} />
                    </label>
                    <label 
                        className='flex flex-col gap-2 w-full'
                        id="access-checkbox">
                        Access over others' issues
                        <label className='flex gap-2 items-center'>
                            <input type="checkbox" checked={accessState[0]} onChange={() => handleAccessChange(0)} />
                            <p>view</p>
                        </label>
                        <label className='flex gap-2 items-center'>
                            <input type="checkbox" checked={accessState[1]} onChange={() => handleAccessChange(1)} />
                            <p>create</p>
                        </label>
                        <label className='flex gap-2 items-center'>
                            <input type="checkbox" checked={accessState[2]} onChange={() => handleAccessChange(2)} />
                            <p>edit</p>
                        </label>
                        <label className='flex gap-2 items-center'>
                            <input type="checkbox" checked={accessState[3]} onChange={() => handleAccessChange(3)} />
                            <p>delete</p>
                        </label>
                    </label>
                    <button type='submit' className='med-emph'>
                        Create
                    </button>
                </form>
            </dialog>
        </div>
    )
}