const { MongoClient } = require('mongodb')
const multer = require('multer')
const path = require('path')
const uri = process.env.URI
const fs = require('fs')
const { v4: uuidv4 } = require('uuid')


// Multer configuration for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
    }
  });
const upload = multer({ storage: storage });

module.exports = (app) =>{
//EndPoints RELATED TO USERS:
// Route to get the logged-in user's data
app.get('/user', async (req, res) => {
    const client = new MongoClient(uri)
    const userId = req.query.userId

    if (!userId) {
        return res.status(400).send('User ID is required')
    }

    try {
        // Connecting to the database
        await client.connect();
        const database = client.db('app-data')
        const users = database.collection('users')

        // Fetching the user by ID
        const user = await users.findOne({ user_id: userId })

        if (!user) {
            return res.status(404).send('User not found')
        }

        // Send the found user's data back to the client
        res.json(user);
    } catch (error) {
        console.error('Error during getting user profile:', error)
        res.status(500).send('Internal Server Error')
    } finally {
        // Close the MongoDB client
        await client.close()
    }
});

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// Getting users with filters and sorting by exact common interests in Node.js
app.get('/filteredusers', async (req, res) => {
    const client = new MongoClient(uri);
    const loggedInUserId = req.query.UserId;

    try {
        await client.connect();
        const database = client.db('app-data');
        const users = database.collection('users');

        // Fetch the logged-in user details
        const loggedInUser = await users.findOne({ user_id: loggedInUserId })
        if (!loggedInUser) {
            return res.status(404).send('User not found');
        }

        // Define the date 16 days ago from today
        const daysAgo16 = new Date();
        daysAgo16.setDate(daysAgo16.getDate() - 16)

        let query = {
            user_id: { $ne: loggedInUserId },
            status: loggedInUser.status === 'wanderer' ? 'companion' : 'wanderer',
            lastSignedIn: { $gte: daysAgo16 } // Ensure users logged in within the last 16 days
        };

        // Add additional user preferences to the query
        if (loggedInUser.status === 'wanderer') {
            if (loggedInUser.localcompanion_request === "true") {
                query.birthcountry = loggedInUser.destinationcountry;
            } else {
                query.current_residence = loggedInUser.destinationcountry;
            }
        }
        else if (loggedInUser.status === 'companion') {
            // Companion logic to only take local wanderers if localcompanion_request is true
            if (loggedInUser.localcompanion_request === "true") {
                query.birthcountry = loggedInUser.current_residence; // Companions will look for wanderers coming to their current residence
            }
        }

        if (loggedInUser.gender_request !== 'everyone') {
            query.gender_identity = loggedInUser.gender_request
        }

        // Using aggregation to match interests, sort by the number of common interests, and randomize within those groups
        const pipeline = [
            { $match: query },
            { $addFields: {
                isNewUser: { $lte: ["$joinedIn", { $add: [new Date(), -24 * 60 * 60 * 1000] }] }, // Check if the user joined within the last 24 hours to ignore
                isCurrentlySignedIn: {
                    $or: [
                        { $gt: ["$lastSignedIn", "$lastSignOut"] },
                        { $and: [
                            { $eq: ["$lastSignedIn", "$lastSignOut"] }, 
                            "$isNewUser" // Using the boolean result from isNewUser
                        ]}
                    ]
                },
                common_interests: {
                    $size: {
                        $setIntersection: [
                            [loggedInUser.interest_one, loggedInUser.interest_two],
                            ["$interest_one", "$interest_two"]
                        ]
                    }
                },
                common_location: {
                    $cond: [
                        { $and: [
                            { $eq: ["$current_city", loggedInUser.destinationcity] },
                            { $eq: ["$current_residence", loggedInUser.destinationcountry] }
                        ]},
                        10, 0 // Bonus points for city match
                        
                    ]
                },
                score: {
                    $add: [
                        { $multiply: ["$common_interests", 10] },
                        "$common_location",
                        { $cond: ["$isCurrentlySignedIn", 5, 0] },
                        { $cond: [{ $in: ["$user_id", loggedInUser.mismatches] }, -1000, 0] }
                    ]
                },
                isMismatch: { $in: ["$user_id", loggedInUser.mismatches] },
                random: { $rand: {} }
            }},
            { $sort: { score: 1, common_interests: 1, common_location: 1, isCurrentlySignedIn: 1, isMismatch: -1, random: 1 } }
        ];
        
        const returningUsers = await users.aggregate(pipeline).toArray();
        res.json(returningUsers);

    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        await client.close();
    }
});


// Update User with a match
app.put('/addmatch', async (req, res) => {
    const client = new MongoClient(uri)
    const {userId, matchedUserId} = req.body

    try {
        await client.connect()
        const database = client.db('app-data')
        const users = database.collection('users')

        const query = {user_id: userId}
        const updateDocument = {
            $push: {matches: {user_id: matchedUserId}}
        }
        const user = await users.updateOne(query, updateDocument)
        res.send(user)
    } finally {
        await client.close()
    }
})


//////////////////////////////////////////////////////
// Getting all the Users by userIds in the Database for match
    app.get('/users', async (req, res) => {
        const client = new MongoClient(uri)
        const userIds = JSON.parse(req.query.userIds)
    
        try {
            await client.connect()
            const database = client.db('app-data')
            const users = database.collection('users')
    
            const pipeline =
                [
                    {
                        '$match': {
                            'user_id': {
                                '$in': userIds
                            }
                        }
                    }
                ]
    
            const foundUsers = await users.aggregate(pipeline).toArray()
    
            res.json(foundUsers)
    
        } finally {
            await client.close()
        }
    })

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //Creating account for the users with new informations
    app.put('/user', upload.single('image'), async (req, res) => {
        const client = new MongoClient(uri);
      
        try {
          await client.connect();
          const database = client.db('app-data')
          const users = database.collection('users')
          
          const formData = req.body;
          const query = { user_id: formData.user_id }
          let updateDocument = {
            $set: {
                ...formData,
                matches: [],
                image: req.file ? `uploads/${req.file.filename}` : formData.image
               
            }
          };
      
          const updatedUser = await users.updateOne(query, updateDocument)
          res.json(updatedUser);
        } catch (error) {
          res.status(500).json({ error: error.message })
        } finally {
          await client.close();
        }
      });
    
    
      app.patch('/user/:userId', upload.single('image'), async (req, res) => {
        const { userId } = req.params
        const client = new MongoClient(uri)
    
        try {
            await client.connect();
            const database = client.db('app-data')
            const users = database.collection('users')
    
            // Fetch the current user to get the old image path
            const currentUser = await users.findOne({ user_id: userId })
            if (!currentUser) {
                return res.status(404).send({ message: 'User not found' })
            }
    
            const formData = req.body;
            let updateDocument = { $set: {} }
    
            for (const key in formData) {
                if (formData[key] !== '' && formData[key] !== undefined && key !== '_id') {
                    updateDocument.$set[key] = formData[key]
                }
            }
    
            // Handle image update separately
            if (req.file) {
                // Delete the old image file if it exists
                if (currentUser.image) {
                    const oldImagePath = path.join(__dirname, currentUser.image)
                    fs.unlink(oldImagePath, (err) => {
                        if (err) {
                            console.error('Failed to delete old image:', err)
                            // Decide how to handle error - e.g., continue, return an error response, etc.
                        }
                    });
                }
    
                updateDocument.$set.image = `uploads/${req.file.filename}`
            }
    
            const result = await users.updateOne({ user_id: userId }, updateDocument)
    
            if (result.modifiedCount === 0) {
                return res.status(404).send({ message: 'No new data provided' })
            }
    
            res.json({ message: 'User updated successfully', userId: userId })
        } catch (error) {
            console.error('Failed to update user:', error)
            res.status(500).send({ message: 'Failed to update user', error: error.message })
        } finally {
            await client.close()
        }
    });
    
    
    
    
    // Getting a specific user's data based on user id's
    
    app.get('/user/:userId', async (req, res) => {
        const { userId } = req.params //extracting parameters
        const client = new MongoClient(uri)
    
        try {
            await client.connect()
            const database = client.db('app-data')
            const users = database.collection('users')
    
            // Fetch the user by ID
            const user = await users.findOne({ user_id: userId })
    
            if (!user) {
                return res.status(404).send({ message: 'User not found' })
            }
    
            // Send the found user's data back to the client
            res.json(user)
        } catch (error) {
            console.error('Error during getting user:', error)
            res.status(500).send({ message: 'Failed to get user', error: error.message })
        } finally {
            await client.close()
        }
    })
    
    //appending missmatched users
    app.put('/addmismatch', async (req, res) => {
        const client = new MongoClient(uri)
        const { userId, mismatchedUserId } = req.body
    
        try {
            await client.connect();
            const database = client.db('app-data')
            const users = database.collection('users')
    
            const updateResult = await users.updateOne(
                { user_id: userId },
                { $addToSet: { mismatches: mismatchedUserId } }
            );
    
            res.json(updateResult);
        } catch (error) {
            console.error('Error updating mismatches:', error)
            res.status(500).send('Internal Server Error')
        } finally {
            await client.close()
        }
    })
    
    //////////////////////////////////////////////////////////////////////////////////////////////////
    app.get('/searchusers', async (req, res) => {
    const client = new MongoClient(uri)
    const UserId = req.query.UserId
    const interestOne = req.query.interestOne
    const interestTwo = req.query.interestTwo
    const genderIdentity = req.query.gender
    const country = req.query.country // Country filter parameter
    const city = req.query.city // City filter parameter
    const localRequest = req.query.localRequest === 'true'


    try {
        await client.connect();
        const database = client.db('app-data')
        const users = database.collection('users')

        const loggedInUser = await users.findOne({ user_id: UserId })
        if (!loggedInUser) {
            return res.status(404).send('Logged-in user not found')
        }

        let filter = { user_id: { $ne: UserId }, status: loggedInUser.status === 'wanderer' ? 'companion' : 'wanderer' }

       
         if (loggedInUser.matches && loggedInUser.matches.length > 0) {
            filter.user_id = { $nin: loggedInUser.matches }
        }

        if (genderIdentity && genderIdentity !== 'everyone') {
            filter.gender_identity = genderIdentity
        }

        if (country) {
            let locationFilter = []
        
            if (loggedInUser.status === 'wanderer') {
                locationFilter.push({ current_residence: country })
                if (city) {
                    locationFilter.push({ current_city: city })
                }
            } else {
                locationFilter.push({ destinationcountry: country })
                if (city) {
                    locationFilter.push({ destinationcity: city })
                }
            }
        
            filter['$or'] = locationFilter
        }
        

        // Add interest filters
        if (interestOne && interestTwo) {
            filter['$or'] = [
                { interest_one: interestOne, interest_two: interestTwo },
                { interest_one: interestTwo, interest_two: interestOne }
            ];
        } else if (interestOne || interestTwo) {
            filter['$or'] = [
                { interest_one: interestOne },
                { interest_two: interestOne },
                { interest_one: interestTwo },
                { interest_two: interestTwo }
            ];
        }

         // Add local companion filter
         if (localRequest) { // Ensure this matches the parameter sent from the frontend
            if (loggedInUser.status === 'wanderer') {
                // Match companions whose birth country is the same as the selected  country
                filter.birthcountry = country
            } else {
                // Match wanderers whose birth country is the same as the selected  country
                filter.birthcountry = country
            }
        }
        
        

        const filteredUsers = await users.aggregate([
            { $match: filter },
            { $sample: { size: 100 } }
        ]).toArray()
        res.json(filteredUsers)
    } catch (error) {
        console.error('Failed to fetch users:', error)
        res.status(500).send('Internal Server Error')
    } finally {
        await client.close();
    }
});

    
app.post('/sendrequest', async (req, res) => {
    const client = new MongoClient(uri)
    const { senderId, receiverId } = req.body
    try {
        await client.connect();
        const database = client.db('app-data');
        const users = database.collection('users');
        const notifications = database.collection('notifications')

        // Retrieve the sender's first name
        const sender = await users.findOne({ user_id: senderId })

        // Add to receiver's pending matches
        const updateResult = await users.updateOne(
            { user_id: receiverId },
            { $addToSet: { pendingMatches: { user_id: senderId } } }
        );


        if (updateResult.modifiedCount === 1) {
            const notificationId = uuidv4()
            // Create a notification for the receiver
            await notifications.insertOne({
                notificationId,
                user_id: receiverId,
                type: 'new_request',
                message: `${sender.first_name} sent you a friend request!`,
                read: false,
                created_at: new Date()
            });
            res.status(200).send('Request sent')
        } else {
            res.status(400).send('Failed to send request')
        }
    } catch (error) {
        console.error('Failed to send request:', error)
        res.status(500).send('Error sending request')
    } finally {
        await client.close();
    }
});


    
    // Get pending match requests for a user
    app.get('/getrequests', async (req, res) => {
        const client = new MongoClient(uri)
        const { userId } = req.query
        try {
            await client.connect()
            const database = client.db('app-data')
            const users = database.collection('users')
    
            // First get the user's pending matches
            const user = await users.findOne({ user_id: userId }, { projection: { pendingMatches: 1 } })
            if (!user || !user.pendingMatches) {
                res.status(200).json([])
                return
            }
    
            // Now fetch details for each pending match user_id
            const pendingUserDetails = await Promise.all(user.pendingMatches.map(async ({ user_id }) => {
                return await users.findOne(
                    { user_id: user_id }, 
                    { projection: 
                        { first_name: 1, user_id: 1, about: 1, image: 1, interest_one: 1, interest_two: 1, current_residence: 1 } 
                    }
                )
            }))
    
            res.status(200).json(pendingUserDetails)
        } catch (error) {
            console.error('Failed to get requests:', error)
            res.status(500).send('Error getting requests')
        } finally {
            await client.close()
        }
    });
    
    app.put('/acceptrequest', async (req, res) => {
        const { userId, senderId } = req.body
        const client = new MongoClient(uri)
        try {
            await client.connect();
            const database = client.db('app-data')
            const users = database.collection('users')
            const notifications = database.collection('notifications')
    
            // Retrieve the acceptor's first name
            const acceptor = await users.findOne({ user_id: userId })
    
            // Update matches
            const updateReceiver = users.updateOne({ user_id: userId }, {
                $pull: { pendingMatches: { user_id: senderId } },
                $addToSet: { matches: { user_id: senderId } }
            });
            const updateSender = users.updateOne({ user_id: senderId }, {
                $addToSet: { matches: { user_id: userId } }
            });
    
            const results = await Promise.all([updateReceiver, updateSender]);
            if (results[0].modifiedCount === 1 && results[1].modifiedCount === 1) {
                const notificationId = uuidv4()
                // Create a notification for the sender
                await notifications.insertOne({
                    notificationId,
                    user_id: senderId,
                    type: 'request_accepted',
                    message: `${acceptor.first_name} accepted your friend request!`,
                    read: false,
                    created_at: new Date()
                })
                res.status(200).send("Request accepted and matches updated successfully.")
            } else {
                res.status(400).send("Failed to update matches. One of the updates did not modify any documents.")
            }
        } catch (error) {
            console.error('Failed to handle request:', error)
            res.status(500).send('Error handling request')
        } finally {
            await client.close();
        }
    });
    
    // Decline a friend request
    app.put('/declinerequest', async (req, res) => {
        const client = new MongoClient(uri)
        const { userId, senderId } = req.body
    
        try {
            await client.connect();
            const database = client.db('app-data')
            const users = database.collection('users')
    
            // Attempt to remove senderId from userId's pendingMatches
            const result = await users.updateOne(
                { user_id: userId },
                { $pull: { pendingMatches: { user_id: senderId } } }
            );
    
            // Check the result of the update operation
            if (result.modifiedCount === 0) {
                // No documents were modified, implying no pending request was found
                res.status(404).send('No such pending request found.')
            } else {
                // The pending request was successfully declined
                res.status(200).send('Request declined successfully.')
            }
        } catch (error) {
            console.error('Failed to decline request:', error)
            res.status(500).send('Error declining request')
        } finally {
            await client.close();
        }
    })

     
    app.get('/notifications', async (req, res) => {
        const { userId } = req.query;
        const client = new MongoClient(uri);
        try {
            await client.connect();
            const database = client.db('app-data')
            const notifications = database.collection('notifications')
    
            const userNotifications = await notifications.find({ user_id: userId }).toArray()
            res.json(userNotifications);
        } catch (error) {
            console.error('Failed to fetch notifications:', error)
            res.status(500).send('Error fetching notifications')
        } finally {
            await client.close();
        }
    });
    
    // Express.js route to delete all notifications for a specific user
    app.delete('/notifications/deleteAll/:userId', async (req, res) => {
    const { userId } = req.params
    const client = new MongoClient(uri)
    try {
        await client.connect()
        const database = client.db('app-data')
        const notifications = database.collection('notifications')

        // Delete all notifications for the specified user
        const deleteResult = await notifications.deleteMany({ user_id: userId })
        if (deleteResult.deletedCount > 0) {
            res.status(200).send('All notifications deleted successfully')
        } else {
            res.status(404).send('No notifications found to delete')
        }
    } catch (error) {
        console.error('Error deleting all notifications:', error)
        res.status(500).send('Internal server error')
    } finally {
        await client.close()
    }
});

    
    
}