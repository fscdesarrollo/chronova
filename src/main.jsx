import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { APP_NAME, APP_TAGLINE } from './brand'
import './index.css'

document.title = `${APP_NAME} — ${APP_TAGLINE}`

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
