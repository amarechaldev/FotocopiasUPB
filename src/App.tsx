import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <main>
      <h1>Hola mundo!!!!</h1>
      <p>Fotocopias UPB</p>
      <button type="button" onClick={() => setCount((count) => count + 1)}>
        Tocado {count} {count === 1 ? 'vez' : 'veces'}
      </button>
    </main>
  )
}

export default App
