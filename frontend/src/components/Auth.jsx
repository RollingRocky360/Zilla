import '../styles/Auth.css'

import { useContext, useState } from "react"
import { UserContext } from "../contexts/UserContext";
import { Navigate } from 'react-router-dom';

import ButtonLoader from './ButtonLoader';

export default function Auth() {

    // user manager
    const um = useContext(UserContext);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const [registering, setRegistering] = useState(false)

    function handleSubmit(e) {
        e.preventDefault()
        registering ? um.register(email, username, password) : um.login(email, password);
    }

    return (
        um.user !== null ? <Navigate to={'/'} /> :
        <div id="auth-container" className='h-full w-full'>
            <form 
                onSubmit={handleSubmit} onFocus={() => um.setError(false)}
                    className='auth py-8 px-10 w-[30%] flex gap-6 flex-col shadow-2xl items-center justify-center'>
                <h1 className='text-4xl text-indigo-400'>Zilla</h1>
                <h3 className='text-slate-400'>{registering ? 'Register' : 'Login'} to Continue</h3>

                <label htmlFor="email" className="flex flex-col gap-2 w-full">
                    <span className={um.error ? 'error' : ''}>Email {um.error && <span>- Invalid Credentials</span>}</span>
                    <input
                        className='border w-full rounded-sm px-[1rem] py-2 outline-none border-slate-400 text-sm'                     
                        type="email" id="email" onChange={e => setEmail(e.target.value)} required />
                </label>

                {registering &&
                        <label htmlFor="username" className="flex flex-col gap-2 w-full">
                    <span className={um.error ? 'error' : ''}>Username {um.error && <span>- Invalid Credentials</span>}</span>
                    <input 
                        className='border w-full rounded-sm px-[1rem] py-2 outline-none border-slate-400 text-sm'
                        type="text" id="username" onChange={e => setUsername(e.target.value)} required />
                </label>}        

                <label htmlFor="password" className="flex flex-col gap-2 w-full">
                    <span className={um.error ? 'error' : ''}>Password {um.error && <span>- Invalid Credentials</span>}</span>
                    <input 
                            className='border w-full rounded-sm px-[1rem] py-2 outline-none border-slate-400 text-sm'
                            type="password" onChange={e => setPassword(e.target.value)} required />
                </label>

                {registering ?
                    <p>Already have an account? <span className="text-indigo-400 cursor-pointer" onClick={() => setRegistering(false)}>Login</span></p> :
                    <p>Don't have an account? <span className="text-indigo-400 cursor-pointer" onClick={() => setRegistering(true)}>Register</span></p>
                }

                {um.loading ? <ButtonLoader /> : <button className="high-emph" type="submit">
                        {registering ? 'Register' : 'Login'}
                </button>}
            </form>
        </div>
    )
}