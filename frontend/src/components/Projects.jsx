import { useEffect, useRef, useState } from 'react'
// import '../styles/projects.css'
import { BASE_URL } from '../config'
import { Link } from 'react-router-dom'
import PageLoader from './PageLoader'

export default function Projects() {
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [projects, setProjects] = useState([])
    const [isPending, setIsPending] = useState(true)

    const dialog = useRef(null)

    async function handleSubmit(e) {
        const resp = await fetch(BASE_URL + '/projects', {
            method: 'POST',
            body: JSON.stringify({ title, description }),
            headers: {
                'content-type': 'application/json',
                'Authorization': 'BEARER ' + localStorage.getItem('token')
            }
        })
        if (resp.ok) {
            const newProj = await resp.json()
            setProjects(prev => [...prev, newProj])
            setTitle(''); setDescription('')
        } else {
            alert('something went wrong')
        }
    }

    useEffect(() => {
        fetch(BASE_URL + '/projects', { headers: { 'authorization': 'BEARER ' + localStorage.getItem('token') }})
            .then(resp => {
                if (!resp.ok) {
                    alert('something went wrong')
                    throw Error('couldnt fetch projects')
                } 
                return resp.json()
            })
            .then(data => { console.log(data); setProjects(data); setIsPending(false) })
    }, [])

    return (
        isPending ? <PageLoader /> :
        <div id="projects" className='py-8 px-24'>
            <div className={'title-create w-full flex ' + (projects.length > 0 ? 'justify-between' : 'flex-col row-[1/4] gap-8 h-full items-center justify-center')}>
                <p className="title text-3xl">Projects</p>
                <button className="high-emph" onClick={() => dialog.current.showModal()}>New Project</button>
            </div>
            {projects.length > 0 && <ul id="project-list" className='w-full h-full flex py-8 gap-9'>
                {projects.map(project => (
                    <Link to={`/project-view/${project.ID}`}>
                        <div className="project w-[13rem] h-[15rem] shadow-lg text-slate-500 flex flex-col justify-center items-start p-4 hover:shadow-xl duration-200 hover:scale-105">
                            <div className='flex gap-2 items-center border-b-[2px] py-2 w-full'>
                                <div className='aspect-square w-8 flex justify-center items-center'
                                    style={{backgroundColor: project.color + '30', color: project.color}}>{project.title[0]}</div>
                                <p className='project-title'>{project.title}</p>
                            </div>
                            <p className='project-description h-full w-full text-ellipsis py-2'>{ project.description }</p>
                            <div className="lead flex gap-2 py-2 border-t-[2px] w-full items-center">
                                <div
                                    style={{backgroundColor: project.creator.color + '30', color: project.creator.color}} 
                                    className="project-lead-pfp aspect-square rounded-full w-8 flex justify-center items-center">
                                    { project.creator.username[0] }
                                </div>
                                <p className='project-lead-name'>{ project.creator.username }</p>
                            </div>
                        </div>
                    </Link>
                ))}
            </ul>}

            <dialog ref={dialog}>
                <form onSubmit={handleSubmit} 
                    method='dialog' 
                    className='py-8 px-14 flex gap-6 flex-col items-center justify-center'>
                    <label className='flex flex-col gap-2 w-full'> 
                        Project Title
                        <input type="text" 
                            className='border w-full rounded-sm px-[1rem] py-2 outline-none border-slate-400 text-sm'
                            onChange={(e) => setTitle(e.target.value)} required/>
                    </label>
                    <label className='flex flex-col gap-2'>
                        Project Description
                        <textarea rows="5" type="textarea" 
                            className='border rounded-sm p-4 text-sm border-slate-400 text-inherit focus:outline-0'
                            onChange={e => setDescription(e.target.value)} required />
                    </label>
                    <button type='submit' className='med-emph'>
                        Create
                    </button>
                </form>
            </dialog>
        </div>
    )
}