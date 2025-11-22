import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './main.css'
import router from "./router.tsx";
import { RouterProvider } from "react-router-dom"

createRoot(document.getElementById('root')!).render(
  <StrictMode>
	<RouterProvider router={router}/>
  </StrictMode>,
)
