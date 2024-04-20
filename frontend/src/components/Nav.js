import React from 'react';
import whitelogo from '../images/logo.png';
import { useNavigate } from 'react-router-dom';

const Nav = ({ minimal, setShowModal, showModal, setIsSignUp, authToken }) => {
    let navigate = useNavigate();

    // Define what happens when the button is clicked
    const handleAuthButtonClick = () => {
        if (authToken) {
            // Redirect to dashboard using React Router's navigate function
            navigate('/dashboard'); // Adjust the path as needed
        } else {
            // Show the login/signup modal
            setShowModal(true);
            setIsSignUp(false);
        }
    };

    return(
        <nav>
            <div className="logo-container">
                <img className="logo" src={minimal ? whitelogo : whitelogo} alt="Wandermate Logo" />
            
            </div>
            {!minimal && (
                <button className='nav-button' 
                        onClick={handleAuthButtonClick}
                        disabled={showModal}>
                    {authToken ? 'Dashboard' : 'Login'}
                </button>
            )}
        </nav>
    );
};

export default Nav;
