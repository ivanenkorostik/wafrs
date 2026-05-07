import './App.css'
import MapView from './components/MapView'
import Navbar from './components/navbar/navbar'

import RoutePanel from './components/routepanel/routepanel'
import Sidebar from './components/sidebar/sidebar'
import UserPanel from './components/user/userPanel'

function App() {
  

  return (
    <main className='app'>
      <MapView />
      <Navbar />
      <UserPanel />
      <RoutePanel />
      
      
      <Sidebar />
      
      
    </main>
  )
}

export default App
