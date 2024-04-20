const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { MongoClient } = require('mongodb')
const uri = process.env.URI
const {v4: uuidv4} = require('uuid')

module.exports = (app) => {
    app.post('/signup', async (req, res) => {
        // Extract email and password from request body
        const { email, password } = req.body
    
        // Create a new MongoDB client
        const client = new MongoClient(uri)
    
        try {
            // Connecting to the MongoDB database
            await client.connect();
            const database = client.db('app-data')
            const users = database.collection('users')
    
            // Check if user with the provided email already exists
            const oldUser = await users.findOne({ email: email.toLowerCase() })
            if (oldUser) {
                return res.status(409).send('The user associated with the email already exists. Please try again!')
            }
    
            // Generate a unique user ID
            const generatedUserId = uuidv4()
    
            //creating a salt value
            const salt = await bcrypt.genSalt(10)
    
            // Hash the password with the salt being 10
            const hashpwd = await bcrypt.hash(password, salt)
    
            const currentTime = new Date()
    
            // Construct user data object with lastSignedIn field
            const data = {
                user_id: generatedUserId,
                email: email.toLowerCase(), // Sanitize and ensure lowercase
                hashpwd: hashpwd,
                status: null,
                matches: [],
                pendingMatches: [],
                mismatches: [],
                joinedIn: currentTime,
                lastSignedIn: currentTime,
                lastSignOut: currentTime  // Set the lastSignedIn field to current date
            };
            
            // Insert new user into the database
            const newUser = await users.insertOne(data)
    
            // Generate JWT token
            const token = jwt.sign({ newUser, email: email.toLowerCase() }, process.env.SECRET, {
                expiresIn: '24h'
            });
    
            const stat = "null"
            // Send response with token, userId, and email
            res.status(201).json({ token, userId: generatedUserId, email: email.toLowerCase(), stat})
        } catch (error) {
            // Handle errors
            console.error("Error during signup:", error)
            res.status(500).send("Internal Server Error")
        } finally {
            // Close the MongoDB client
            await client.close()
        }
    });
    
    
    
    // For handling user login
    app.post('/login', async (req, res) => {
        const client = new MongoClient(uri)
        const { email, password } = req.body;
    
        try {
            // Connecting to the database
            await client.connect();
            const database = client.db('app-data')
            const users = database.collection('users')
    
            const user = await users.findOne({ email })
    
            // Check if a user with the provided email exists
            if (!user) {
                return res.status(400).send('Invalid Credentials')
            }
    
            // Check if user's password hash exists
            if (!user.hashpwd) {
                return res.status(400).send('Invalid Credentials')
            }
    
            // Compare the provided password with the hashed password
            const passwordMatch = await bcrypt.compare(password, user.hashpwd)
            if (passwordMatch) {
                // Update lastSignedIn timestamp
                const updateResult = await users.updateOne(
                    { user_id: user.user_id },
                    { $set: { lastSignedIn: new Date() } }
                );
    
                // Check if the update was successful
                if (updateResult.modifiedCount === 0) {
                    console.error('Failed to update lastSignedIn for user:', user.user_id)
                    return res.status(500).send('Failed to update login timestamp')
                }
    
                // If passwords match, generate JWT token and send response
                const token = jwt.sign({ user, email: email.toLowerCase() }, process.env.SECRET, {
                    expiresIn: '24h'
                });
                return res.status(201).json({ token, userId: user.user_id, email: email.toLowerCase() , status: user.status})
            } else {
                // If passwords don't match, send error response
                return res.status(400).send('Invalid Credentials')
            }
        } catch (error) {
            console.error('Error during login:', error)
            res.status(500).send('Internal Server Error')
        } finally {
            // Close the MongoDB client
            await client.close();
        }
    })   

    
}
