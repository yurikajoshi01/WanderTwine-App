import React, { useState } from 'react';
import ChatHeader from './ChatHeader';
import MatchedUsers from './MatchedUsers';
import ChatDisplay from './ChatDisplay';
import Requests from './Requests';

const ChatContainer = ({ user }) => {
    const [clickedUser, setClickedUser] = useState(null);
    const [view, setView] = useState('matches');  

 
     const addMatch = (newMatch) => {

        const existingMatchIndex = user.matches.findIndex(match => match.user_id === newMatch.user_id);
        if (existingMatchIndex === -1) {
            const updatedMatches = [...user.matches, newMatch]
           
            const updatedUser = { ...user, matches: updatedMatches }
        
            console.log("Add match:", updatedUser)
        }
    };

    const handleUserClick = (user) => {
        setClickedUser(user);
        setView('chat');  
    };

    return (
        <div className="chat-container">
            <ChatHeader user={user} />

            <div>
                <button className="option" onClick={() => { setClickedUser(null); setView('matches'); }}>
                    Matches
                </button>
                <button className="option" onClick={() => setView('chat')} disabled={!clickedUser}>
                    Chat
                </button>
                <button className="option" onClick={() => { setClickedUser(null); setView('requests'); }}>
                    Requests
                </button>
            </div>

            {/* Pass updated matches to MatchedUsers component */}
            {view === 'matches' && !clickedUser && <MatchedUsers matches={user.matches} setClickedUser={handleUserClick} />}
            {view === 'chat' && clickedUser && <ChatDisplay user={user} clickedUser={clickedUser} />}
            {view === 'requests' && !clickedUser && <Requests userId={user.user_id} addMatch={addMatch} />}
        </div>
    );
};

export default ChatContainer;
