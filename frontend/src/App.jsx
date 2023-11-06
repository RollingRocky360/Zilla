import './App.css'

import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';

import Projects from './components/Projects';
import Groups from './components/Groups';
import Profile from './components/Profile';
import Auth from './components/Auth';
import ProjectView from './components/ProjectView';
import Invitations from './components/Invitations';
import GroupMembers from './components/GroupMembers';

import Issues from './components/Issues'
import Board from './components/Board'
import Roles from './components/Roles'
import ProjectGroups from './components/ProjectGroups'
import People from './components/People'

import { useContext, useEffect } from 'react';
import { UserContext } from './contexts/UserContext';

import ProtectedRoutes from './routing-utils/ProtectedRoutes';

function App() {
  const { user, fetchUser } = useContext(UserContext)

  useEffect(() => {
    fetchUser()
  // eslint-disable-next-line
  }, [])

  return ( 
    <>
    { user === undefined ? 
      <div className='absolute animate-pulse bg-indigo-200 left-0 right-0 top-0 bottom-0 flex items-center justify-center'>
        <span className='text-3xl text-indigo-400'>
          Loading
        </span>
      </div> :
      <Router>
        <div id="app" className='w-full h-full'>
          <Routes>
            <Route element={<ProtectedRoutes />} >
              <Route path='/projects' element={<Projects />} />
              <Route path='/groups' element={<Groups />} />
              <Route path='/groups/:groupId' element={<GroupMembers />} />
              <Route path='/profile' element={<Profile />} />
              <Route path='/invites' element={<Invitations />} />
              <Route path='/project-view/:projectId' element={<ProjectView />}>
                <Route path='issues' element={<Issues />} />
                <Route path='board' element={<Board />} />
                <Route path='roles' element={<Roles />} />
                <Route path='groups' element={<ProjectGroups />} />
                <Route path='people' element={<People />} />
                <Route path='' element={<Navigate to='board' />} />
              </Route>
            </Route>
            <Route path='/auth' element={<Auth />} />
            <Route path='*' element={<Navigate to='/projects' replace />} />
          </Routes>
        </div>
      </Router>
    }
    </>
  );
}

export default App;
