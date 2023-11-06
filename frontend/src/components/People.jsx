import { useOutletContext, useParams } from 'react-router-dom';
import { BASE_URL } from '../config';
import '../styles/People.css'

import { useState, useRef, useEffect } from "react"
import PageLoader from './PageLoader';

export default function People() {
    const [user, setUser] = useState(undefined)
    const [email, setEmail] = useState('')
    const [success, setSuccess] = useState(false)
    const [roles, setRoles] = useState([])
    const [people, setPeople] = useState([])
    const [impFile, setImpFile] = useState(null)

    const {userRole} = useOutletContext()
    console.log('userrole = ',userRole)

    const { projectId } = useParams()
    
    const dialog = useRef(null)
    const uploadDialog = useRef(null)
    const fileInputElement = useRef(null)

    async function search(e) {
        setSuccess(false)
        if (email.length === 0) return;

        const resp = await fetch(BASE_URL + '/user?email=' + email, {
            headers: {
                'authorization': 'BEARER ' + localStorage.getItem('token')
            }
        })
        if (resp.ok) {
            setUser(await resp.json());
            setEmail('');
        } else {
            alert('something went wrong')
            throw Error('couldnt search user')
        }
    }

    async function sendInvite(toUser) {
        const resp = await fetch(BASE_URL + '/invitations/project?projectId='+projectId, {
            method: 'POST',
            body: JSON.stringify(toUser),
            headers: { 
                'content-type': 'application/json',
                'authorization': 'BEARER ' + localStorage.getItem('token') 
            }
        })
        if (resp.ok) {
            setUser(undefined)
            setSuccess(true)
        }
    }

    async function changeUserRole(userProjectID, roleID) {
        userProjectID = parseInt(userProjectID)
        roleID = parseInt(roleID) 
        const resp = await fetch(BASE_URL + `/people`, {
            method: 'PUT',
            body: JSON.stringify({ 
                userProjectID: userProjectID,
                roleID: roleID 
            }),
            headers: { 
                'content-type': 'application/json',
                'authorization': 'BEARER ' + localStorage.getItem('token') 
            }
        })
        if (resp.ok) {
            const role = await resp.json()
            setPeople(prev => {
                const newPeople = [...prev]
                console.log(newPeople)
                for (let i=0; i<newPeople.length; i++)
                    if (newPeople[i].userProjectID === userProjectID) {
                        newPeople[i].role = role
                        break
                    }
                return newPeople
            })
        } else {
            alert('something went wrong')
            throw Error('Couldnt change User Role')
        }
    }

    async function uploadImport(e) {
        e.preventDefault()
        const fileContent = await impFile.text()
        console.log(fileContent)

        const resp = await fetch(BASE_URL + '/people/import?projectID=' + projectId, {
            method: 'POST',
            body: fileContent,
            headers: {
                'content-type': 'text/plain',
                'authorization': 'BEARER ' + localStorage.getItem('token')
            }
        })
        if (resp.ok) {
            const newPeople = await resp.json()
            setPeople(prev => [...prev, ...newPeople])
            fileInputElement.current.value = null;
        } else if (resp.status === 422) {
            alert('Invalid data')
        } else {
            alert('something went wrong')
        }
    }

    useEffect(() => {
        Promise.all([
            fetch(BASE_URL + '/people?projectID=' + projectId, {
                headers: { 'authorization': 'BEARER ' + localStorage.getItem('token') }
            }),
            fetch(BASE_URL + '/roles?projectID=' + projectId, {
                headers: { 'authorization': 'BEARER ' + localStorage.getItem('token') }
            })
        ]).then(([peopleResp, roleResp]) => {
            if (peopleResp.ok && roleResp.ok) return Promise.all([peopleResp.json(), roleResp.json()])
            else alert('something went wrong')
        }).then(([peopleData, roleData]) => {
            setPeople(peopleData)
            setRoles(roleData)
        })
    // eslint-disable-next-line
    }, [])

    return (
        people.length === 0 ? <PageLoader /> :
        <div id="people" className='shadow-lg z-10'>
            <div className="title-create w-full flex gap-2 items-center box-border p-8">
                <p className="title text-3xl">People</p>
                {userRole.title === 'owner' &&
                    <button
                        onClick={() => uploadDialog.current.showModal()}
                        className='mr-auto flex aspect-square hover:bg-slate-100 p-2 rounded-full items-center text-slate-500' title='import issues as CSV'>
                        <span class="material-symbols-outlined w-full h-full">
                            upload_file
                        </span>
                    </button>
                }
                {userRole.title === 'owner' && 
                    <button className="high-emph" onClick={() => dialog.current.showModal()}>
                        Invite
                    </button> 
                }
            </div>

            {people.length === 0 ? <p>Loading</p> : 
                <ul id='people-list' className='flex flex-col max-h gap-4'>
                    {people.map(person => (
                        <li className="person cursor-default" key={person.user.ID} title={person.user.email}>
                            <div className="user w-full flex gap-4 items-center overflow-clip text-ellipsis">
                                <div 
                                    style={{backgroundColor: person.user.color + '30', color: person.user.color}}
                                    className="pfp flex items-center justify-center aspect-square text-2xl w-12 rounded-full">
                                        {person.user.username[0]}
                                    </div>
                                <p className='text-2xl text-slate-500'>{person.user.username}</p>
                                <p
                                    style={{ backgroundColor: person.role.color + '20', color: person.role.color }}
                                    className={`px-3 py-1 rounded-full text-xs`}>
                                    {person.role.title}
                                </p>
                                {userRole.title === 'owner' && person.role.title !== 'owner' &&
                                    <select
                                        defaultValue={person.role.ID}
                                        onChange={e => changeUserRole(person.userProjectID, e.target.value)}>
                                        {roles.map(role => (
                                            <option
                                                value={role.ID}
                                                key={role.ID}>
                                                {role.title}
                                            </option>
                                        ))}
                                    </select>}
                            </div>
                        </li>
                    ))}
                </ul>
            }

            <dialog ref={dialog}>
                <form 
                    className='py-8 px-10 flex gap-6 flex-col items-center justify-center'
                    method='dialog'>
                    <label
                        className='flex w-full'
                        style={{ flexDirection: 'row' }}>
                        <input
                            className='border-2 w-full border-r-0 rounded-sm px-[1rem] py-2 outline-none border-slate-500 text-sm'
                            type="text" placeholder='Search By Email'
                            onChange={e => setEmail(e.target.value)} />
                        <button type="button"
                            className='border-2 -ml-1 border-l-0 rounded-sm flex items-center aspect-square p-2 border-slate-500'
                            onClick={search}>
                            <span class="material-symbols-outlined text-slate-400 hover:text-slate-500"
                                title='search'>
                                search
                            </span>
                        </button>
                    </label>

                    {user !== undefined && (user === null ?
                        <p>No such user exists</p> :
                        <div id="searchResult"
                            title='select'
                            className='grid cursor-pointer gap-x-2 box-content rounded-md px-4 py-2 grid-rows-2 hover:bg-slate-100 grid-cols-[20%_80%] w-[80%] h-auto overflow-hidden'
                            onClick={() => sendInvite(user)}>
                            <div
                                style={{ backgroundColor: user.color + '30', color: user.color }}
                                className='pfp rounded-full row-span-2 w-full p-2 flex items-center justify-center aspect-square'>
                                {user.username[0]}
                            </div>
                            <p className='text-sm w-full overflow-clip text-ellipsis'>{user.username}</p>
                            <p className='text-sm text-slate-500 text-ellipsis w-full overflow-clip'>{user.email}</p>
                        </div>
                    )}

                    {success && <p className='flex items-center text-white bg-green-400 rounded-full px-4 py-2 gap-2'>Invite Sent <span class="material-symbols-outlined">
                        done
                    </span></p>}

                    <button className='med-emph'>
                        Done
                    </button>
                </form>
            </dialog>

            <dialog ref={uploadDialog}>
                <form 
                    className='py-8 m-auto px-10 flex gap-6 flex-col items-center justify-center'
                    onSubmit={uploadImport}>
                    <code>
                        <p>CSV STRUCRUE: username,email,role</p>
                        <br />
                        <p className='w-full text-left'>Example1: gagansai,gagnsai2010795@ssn.edu.in,dev</p>
                        <br />
                        <p>NOTE1: people being added must already be registered</p>
                        <p>NOTE2: roles being used must already be added to <br /> this project</p>
                    </code>
                    <input
                        ref={fileInputElement}
                        onChange={e => setImpFile(e.target.files[0])}
                        type='file'
                        name='file'
                        accept='.csv'
                        title='Import Users from CSV' />
                    <button className='high-emph m-auto'>submit</button>
                </form>
            </dialog>
        </div>
    )
}