import { useState } from 'react'
import io from 'socket.io-client'

const socket = io('http://localhost:8000', {
    withCredentials: true,
    transports: ['websocket']  // Force WebSocket usage
});

const ChatInput = ({ user, clickedUser }) => {
    const [textArea, setTextArea] = useState("")

    const addMessage = () => {
        const message = {
            from_userId: user?.user_id,
            to_userId: clickedUser?.user_id,
            message: textArea,
            timestamp: new Date().toISOString()  // Optionally adding timestamp client-side for immediate UI update
        };

        socket.emit('sendMessage', message);  
        setTextArea("");  // Clear input field after sending
    };

    return (
        <div className="chat-input">
            <textarea
                value={textArea}
                onChange={(e) => setTextArea(e.target.value)}
                placeholder="Type your message here..."
            />
            <button className="secondary-button" onClick={addMessage}>Send</button>
        </div>
    );
};

export default ChatInput;
