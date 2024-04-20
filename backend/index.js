const PORT = 8000
const express = require('express')
const { MongoClient, ObjectId } = require('mongodb')
const uri = "mongodb+srv://yukakookie:Boba123@rnativemernapp.ijv3xvt.mongodb.net/?retryWrites=true&w=majority&appName=RNativeMernApp"
const cors = require('cors')
const path = require('path')


// Capture unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.log('Unhandled Rejection at:', promise, 'reason:', reason);
   
});
require('dotenv').config()
const app = express()
const server = require('http').createServer(app);

const io = require('socket.io')(server, {
    cors: {
        origin: "http://localhost:5000",  // Allow only your frontend's origin
        methods: ["GET", "POST"],
        allowedHeaders: ["my-custom-header"],
        credentials: true
    }
});

app.use(cors())
app.use(express.json())

// Serving static files from the 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.get('/', (req,res) => {
    res.json('Hello this yuka!')
})

// Importing routes
require('./auth')(app)
require('./usersendpoints')(app)

//connecting to socket io and sending the conversation to the database.
io.on('connection', (socket) => {
    // User joins a room for a specific conversation
    socket.on('joinRoom', (room) => {
        console.log(`Joining room: ${room}`);
        socket.join(room);
    });

    // User leaves a room when they switch conversations or disconnect
    socket.on('leaveRoom', (room) => {
        console.log(`Leaving room: ${room}`);
        socket.leave(room);
    });

    socket.on('sendMessage', async (message) => {
        const client = new MongoClient(uri);
        try {
            await client.connect();
            const database = client.db('app-data');
            const conversations = database.collection('conversations');

            const participants = [message.from_userId, message.to_userId].sort();
            const conversationId = participants.join('_');

            const conversation = await conversations.findOne({ conversationId: conversationId });

            if (conversation) {
                await conversations.updateOne({ conversationId: conversationId }, { $push: { messages: message } });
            } else {
                await conversations.insertOne({ conversationId: conversationId, messages: [message] });
            }

            // Ensure message is emitted only to the specific conversation room
            io.to(conversationId).emit('messageReceived', message);
            console.log(`Message sent in room: ${conversationId}`);
        } catch (error) {
            console.error('Failed to send message:', error);
        } finally {
            await client.close();
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

//////////////////////////////////////////////////////
// Get Messages by from_userId and to_userId
app.get('/messages', async (req, res) => {
    const { userId, correspondingUserId } = req.query

    // Basic validation to ensure required parameters are provided
    if (!userId || !correspondingUserId) {
        return res.status(400).send({ message: "Missing required query parameters: userId or correspondingUserId" })
    }

    const client = new MongoClient(uri)

    try {
        await client.connect();
        const database = client.db('app-data')
        const conversations = database.collection('conversations')

        // Ensure IDs are treated consistently, assume they are strings
        const participants = [String(userId), String(correspondingUserId)].sort()
        const conversationId = participants.join('_');

        const conversation = await conversations.findOne({ conversationId: conversationId })

        res.send(conversation ? conversation.messages : []);
    } catch (error) {
        console.error("Failed to fetch messages: ", error);
        res.status(500).send({ message: "Failed to fetch messages", error: error })
    } finally {
        await client.close();
    }
});


server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    })


  