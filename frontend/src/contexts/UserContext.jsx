import { createContext, useState } from "react"

import {BASE_URL} from "../config"
export const UserContext = createContext(undefined)

export function UserContextProvider({ children }) {
    const [user, setUser] = useState(undefined)
    const [error, setError] = useState(false)
    const [loading, setLoading] = useState(false);

    async function fetchUser() {
        const token = localStorage.getItem('token')
        if (!token) {
            setUser(null)
            return
        }

        setLoading(true)
        const fetchUserResp = await fetch(BASE_URL + '/auth', {
            headers: {
                'Authorization': 'BEARER ' + token
            }
        })
        if (!fetchUserResp.ok) {
            setLoading(false)
            setError(true)
            return
        }
        const u = await fetchUserResp.json()

        setLoading(false)
        setError(false)
        setUser(u)
    }

    async function login(email, password) {
        setLoading(true)
        const loginResp = await fetch(BASE_URL + '/login', {
            method: 'POST',
            body: JSON.stringify({email, password}),
            headers: {
                'content-type': 'application/json'
            }
        })
        const { token, user: u } = await loginResp.json()
        if (!loginResp.ok) {
            setLoading(false)
            setError(true)
            return
        }

        setLoading(false)
        setError(false)
        setUser(u)

        localStorage.setItem('token', token)
    }

    async function register(email, username, password) {
        setLoading(true)
        const registerResp = await fetch(BASE_URL + '/register', {
            method: 'POST',
            headers: {
                'Content-type': 'Application/json'
            },
            body: JSON.stringify({ email, username, password })
        })
        const { token, user: u } = await registerResp.json()
        if (!registerResp.ok) {
            setLoading(false)
            setError(true)
            return
        }
        setLoading(false)
        setError(false)
        setUser(u)
        localStorage.setItem('token', token)
    }

    function logout() {
        localStorage.removeItem('token')
        setUser(null)
    }

    return (
        <UserContext.Provider value={{ user, loading, fetchUser, login, register, logout, error, setError }}>
            { children }
        </UserContext.Provider>
    )
}