import { Outlet } from "react-router-dom"


export default function PrivateRoute({ allowedRoles } : { allowedRoles: string[] }) {
  return (  
    <Outlet />
  )
}
