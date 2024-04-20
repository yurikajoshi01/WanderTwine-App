import { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { useCookies } from 'react-cookie'
import validator from 'validator'
import '@fortawesome/fontawesome-free/css/all.css'


const AuthModal = ({ setShowModal, isSignUp }) => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const [cookies, setCookie, removeCookie] = useCookies(['AuthToken', 'UserId', 'Status']);

    const navigate = useNavigate();

    const validatePassword = (password) => {
        if (!validator.isStrongPassword(password, {
            minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1
        })) {
            return 'Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one symbol (e.g., !@#).';
        }
        return ''
    };

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (isSignUp) {
            if (password !== confirmPassword) {
                setError('Passwords need to match!')
                return
            }

            const passwordError = validatePassword(password)
            if (passwordError) {
                setError(passwordError)
                return
            }
        }

        try {
            const response = await axios.post(`http://localhost:8000/${isSignUp ? 'signup' : 'login'}`, { email, password });
            setCookie('AuthToken', response.data.token)
            setCookie('UserId', response.data.userId)
            setCookie('Stat', response.data.stat)


            const success = response.status === 201;
            if (success && isSignUp) navigate('/accountcreation')
            if (success && !isSignUp) navigate('/dashboard')

            window.location.reload()
        } catch (error) {
            console.error(error)
            // Update error handling to differentiate between signup and login errors
            if (isSignUp) {
     
                setError(error.response?.data?.message || 'The Email is already in Use')
            } else {
                // Default error message for login failure
                setError('Invalid Credentials.')
            }
        }
    };

    const handleClick = () => {
        setShowModal(false)
    };

    
    return (
        <div className="auth-modal">
            <div className="close-icon" onClick={handleClick}>ⓧ</div>
            <h2>{isSignUp ? 'CREATE ACCOUNT' : 'LOG IN'}</h2>
            <p>By clicking Signing in or Logging in, you agree to our terms. Learn how we process your data in our Privacy Policy.</p>
            <form onSubmit={handleSubmit}>
                <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="Email"
                    required={true}
                    onChange={(e) => setEmail(e.target.value)}
                />
                
                <input
                    type="password"
                    id="password"
                    name="password"
                    placeholder="Password"
                    required={true}
                    onChange={(e) => setPassword(e.target.value)}
                />
                {isSignUp && (
                    <input
                        type="password"
                        id="password-check"
                        name="password-check"
                        placeholder="Confirm password"
                        required={true}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                )}
                <input className="secondary-button" type="submit" />
                <p style={{ color: 'red', fontWeight: 'bold' }}>{error}</p>
            </form>

            <hr/>
            <h2>Connect with your Fellow Traveller!</h2>
        </div>
    );
};

export default AuthModal
