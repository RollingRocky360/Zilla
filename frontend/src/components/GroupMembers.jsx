import { useEffect, useState, useRef, useContext } from "react";
import { useParams } from "react-router-dom";

import { UserContext } from "../contexts/UserContext"

import { BASE_URL } from "../config";

export default function GroupMembers() {
    const [group, setGroup] = useState(undefined)
    const [user, setUser] = useState(undefined)
    const [email, setEmail] = useState('')
    const [success, setSuccess] = useState(false)

    const um = useContext(UserContext)

    const groupId = parseInt(useParams()['groupId'])
    const dialog = useRef(null)

    async function search(e) {
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
        const resp = await fetch(BASE_URL + '/invitations/group?groupId=' + groupId, {
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

    useEffect(() => {
        fetch(BASE_URL + '/groups/' + groupId, {
            headers: { 'authorization': 'BEARER ' + localStorage.getItem('token') }
        }).then(resp => {
            if (resp.ok) return resp.json()
            else {
                alert('something went wrong')
                throw Error('couldnt fetch group members')
            }
        }).then(data => { console.log(data); setGroup(data) })
    // eslint-disable-next-line
    }, [])

    return (
        group && 
        <div id="group" className='py-8 px-24'>
            <div className="title-create w-full flex gap-2 items-center">
                <div
                    style={{backgroundColor: group.group.color + '30', color: group.group.color }} 
                    className="text-3xl aspect-square w-16 rounded-full flex items-center justify-center">
                    { group.group.title[0] }
                </div>
                <p className="title text-3xl mr-auto">{ group.group.title }</p>
                {group.group.creatorId === um.user.ID && 
                <button className="high-emph m-auto" onClick={() => dialog.current.showModal()}>
                    Add Member
                </button>}
            </div>

            <ul id="group-members-list" className="py-8 flex flex-col gap h-max overflow-auto">
                {group.users.map(user => (
                    <li className="text-xl w-[40%] py-2 px-3 flex gap-2 items-center rounded-md">
                        <div
                            style={{ backgroundColor: user.color + '30', color: user.color }}
                            className="aspect-square h-12 rounded-full flex items-center justify-center">{
                            user.username[0]}
                        </div>
                        <p className="">{user.username}</p>
                    </li>
                ))}
            </ul>

            <dialog ref={dialog}>
                <form method='dialog'>
                    <label>
                        Search by Email
                        <input type="email" onChange={e => setEmail(e.target.value)} />
                        <button type="button" onClick={search}>🔍</button>
                    </label>

                    {user !== undefined && (user === null ?
                        <p>No such user exists</p> :
                        <div className="search-user" onClick={() => sendInvite(user)}>
                            <div className="search-user-pfp">
                                {user.username[0]}
                            </div>
                            <p>{user.username}</p>
                            <p>{user.email}</p>
                        </div>
                    )}

                    {success && <p>Invite Sent ✅</p>}

                    <button className='med-emph'>
                        Done
                    </button>
                </form>
            </dialog>

        </div>
    )
}