import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Requests = ({ userId, addMatch}) => {
    const [requests, setRequests] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    
    const closeOverlay = () => setSelectedUser(null);

    const fetchRequests = async () => {
        try {
            const response = await axios.get('http://localhost:8000/getrequests', { params: { userId } });
            setRequests(response.data);
        } catch (error) {
            console.error('Error fetching requests:', error);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, [userId]);

    // Requests component
    const handleAccept = async (senderId) => {
        try {
            const response = await axios.put('http://localhost:8000/acceptrequest', { userId, senderId });
            
            if (response.data) {
                const newUserResponse = await axios.get('http://localhost:8000/users', {
                    params: { userIds: JSON.stringify([senderId, userId]) }
                });
    
                if (newUserResponse.data && newUserResponse.data.length > 0) {
                    // Update matches for the accepting user
                    addMatch(newUserResponse.data.find(user => user.user_id === userId));
                    // Update matches for the sender
                    addMatch(newUserResponse.data.find(user => user.user_id === senderId));
                }
    
                setRequests(prevRequests => prevRequests.filter(request => request.user_id !== senderId));
            }
        } catch (error) {
            console.error('Error accepting request:', error);
        }
    };
    


    const handleDecline = async (senderId) => {
        try {
            await axios.put('http://localhost:8000/declinerequest', { userId, senderId });
            setRequests(prevRequests => prevRequests.filter(request => request.user_id !== senderId));
        } catch (error) {
            console.error('Error declining request:', error);
        }
    };

    

    const getAbsoluteImageUrl = (relativeUrl) => {
        return `http://localhost:8000/${relativeUrl}`;
    };



    return (
        <div className='matches-display'>
            <h1>Friend Requests</h1>
            {requests.length > 0 ? (
                requests.map(request => (
                    <div key={request.user_id} className="request-card" onClick={() => setSelectedUser(request)}>
                        <div className="img-container">
                            <img src={getAbsoluteImageUrl(request.image)} alt={request.first_name} />
                        </div>
                        <p className="match-name">{request.first_name}</p>
                        <div>
                            <button className="accept-button " onClick={(e) => { e.stopPropagation(); handleAccept(request.user_id); }}>Accept</button>
                            <button className="decline-button" onClick={(e) => { e.stopPropagation(); handleDecline(request.user_id); }}>Decline</button>
                        </div>
                    </div>
                ))
            ) : (
                <p>☺</p>
            )}
            {selectedUser && (
                <ProfileOverlay user={selectedUser} closeOverlay={closeOverlay} getAbsoluteImageUrl={getAbsoluteImageUrl} />
            )}
        </div>
    );
};


const ProfileOverlay = ({ user, closeOverlay, getAbsoluteImageUrl }) => (
    <div className="profile-overlay">
        <div className="popup-card">
            <button className="close-button" onClick={closeOverlay}>ⓧ</button>
            <img src={getAbsoluteImageUrl(user.image)} alt={user.first_name} className="large-image" />

            <h2>{user.first_name}</h2>
            <p>{user.about}</p>
            <p>{user.current_residence}</p>
            <div className="interestscontainer">
            <span className="interests">{user.interest_one}</span>
            <span className="interests">  {user.interest_two}</span>

            </div>
        </div>
    </div>
);
export default Requests;
