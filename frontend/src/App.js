import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import AccountCreation from './pages/AccountCreation'
import UserUpdate from './pages/UserUpdate'
import UsersDisplay from './pages/UsersDisplay'
import {BrowserRouter, Route, Routes} from 'react-router-dom'
import {useCookies} from 'react-cookie'

const App = () => {
    const [cookies, setCookie, removeCookie] = useCookies(['user'])

    const authToken = cookies.AuthToken
    const stat = cookies.Stat

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home/>}/>
                {authToken && <Route path="/dashboard" element={<Dashboard/>}/>}
                {authToken  && stat == null && <Route path="/accountcreation" element={<AccountCreation/>}/>}
                {authToken && stat !== null &&<Route path="/userupdate" element={<UserUpdate/>}/>}
                {authToken && <Route path="/usersdisplay" element={<UsersDisplay/>}/>}             
       

            </Routes>
        </BrowserRouter>
    )
}

export default App