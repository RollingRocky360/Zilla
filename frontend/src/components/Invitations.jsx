import { useEffect, useState } from 'react'
import '../styles/Invitations.css'
import { BASE_URL } from '../config'
import PageLoader from './PageLoader'

export default function Invitations() {
    const [invites, setInvites] = useState(undefined)

    useEffect(() => {
        fetch(BASE_URL + '/invitations', {
            headers: { 'authorization': 'BEARER ' + localStorage.getItem('token') }
        }).then(resp => {
            if (resp.ok) return resp.json()
            else {
                alert('something went wrong')
                throw Error('Couldnt fetch Invitations')
            }
        }).then(data =>  { console.log(data); setInvites(data) })
    
    }, [])

    async function handleInvite(invite, action) {
        const resp = await fetch(BASE_URL + '/invitations/'+invite.details.ID, {
            method: 'PUT',
            body: action,
            headers: { 'authorization': 'BEARER ' + localStorage.getItem('token') }
        })
        if (resp.ok) {
            setInvites(prev => prev.filter(i => i.details.ID !== invite.details.ID))
        } else {
            alert('something went wrong')
            throw Error('Couldnt handle Invitation')
        }
    }

    return (
        invites === undefined ? <PageLoader /> :
            invites.length === 0 ? <p className='w-full h-full flex items-center text-3xl text-slate-600 justify-center'>No Invitations :&#40;</p> :
        <div id="groups" className='py-8 px-24'>
                <div className="title-create w-full flex justify-between">
                    <p className="title text-3xl">Invitations</p>
                </div>
                <ul id="invitations-list" className='w-full h-full flex flex-col pt-8'>
                    {invites.map(invite => (
                        <li className='invitation flex items-center cursor-default'>
                            {invite.project.ID !== 0 && 
                                <div className='flex gap-2 items-center py-2 w-[12rem] text-ellipsis' title='Project'>
                                    <div className='aspect-square w-8 flex justify-center items-center'
                                        style={{ backgroundColor: invite.project.color + '30', color: invite.project.color }}>{invite.project.title[0]}</div>
                                    <p className='invite.project-title'>{invite.project.title}</p>
                                </div>
                            }
                            {invite.group.ID !== 0 &&
                                <div className='flex gap-2 items-center py-2 w-[12rem] text-ellipsis' title='Group'>
                                    <div className='aspect-square rounded-full w-8 flex justify-center items-center'
                                        style={{ backgroundColor: invite.group.color + '30', color: invite.group.color }}>{invite.group.title[0]}</div>
                                    <p className='invite.group-title'>{invite.group.title}</p>
                                </div>
                            }
                            <div className='flex gap-2 items-center w-[12rem]'>
                                <div
                                    style={{backgroundColor: invite.fromUser.color + '30', color: invite.fromUser.color}} 
                                    className='aspect-square rounded-full w-8 flex justify-center items-center'>{ invite.fromUser.username[0] }</div>
                                <p>{ invite.fromUser.username }</p>
                            </div>
                            <div className='flex gap-3 items-center text-slate-400'>   
                                <button className="accept hover:bg-green-100 rounded-full flex items-center p-2" onClick={() => handleInvite(invite, 'accept')} title='Accept'>
                                    <span class="material-symbols-outlined aspect-square">
                                        done_outline
                                    </span>
                                </button>
                                <button className="reject hover:bg-red-100 rounded-full flex items-center p-2" onClick={() => handleInvite(invite, 'reject')} title='ignore'>
                                    <span class="material-symbols-outlined aspect-square">
                                        delete
                                    </span>
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
        </div>
    )
}