import { useState } from 'react'
import './App.css'
import Navbar from './component/Navbar'
import Playground from './component/Playground'
import ModelDiff from './component/ModelDiff'

type ToggleOption = 'playground' | 'model-diff'

function App() {
  const [active, setActive] = useState<ToggleOption>('playground')

  return (
    <div className="app">
      <Navbar active={active} onToggle={setActive} />

      <main className="main-panel">
        {active === 'playground' ? <Playground /> : <ModelDiff />}
      </main>
    </div>
  )
}

export default App
