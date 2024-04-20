import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useCookies } from 'react-cookie'
import NewNav from '../components/NewNav'
import ChatContainer from '../components/ChatContainer'
import { countries as countriesList } from 'countries-list'
import citiesList from 'cities.json'

 
const UsersDisplay = () => {
    const [user, setUser] = useState(null)
    const [filteredUsers, setFilteredUsers] = useState([])
    const [interestOne, setInterestOne] = useState('')
    const [interestTwo, setInterestTwo] = useState('')
    const [cookies] = useCookies(['user'])
    const [country, setCountry] = useState('')
    const [city, setCity] = useState('')
    const [localRequest, setLocalRequest] = useState(false)
    const [gender, setGender] = useState('everyone')
    const userId = cookies.UserId;

    const travelInterestOptions = [
        { label: "Select Interest", value: "" },
        { label: "Adventure Sports", value: "adventure_sports" },
        { label: "Adventure Travel", value: "adventure_travel" },
        { label: "Cultural Exploration", value: "cultural_exploration" },
        { label: "Dark Tourism", value: "dark_tourism" },
        { label: "Food Exploration", value: "food_exploration" },
        { label: "Rural Tourism", value: "rural_tourism" },
        { label: "Trekking / Hiking", value: "trekking" },
        { label: "Wildlife Capture", value: "wildlife_capture" }
    ];

    const genderOptions = [
        { label: "Gender: ", value: "everyone" },
        { label: "Man", value: "man" },
        { label: "Woman", value: "woman" },
        { label: "LGBTQ", value: "lgbtq" },
    
    ];
    // Convert countries from countries-list to array for dropdown
    const countryOptions = Object.entries(countriesList).map(([countryCode, { name }]) => ({
       label: name,  
       value: countryCode  
    }));
    

    // Filter cities based on selected country
    const filteredCities = citiesList.filter(c => c.country === country)

    const getUserAndFilteredUsers = async () => {
        if (!userId) return;
        try {
            const userResponse = await axios.get(`http://localhost:8000/user`, { params: { userId } })
            setUser(userResponse.data)

            const filteredUsersResponse = await axios.get(`http://localhost:8000/searchusers`, {
                params: { UserId: userId, interestOne, interestTwo, gender, country, city,localRequest: localRequest.toString() }
            });
            setFilteredUsers(filteredUsersResponse.data)
        } catch (error) {
            console.error('Error fetching user or filtered users:', error)
        }
    };

    useEffect(() => {
        getUserAndFilteredUsers()
    }, [userId, interestOne, interestTwo, gender, country, city, localRequest])

    const handleSendRequest = async (receiverId) => {
        const senderId = userId  
        try {
            const response = await axios.post('http://localhost:8000/sendrequest', {
                senderId: senderId,
                receiverId: receiverId
            });
            console.log('Request sent successfully', response.data)
           
        } catch (error) {
            console.error('Failed to send request:', error)
          
        }
    }
    

    return (
        <div>
            <NewNav />
            <div className="userdisplay">
                {user && <ChatContainer user={user} />}
                <div className="users-container">
                    <h1>Find Your Fellow Travellers:</h1>
                    <div>
                        <select value={interestOne} onChange={(e) => setInterestOne(e.target.value)}>
                            {travelInterestOptions.map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                        <select value={interestTwo} onChange={(e) => setInterestTwo(e.target.value)}>
                            {travelInterestOptions.map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>

                        <select value={gender} onChange={(e) => setGender(e.target.value)}>
                            {genderOptions.map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>

                        <select value={country} onChange={(e) => {
                                setCountry(e.target.value);
                                setCity(''); // Reset city when country changes
                            }}>
                                <option value="">Select Country</option>
                                {countryOptions.map(option => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>

                            <select value={city} onChange={(e) => setCity(e.target.value)}>
                                <option value="">Select City</option>
                                {filteredCities.map((c, index) => (
                                    <option key={`${c.name}-${c.country}-${index}`} value={c.name}>{c.name}</option>
                                ))}
                            </select>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={localRequest}
                                    onChange={() => setLocalRequest(!localRequest)}
                                />
                                Find Locals:
                            </label>



                    </div>
                    <div className="users-grid">
                        {filteredUsers.map((filteredUser) => (
                            <div key={filteredUser.user_id} className="user-card">
                                <img src={`http://localhost:8000/${filteredUser.image}`} alt={filteredUser.first_name} className="profile-pic"/>
                                <h3>{filteredUser.first_name || 'No Name'}</h3>
                                <p>About Me: {filteredUser.about || 'No additional information'}</p>
                                <div className="interests-container">
                                    {filteredUser.interest_one && <span className="interest">{filteredUser.interest_one}</span>}
                                    {filteredUser.interest_two && <span className="interest">{filteredUser.interest_two}</span>}
                                    
                                </div>
                                <button className="button" onClick={() => handleSendRequest(filteredUser.user_id)}>Send Request</button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UsersDisplay;
