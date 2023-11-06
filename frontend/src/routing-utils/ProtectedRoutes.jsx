import { useContext } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { UserContext } from '../contexts/UserContext'

import Header from '../components/Header';

import UserDeleted from "../components/UserDeleted"
import UserDisabled from "../components/UserDisabled"

export default function ProtectedRoutes() {
    const { user } = useContext(UserContext)

    return (
        user === null ?<Navigate to='/auth' /> : 
            user.isDeleted ? <UserDeleted user={user} /> :
                user.isDisabled ? <UserDisabled user={user} /> : 
                <>
                    <Header /> 
                    <Outlet />  
                </>
    )
}