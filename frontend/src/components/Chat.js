import React from 'react';

const Chat = ({ messages, clickedUser }) => {
    const getAbsoluteImageUrl = (relativeUrl) => {
        return `http://localhost:8000/${relativeUrl}`;
    };

    return (
        <>
            <div className="chat-header">
                <div className="profile-pic-container">
                    <img src={getAbsoluteImageUrl(clickedUser.image)} alt={`${clickedUser.first_name}'s profile`} className="profile-pic"/>
                </div>
                <h3>{clickedUser.first_name}</h3>
            </div>
            <div className="chat-display">
                {messages.map((message, index) => (
                    <div key={index} className={`chat-message ${message.senderClass}`}>
                        <p>{message.message}</p>
                    </div>
                ))}
            </div>
        </>
    );
}

export default Chat;
