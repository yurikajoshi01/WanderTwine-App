import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Chat from './Chat';
import ChatInput from './ChatInput';
import io from 'socket.io-client';

const socket = io('http://localhost:8000', {
    withCredentials: true,
    transports: ['websocket']  // Forcing WebSocket usage
});

const ChatDisplay = ({ user, clickedUser }) => {
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        const room = [user.user_id, clickedUser.user_id].sort().join('_');

        // Join new room
        socket.emit('joinRoom', room);

        const fetchChatHistory = async () => {
            try {
                const response = await axios.get('http://localhost:8000/messages', {
                    params: { userId: user.user_id, correspondingUserId: clickedUser.user_id }
                });
                const sortedMessages = response.data.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)).map(message => ({
                    ...message,
                    name: message.from_userId === user.user_id ? user.first_name : clickedUser.first_name,
                    senderClass: message.from_userId === user.user_id ? 'right' : 'left',
                }));
                setMessages(sortedMessages);
            } catch (error) {
                console.error('Failed to fetch messages:', error);
            }
        };

        fetchChatHistory();

        const handleNewMessage = (newMessage) => {
            const enrichedMessage = {
                ...newMessage,
                name: newMessage.from_userId === user.user_id ? user.first_name : clickedUser.first_name,
                senderClass: newMessage.from_userId === user.user_id ? 'right' : 'left',
                timestamp: newMessage.timestamp || new Date().toISOString()
            };
            setMessages(prevMessages => [...prevMessages, enrichedMessage].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)));
        };

        socket.on('messageReceived', handleNewMessage);

        return () => {
            // Leave room on cleanup
            socket.emit('leaveRoom', room);
            socket.off('messageReceived', handleNewMessage);
        };
    }, [user, clickedUser]);  // Re-run when user or clickedUser changes

    return (
        <>
            <Chat messages={messages} clickedUser={clickedUser}/>
            <ChatInput user={user} clickedUser={clickedUser}/>
        </>
    );
};

export default ChatDisplay;
