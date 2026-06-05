import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { uiSettings } from './config/ui'
import './index.css'
import App from './App'

if (uiSettings.hideNumberInputSpinners) {
  document.documentElement.dataset.hideNumberSpinners = 'true'
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
