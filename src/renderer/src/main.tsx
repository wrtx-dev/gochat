import './style.css'

import React from 'react'
import ReactDOM from 'react-dom/client'
import "@renderer/locales/i18n"
import App from './App'
import { loadConfig } from './lib/data/config'



(async () => {
  const conf = await loadConfig();
  ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
      <App config={conf} />
    </React.StrictMode>
  )
})();





