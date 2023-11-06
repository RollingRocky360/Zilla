import { useEffect, useRef, useState } from 'react'
import { useOutletContext, useParams } from 'react-router-dom'

import { BASE_URL } from '../config'

import { access, types, revTypes } from '../enums'
import PageLoader from './PageLoader'

export default function Issues() {
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [type, setType] = useState('task')
    const [searchUser, setSearchUser] = useState(undefined)
    const [searchEmail, setSearchEmail] = useState('')
    const [assignedUser, setAssignedUser] = useState(null)
    const [issues, setIssues] = useState(null)
    const [action, setAction] = useState('Create')
    const [updatingIssueID, setUpdatingIssueID] = useState(0)
    const [impFile, setImpFile] = useState(null)

    const dialog = useRef(null)
    const fileInputElement = useRef(null)
    const uploadDialog = useRef(null)

    const projectId  = parseInt(useParams().projectId)
    const { userAccess } = useOutletContext()

    function editIssue(item) {
        console.log(item)
        setUpdatingIssueID(item.issue.ID)
        setTitle(item.issue.title)
        setDescription(item.issue.description)
        setType(revTypes[item.issue.type])
        setSearchEmail(item.assignee?.email)
        setSearchUser(undefined)
        setAssignedUser(item.assignee)
        setAction('Update')
        dialog.current.showModal()
    }

    function showModal() {
        setUpdatingIssueID(0)
        setTitle('')
        setDescription('')
        setSearchEmail('')
        setSearchUser(undefined)
        setAssignedUser(null)
        setType('bug')
        setAction('Create')
        dialog.current.showModal()
    }

    async function handleSubmit() {

        const resp = await fetch(BASE_URL + '/issues', {
            method: action === 'Create' ? 'POST' : 'PUT',
            body: JSON.stringify({
                ID: updatingIssueID,
                title,
                description,
                assigneeId: assignedUser ? assignedUser.ID : 0,
                projectId: projectId,
                type: types[type]
            }),
            headers: {
                'content-type': 'application/json',
                'authorization': 'BEARER ' + localStorage.getItem('token')
            }
        })
        if (resp.ok) {
            const newIssue = await resp.json()
            console.log(newIssue)
            for (let i=0; i<issues.length; i++) {
                if (issues[i].issue.ID === newIssue.issue.ID) {
                    setIssues(prev => {
                        if (prev === null) 
                            return [newIssue]
                        const next = [...prev]
                        next[i] = newIssue
                        return next
                    })
                    return 
                }
            }
            setIssues(prev => [...prev, newIssue])
        }
    }

    function optionChange(e) {
        setType(e.target.value)
    }

    async function deleteIssue(item) {
        const resp = await fetch(BASE_URL + '/issues/' + item.issue.ID, {
            method: 'DELETE',
            headers: {
                'authorization': 'BEARER ' + localStorage.getItem('token')
            }
        })
        if (resp.ok) 
            setIssues(prev =>  prev.filter(i => i.issue.ID !== item.issue.ID))
        else {
            alert('something went wrong')
            throw Error('Couldnt delete issue')
        }
    }

    async function uploadImport(e) {
        e.preventDefault()
        const fileContent = await impFile.text()
        console.log(fileContent)

        const resp = await fetch(BASE_URL + '/issues/import?projectID=' + projectId, {
            method: 'POST',
            body: fileContent,
            headers: {
                'content-type': 'text/plain',
                'authorization': 'BEARER ' + localStorage.getItem('token')
            }
        })
        if (resp.ok) {
            const newIssues = await resp.json()
            if (issues === null) {
                setIssues(newIssues)
                return 
            }
            setIssues(prev => [...prev, ...newIssues])
            fileInputElement.current.value = null;
            uploadDialog.current.close()
        } else if (resp.status === 422) {
            alert(`Invalid data - please follow the format specified and ensure all users involved
            have been added to the project`)
        } else {
            alert('something went wrong')
        }
    }

    async function search(e) {
        if (searchEmail.length === 0) return;

        const resp = await fetch(BASE_URL + `/projects/members?email=${searchEmail}&projectID=${projectId}`, {
            headers: {
                'authorization': 'BEARER ' + localStorage.getItem('token')
            }
        })
        if (resp.ok) {
            const searchU = await resp.json()
            setSearchUser(searchU);
            setSearchEmail('');
        } else {
            alert('something went wrong')
            throw Error('couldnt search user')
        }
    }

    useEffect(() =>{
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
        }).then(data => { 
            console.log(data); setIssues(data); })
    // eslint-disable-next-line
    }, [])

    return (
        issues === null ? <PageLoader /> :
        <div id="issues" className='shadow-lg z-10'>
            <div className={"title-create box-border p-8 flex items-center " + 
                    (issues.length === 0 ? 'flex-col justify-center gap-6 m-auto w-fit h-full' : 'w-full gap-2 ')}>
                <p className="title text-3xl">Issues</p>
                {(userAccess & access.create) &&
                    <button
                        onClick={() => uploadDialog.current.showModal()} 
                        className={issues.length === 0 ? 'low-emph' : 
                            'mr-auto flex aspect-square hover:bg-slate-100 p-2 rounded-full items-center text-slate-500'}
                        title='import issues as CSV'>
                        <span class="material-symbols-outlined w-full">
                            upload_file
                        </span>
                        {issues.length === 0 ? <p className='text-lg text-slate-500'>Upload</p> : ''}
                    </button>
                }

                {issues.length !== 0 && <>
                    <p className='border-l-[#0000FF65] border-l-4 h-full px-2 mx-2'>Task</p>
                    <p className='border-l-[#00FF0065] border-l-4 h-full px-2 mx-2'>Story</p>
                    <p className='border-l-[#FF000065] border-l-4 h-full px-2 mx-2'>Bug</p>
                </>}

                { (userAccess & access.create) !== 0 && 
                    <button className="high-emph" onClick={showModal}>
                        New Issue
                    </button>
                }
            </div>

            {issues.length > 0 && 
            <ul id='issues-list' className='w-full flex flex-col relative overflow-y-auto max-h-[70vh] cursor-default'>
                {issues.length === 0 ? <p>no issues</p> : <>
                    <li
                        id='issues-header'
                        className='border-t pl-3 w-[85%] mb-4 sticky top-0 shadow-[0_1rem_10px_1px_white] bg-white py-2 grid gap-7 text-slate-950 grid-rows-1 items-center grid-cols-4'>
                        <p>Title</p>
                        <p>Description</p>
                        <p>Assignee</p>
                        <p>Actions</p>
                    </li>
                    {issues.map(item => (
                        <li key={item.issue.ID} 
                            className='border-t pl-3 w-[85%] py-2 grid gap-7 text-slate-700 grid-rows-1 items-center grid-cols-4'>
                            <p 
                                data-type={'type'+item.issue.type}
                                title={item.issue.title}
                                className='w-full overflow-clip text-ellipsis'>
                                {item.issue.title}
                            </p>
                            <p  
                                title={item.issue.description}
                                className='w-full overflow-clip text-ellipsis'>{item.issue.description}</p>
                            {!item.assignee ? <p></p> :
                            <div className="user w-full flex gap-2 items-center overflow-clip text-ellipsis">
                                <div 
                                    style={{backgroundColor: item.assignee.color + '30', color: item.assignee.color}}
                                    className="pfp flex items-center justify-center aspect-square w-9 rounded-full">
                                        {item.assignee.username[0]}
                                    </div>
                                <p>{item.assignee.username}</p>
                            </div>}
                            <div className='flex gap-4 text-slate-300 buttons'>
                                {(userAccess & access.edit) !== 0 &&
                                    <button 
                                        title='Edit'
                                        onClick={() => editIssue(item)} 
                                        className='hover:text-slate-500'>
                                        <span class="material-symbols-outlined">
                                            edit
                                        </span>
                                    </button>
                                }
                                {(userAccess & access.delete) !== 0 &&
                                    <button 
                                        title='Delete'
                                        onClick={() => deleteIssue(item)} 
                                        className='hover:text-slate-500'>
                                        <span class="material-symbols-outlined">
                                            delete
                                        </span>
                                    </button>
                                }
                            </div>
                        </li>
                    ))} </>
                }
            </ul>}

            <dialog ref={dialog}>
                <form onSubmit={handleSubmit} 
                    className='py-8 px-16 flex gap-6 flex-col items-center justify-center'
                    method='dialog'>
                    <label 
                        className='flex flex-col gap-2 w-full'>
                        Title
                        <input 
                            className='border w-full rounded-sm px-[1rem] py-2 outline-none border-slate-400 text-sm'
                            type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
                    </label>
                    <label
                        className='flex flex-col gap-2 w-full'>
                        Description
                        <textarea rows="3" 
                            className='border w-full rounded-sm px-[1rem] py-2 outline-none border-slate-400 text-sm'
                            type="textarea" 
                            value={description}
                            onChange={e => setDescription(e.target.value)} required />
                    </label>
                    <div id="type-input-container">
                        <label className='flex items-center gap-1'>
                            <input 
                                className='accent-indigo-400 outline-0 w-full rounded-sm px-[1rem] py-2 outline-none border-slate-400 text-sm'
                                type="radio" name='type' required
                                value="task" defaultChecked={type === 'task'} onChange={optionChange} />
                            task
                        </label>
                        <label className='flex items-center gap-1'>
                            <input type="radio" name='type'
                                className='accent-indigo-400 outline-0 w-full rounded-sm px-[1rem] py-2 outline-none border-slate-400 text-sm'
                                value="story" defaultChecked={type === 'story'} onChange={optionChange} />
                            story 
                        </label>
                        <label className='flex items-center gap-1'>
                            <input type="radio" name='type'
                                className='accent-indigo-400 outline-0 w-full rounded-sm px-[1rem] py-2 outline-none border-slate-400 text-sm'
                                value="bug" defaultChecked={type === 'bug'} onChange={optionChange} />
                            bug    
                        </label>
                    </div>
                    <label 
                        className='flex w-full'
                        style={{flexDirection: 'row'}}>
                        <input 
                            className='border w-full border-r-0 rounded-sm px-[1rem] py-2 outline-none border-slate-400 text-sm'
                            type="text" placeholder='Search Assignee' 
                            value={searchEmail}
                            onChange={e => setSearchEmail(e.target.value)} />
                        <button type="button" 
                            className='border -ml-1 border-l-0 rounded-sm flex items-center aspect-square p-2 border-slate-400'
                            onClick={search}>
                            <span class="material-symbols-outlined text-slate-400 hover:text-slate-500"
                                title='search'>
                                search
                            </span></button>
                    </label>
                    {searchUser === undefined && assignedUser ?
                        <div id="assignedUser"
                            title='unassign'
                            className='grid active:scale-[.96] duration-200 cursor-pointer bg-green-50 gap-x-2 box-content rounded-md px-4 py-2 grid-rows-2 hover:bg-red-50 grid-cols-[20%_80%] w-[80%] h-auto overflow-hidden'
                            onClick={() => { setAssignedUser(null) }}>
                            <div
                                style={{ backgroundColor: assignedUser.color + '30', color: assignedUser.color }}
                                className='pfp rounded-full row-span-2 w-full p-2 flex items-center justify-center aspect-square'>
                                {assignedUser.username[0]}
                            </div>
                            <p className='text-sm w-full overflow-clip text-ellipsis'>{assignedUser.username}</p>
                            <p className='text-sm text-slate-500 text-ellipsis w-full overflow-clip'>{assignedUser.email}</p>
                        </div> :
                        searchUser === null ? <p>no such user</p> : searchUser !== undefined &&
                        <div id="searchResult" 
                            title='select'
                            className='grid active:scale-[.96] duration-200 cursor-pointer gap-x-2 box-content rounded-md px-4 py-2 grid-rows-2 hover:bg-slate-100 grid-cols-[20%_80%] w-[80%] h-auto overflow-hidden'
                            onClick={() => { setSearchUser(undefined); setAssignedUser(searchUser)}}>
                            <div   
                                style={{backgroundColor: searchUser.color + '30', color: searchUser.color}}
                                className='pfp rounded-full row-span-2 w-full p-2 flex items-center justify-center aspect-square'>
                                    { searchUser.username[0] }
                            </div>
                            <p className='text-sm w-full overflow-clip text-ellipsis'>{ searchUser.username }</p>
                            <p className='text-sm text-slate-500 text-ellipsis w-full overflow-clip'>{ searchUser.email }</p>
                        </div>
                    }
                    <button type='submit' className='med-emph'>
                        {action}
                    </button>
                </form>
            </dialog>

            <dialog ref={uploadDialog}>
                <form 
                    className='py-8 m-auto px-10 flex gap-6 flex-col items-center justify-center'
                    onSubmit={uploadImport}>
                    <code className='text-slate-500'>
                        <p>CSV STRUCTURE: <br /> title,description,type(1|2|3)[,assigneeEmail]</p>
                        <p>where 1: task, 2: story, 3: bug</p>
                        <br />
                        <p className='w-full text-left'>Example1: Jira,explore jira,2</p>
                        <p className='w-full text-left'>Example2: Zilla,explore Zilla,1,gagansai2010795@ssn.edu.in</p>
                        <br />
                        <p>NOTE: Assignees must already be registered on the application <br /> 
                            and must be added to this project prior to uploading
                        </p>
                    </code>
                    <input
                        ref={fileInputElement}
                        onChange={e => setImpFile(e.target.files[0])}
                        type='file'
                        name='file'
                        accept='.csv'
                        className='m-auto'
                        title='Import Issues from CSV' />
                    <button className='med-emph m-auto'>submit</button>
                </form>
            </dialog>
        </div>
    )
}