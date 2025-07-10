import './style.css'

import React from 'react'
import ReactDOM from 'react-dom/client'
import "@renderer/locales/i18n"
import QuickApp from './page/minPage'



(async () => {

    ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
        <React.StrictMode>
            <QuickApp />
        </React.StrictMode>
    )
})();