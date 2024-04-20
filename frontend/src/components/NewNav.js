import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useCookies } from 'react-cookie';
import './css/NewNav.css';
import whitelogo from '../images/logo.png';
import { useNavigate } from 'react-router-dom';

const NewNav = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState(0);
    const [cookies, setCookie, removeCookie] = useCookies(['user'])
    const [showNotifications, setShowNotifications] = useState(false);
    const [notificationList, setNotificationList] = useState([]);

    const userId = cookies.UserId

    const navigate = useNavigate(); // Hook for navigating

   
    const logout = () => {
        removeCookie('UserId', cookies.UserId);
        removeCookie('AuthToken', cookies.AuthToken);
        navigate('/'); // Redirect to the home page
    };

    const toggleNotificationsDropdown = async () => {
        if (showNotifications) {
            // When closing the dropdown, delete all notifications
            try {
                const response = await axios.delete(`http://localhost:8000/notifications/deleteAll/${userId}`);
                console.log('Deleting notifications for userId:', userId);
                if (response.status === 200) {
                    setNotificationList([]); // Clear the notifications from state
                    setNotifications(0); // Reset the notification count
                }
            } catch (error) {
                
                console.error('Error deleting all notifications:', error);
            }
        }
        setShowNotifications(!showNotifications);
    };
    

   
    const toggleMenu = () => setIsOpen(!isOpen);

    const fetchNotifications = async () => {
        try {
            const response = await axios.get('http://localhost:8000/notifications', { params: { userId } });
            setNotifications(response.data.length);  // Set the count of notifications
            setNotificationList(response.data);  // Store the full notifications for display
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const handleNotificationClick = async (notificationId, event) => {
        event.stopPropagation(); // This stops the click event from propagating further
        try {
            const response = await axios.delete(`http://localhost:8000/deleteNotification/${notificationId}`);
            if (response.status === 200) {
                setNotificationList(prevList => prevList.filter(notif => notif.notificationId !== notificationId));
            } else {
                console.error('Failed to delete notification:', response.status);
            }
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };  
    
    useEffect(() => {
        const intervalId = setInterval(fetchNotifications, 2000);  
        return () => clearInterval(intervalId);
    }, [userId]);

    return (
        <nav className="navibar">
            <div className="logos-container">
                <img src={whitelogo} alt=" Logo" style={{ height: '40px' }} />
            </div>
            <div className="menu-icon" onClick={toggleMenu}>
                ☰
            </div>
            <ul className={isOpen ? "navi-links open" : "navi-links"}>
                <li><a href="/">Home</a></li>
                <li><a href="/dashboard">Dashboard</a></li>
                <li><a href="/usersdisplay">Find Users</a></li>
                <li><a href="/userupdate">Profile</a></li>
                <button className="notification-button" onClick={toggleNotificationsDropdown}>
                    🔔
                    {notifications > 0 && <span className="notification-count">{notifications}</span>}
                </button>
                <li></li>
                <li><i classname="log-out" class="fa" onClick={logout}>&#160; &#xf08b;</i></li>
                {showNotifications && (
        <div className="notifications-dropdown">
            {notificationList.length > 0 ? (
                notificationList.map((notif, index) => (
                    <div key={index} className="notification-item" onClick={(e) => handleNotificationClick(notif.notificationId, e)}>
                    {notif.message}
                </div>
                ))
            ) : (
                <div className="notification-item">No notifications</div>
            )}
                  </div>
                )}
            </ul>
        </nav>
    );
};

export default NewNav;
