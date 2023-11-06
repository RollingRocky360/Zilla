import { useContext, useEffect, useState } from 'react'
import { useOutletContext, useParams } from 'react-router-dom'

import { BASE_URL } from '../config'

import { access, status } from '../enums'
import { UserContext } from '../contexts/UserContext'
import PageLoader from './PageLoader'

export default function Board() {
    const [todo, setTodo] = useState([])
    const [inprog, setInprog] = useState([])
    const [done, setDone] = useState([])
    const [issues, setIssues] = useState(null)

    const { projectId } = useParams()

    const um = useContext(UserContext)
    const { userAccess } = useOutletContext()

    async function shiftStatus(issueItem, nextStatus) {
        issueItem.issue.status = nextStatus
        const resp = await fetch(BASE_URL + '/issues/status', {
            method: 'PUT',
            body: JSON.stringify(issueItem.issue),
            headers: {
                'content-type': 'application/json',
                'authorization': 'BEARER ' + localStorage.getItem('token')
            }
        })

        if (!resp.ok) {
            alert('something went wrong')
            throw Error('Couldnt update issue status')
        }

        const newIssues = [...issues]
        for (let i=0; i<newIssues.length; i++)
            if (newIssues[i].issue.ID === issueItem.issue.ID) 
                newIssues[i].issue = issueItem.issue
    
        setIssues(newIssues)
    }

    useEffect(() => {
        if (issues !== null) {   
            setTodo(issues.filter(item => item.issue.status === status.toDo))
            setInprog(issues.filter(item => item.issue.status === status.inProgress))
            setDone(issues.filter(item => item.issue.status === status.done))
        }
    }, [issues])

    useEffect(() => {
        fetch(BASE_URL + '/issues?projectID=' + projectId, {
            headers: {
                'authorization': 'BEARER ' + localStorage.getItem('token')
            }
        }).then(resp => {
            if (resp.ok) return resp.json()
            else {
                alert('something went wrong')
                throw Error('Couldnt fetch Issues')
            }
        }).then(data => setIssues(data.filter(issue => issue.assignee !== null)))
    // eslint-disable-next-line
    }, [])

    return  (
        userAccess & access.view !== 0 && (issues === null ? <PageLoader /> :
        <div id="board" className='shadow-lg z-10'>

            <div id="todo" className="board-col">
                <p className='col-title text-slate-600 w-full text-center'>TO-DO</p>
                {todo.map(item => (
                    <div
                        data-type={'type' + item.issue.type}
                        className="board-item w-[13rem] m-auto h-auto shadow-lg text-slate-500 flex flex-col justify-center items-start p-4 hover:shadow-xl duration-200">
                        <div className='flex gap-2 items-center border-b-[2px] py-2 w-full'>
                            <p className='item.issue-title'>{item.issue.title}</p>
                        </div>
                        <p className='item.issue-description h-auto w-full text-ellipsis py-2'>{ item.issue.description }</p>
                        <div className="lead flex gap-2 py-2 border-t-[2px] w-full items-center">
                            <div
                                style={{backgroundColor: item.assignee.color + '30', color: item.assignee.color}} 
                                className="item-lead-pfp aspect-square rounded-full w-8 flex justify-center items-center">
                                { item.assignee.username[0] }
                            </div>
                            <p className='item-lead-name'>{ item.assignee.username }</p>
                        </div>

                        {um.user.ID === item.assignee.ID && <>
                            <button 
                                className='shiftButton shiftR aspect-square w-[2rem] rounded-full bg-indigo-400 text-white flex justify-center items-center shadow-xl duration-200' 
                                onClick={() => shiftStatus(item, status.inProgress)}>
                                <span class="material-symbols-outlined">
                                    arrow_right
                                </span>
                            </button>
                        </>}
                    </div>
                ))}
            </div>

            <div id="in-progress" className="board-col">
                <p className='col-title text-slate-600 w-full text-center'>IN PROGRESS</p>
                {inprog.map(item => (
                    <div
                        data-type={'type' + item.issue.type} 
                        className="board-item w-[13rem] m-auto shadow-lg text-slate-500 flex flex-col justify-center items-start p-4 hover:shadow-xl duration-200">
                        <div className='flex gap-2 items-center border-b-[2px] py-2 w-full'>
                            <p className='item.issue-title'>{item.issue.title}</p>
                        </div>
                        <p className='item.issue-description h-auto w-full text-ellipsis py-2'>{item.issue.description}</p>
                        <div className="lead flex gap-2 py-2 border-t-[2px] w-full items-center">
                            <div
                                style={{ backgroundColor: item.assignee.color + '30', color: item.assignee.color }}
                                className="item-lead-pfp aspect-square rounded-full w-8 flex justify-center items-center">
                                {item.assignee.username[0]}
                            </div>
                            <p className='item-lead-name'>{item.assignee.username}</p>
                        </div>

                        {um.user.ID === item.assignee.ID && <>
                            <button
                                className='shiftButton shiftR aspect-square w-[2rem] rounded-full bg-indigo-400 text-white flex justify-center items-center hover:text-slate-900 shadow-sm duration-200'
                                onClick={() => shiftStatus(item, status.done)}>
                                <span class="material-symbols-outlined">
                                    arrow_right
                                </span>
                            </button>
                            <button
                                className='shiftButton shiftL aspect-square w-[2rem] rounded-full bg-indigo-400 text-white flex justify-center items-center hover:text-slate-900 shadow-sm duration-200'
                                onClick={() => shiftStatus(item, status.toDo)}>
                                <span class="material-symbols-outlined">
                                    arrow_left
                                </span>
                            </button>
                        </>}
                    </div>
                ))}
            </div>

            <div id="done" className="board-col">
                <p className='col-title text-slate-600 w-full text-center'>DONE</p>
                {done.map(item => (
                    <div
                        data-type={'type' + item.issue.type} 
                        className="board-item w-[13rem] m-auto h-auto shadow-lg text-slate-500 flex flex-col justify-center items-start p-4 hover:shadow-xl duration-200">
                        <div className='flex gap-2 items-center border-b-[2px] py-2 w-full'>
                            <p className='item.issue-title'>{item.issue.title}</p>
                        </div>
                        <p className='item.issue-description h-auto w-full text-ellipsis py-2'>{item.issue.description}</p>
                        <div className="lead flex gap-2 py-2 border-t-[2px] w-full items-center">
                            <div
                                style={{ backgroundColor: item.assignee.color + '30', color: item.assignee.color }}
                                className="item-lead-pfp aspect-square rounded-full w-8 flex justify-center items-center">
                                {item.assignee.username[0]}
                            </div>
                            <p className='item-lead-name'>{item.assignee.username}</p>
                        </div>

                        {um.user.ID === item.assignee.ID && <>
                            <button
                                className='shadow-md shiftButton shiftL aspect-square w-[2rem] rounded-full bg-indigo-400 text-white hover:text-slate-900 flex justify-center items-center duration-200'
                                onClick={() => shiftStatus(item, status.inProgress)}>
                                <span class="material-symbols-outlined">
                                    arrow_left
                                </span>
                            </button>
                        </>}
                    </div>
                ))}
            </div>

        </div>)
    )
}