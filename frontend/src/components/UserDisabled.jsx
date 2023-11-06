import { useContext } from "react"
import { UserContext } from "../contexts/UserContext"

import { BASE_URL } from "../config"

export default function UserDisabled() {
    const um = useContext(UserContext)

    async function enableAccount() {
        const resp = await fetch(BASE_URL + '/user/able/enable', {
            method: 'PATCH',
            headers: {
                'authorization': 'BEARER ' + localStorage.getItem('token')
            }
        })
        if (resp.ok) um.fetchUser()
        else {
            alert('something went wrong')
            throw Error('Couldnt enable user')
        }
    }

    return (
        <div id="disabled" className="row-span-2 w-full h-full flex flex-col gap-8 justify-center items-center">
            <p className="text-4xl">Account Disabled</p>
            <button onClick={enableAccount} className="text-white text-xl px-8 py-4">Enable</button>
        </div>
    )

}