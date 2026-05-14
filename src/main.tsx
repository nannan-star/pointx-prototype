import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { DemoPersonaProvider } from './context/DemoPersonaContext'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <DemoPersonaProvider>
        <App />
      </DemoPersonaProvider>
    </BrowserRouter>
  </StrictMode>,
)
