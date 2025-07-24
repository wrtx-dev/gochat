import './style.css'

import React from 'react'
import ReactDOM from 'react-dom/client'
import "@renderer/locales/i18n"
import LiveApp from './page/livePage'



(async () => {

    ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
        <React.StrictMode>
            <LiveApp />
        </React.StrictMode>
    )
})();