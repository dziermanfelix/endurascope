import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

// Prevent scroll-wheel from changing focused numeric inputs
document.addEventListener(
  'wheel',
  (e) => {
    const el = document.activeElement
    if (
      el instanceof HTMLInputElement &&
      (el.type === 'number' || el.inputMode === 'decimal' || el.inputMode === 'numeric')
    ) {
      e.preventDefault()
    }
  },
  { passive: false },
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
