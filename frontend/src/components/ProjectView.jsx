import { useEffect, useState } from 'react';
import { Outlet, Link, useParams, useLocation } from "react-router-dom";
import { BASE_URL } from '../config';

export default function ProjectView() {
    const [userRole, setUserRole] = useState(undefined)
    const [userAccess, setUserAccess] = useState(undefined)
    const [project, setProject] = useState(undefined)

    const { projectId } = useParams()
    const location = useLocation()

    const opts = { headers: { 'authorization': 'BEARER ' + localStorage.getItem('token') } }
    useEffect(() => {
        Promise.all([
            fetch(BASE_URL + '/role?projectID=' + projectId, opts),
            fetch(BASE_URL + '/projects/' + projectId + '/access', opts),
            fetch(BASE_URL + '/projects/'+projectId , opts)
        ]).then(([roleResp, accessResp, projResp]) => {
            if (roleResp.ok && accessResp.ok && projResp.ok) 
                return Promise.all([roleResp.json(), accessResp.text(), projResp.json()])
            else {
                alert('something went wrong')
                throw Error('Couldnt fetch User Role')
            }
        }).then(([roleData, accessData, projData]) => {
            setUserRole(roleData)
            setUserAccess(parseInt(accessData))
            setProject(projData)
        })
    // eslint-disable-next-line
    }, [])

    return (
        userRole &&
        <div id="project-view">
            <div className='w-full h-[100%] box-border pt-4 bg-slate-50 z-0'>
                <div className='flex gap-2 flex-col items-center w-full justify-center mt-2'>
                    <div
                        style={{backgroundColor: project.color + '30', color: project.color}} 
                        className='aspect-square w-10 text-lg flex items-center justify-center rounded-md'>{project.title[0]}</div>
                    <div className='text-xl'>{project.title}</div>
                </div>
                <ul id="views" className='flex flex-col gap-1 w-full m-auto mt-8 item-center text-slate-600'>
                    <Link 
                        to={'issues'} 
                        className={'w-[80%] duration-200 text-center m-auto flex items-center gap-2 px-2 py-2 rounded-md' +
                            (location.pathname.endsWith('issues') ? ' bg-white shadow-md' : ' hover:bg-slate-100')}>
                        <span class="material-symbols-outlined">splitscreen</span>
                        Issues
                    </Link>
                    <Link 
                        to={'board'} 
                        className={'w-[80%] duration-200 text-center m-auto flex items-center gap-2 px-2 py-2 rounded-md' + 
                                (location.pathname.endsWith('board') ? ' bg-white shadow-md' : ' hover:bg-slate-100')}>
                            <span class="material-symbols-outlined">
                                dashboard
                            </span>
                        Board
                    </Link>
                    <Link 
                        to={'roles'} 
                        className={'w-[80%] duration-200 text-center m-auto flex items-center gap-2 px-2 py-2 rounded-md' + 
                                (location.pathname.endsWith('roles') ? ' bg-white shadow-md' : ' hover:bg-slate-100')}>
                            <span class="material-symbols-outlined">
                                person
                            </span>
                        Roles
                    </Link>
                    <Link 
                        to={'groups'} 
                        className={'w-[80%] duration-200 text-center m-auto flex items-center gap-2 px-2 py-2 rounded-md' + 
                                (location.pathname.endsWith('groups') ? ' bg-white shadow-md' : ' hover:bg-slate-100')}>
                            <span class="material-symbols-outlined">
                                groups
                            </span>
                        Groups
                    </Link>
                    <Link 
                        to={'people'} 
                        className={'w-[80%] duration-200 text-center m-auto flex items-center gap-2 px-2 py-2 rounded-md' + 
                                (location.pathname.endsWith('people') ? ' bg-white shadow-md' : ' hover:bg-slate-100')}>
                            <span class="material-symbols-outlined">
                                people
                            </span>
                        People
                    </Link>
                </ul>
            </div>
            <Outlet context={{ userRole, userAccess }} />
        </div>
    )
}