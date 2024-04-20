import TinderCard from 'react-tinder-card'
import {useEffect, useState} from 'react'
import ChatContainer from '../components/ChatContainer'
import {useCookies} from 'react-cookie'
import axios from 'axios'
import NewNav from '../components/NewNav'

const Dashboard = () => {
    const [user, setUser] = useState(null)
    const [FilteredUsers, setFilteredUsers] = useState(null)
    const [lastDirection, setLastDirection] = useState()
    const [cookies, setCookie, removeCookie] = useCookies(['user'])

    const userId = cookies.UserId


    const getUser = async () => {
        try {
            const response = await axios.get('http://localhost:8000/user', {
                params: {userId}
            })
            setUser(response.data)
        } catch (error) {
            console.log(error)
        }
    }

    const getFilteredUsers = async () => {
            try {
                const response = await axios.get('http://localhost:8000/filteredusers', {
                    params: {UserId: user.user_id}
                })
                setFilteredUsers(response.data)
            } catch (error) {
                console.log(error)
            }
    }
    

    useEffect(() => {
        console.log("Current userId from cookies:", userId);
        if (userId) {
            getUser();
        }
    }, [userId])  // Reacting to changes in userId
    

    useEffect(() => {
        if (user){
        getFilteredUsers()
        } // Calling the function to fetch users whenever the user object changes and is available
    }, [user])

    const updateMatches = async (matchedUserId) => {
        try {
            await axios.put('http://localhost:8000/addmatch', {
                userId,
                matchedUserId
            })
            getUser()
        } catch (err) {
            console.log(err)
        }
    }


    const swiped = (direction, swipedUserId) => {
        if (direction === 'right') {
            updateMatches(swipedUserId)
        } else if (direction === 'left') {
            axios.put('http://localhost:8000/addmismatch', {
                userId,
                mismatchedUserId: swipedUserId
            }).catch(err => console.log(err))
        }
        setLastDirection(direction);
    }

    const outOfFrame = (name) => {
        console.log(name + ' left the screen!')
    }


    const matchedUserIds = user?.matches.map(({user_id}) => user_id).concat(userId)

    const matchfilteredUsers = FilteredUsers?.filter(finalfilteredUser => !matchedUserIds.includes(finalfilteredUser.user_id))

    const getAbsoluteImageUrl = (relativeUrl) => {
        return `http://localhost:8000/${relativeUrl}`;
    };



   return (
    <>
        <NewNav/>
        {user && (
            <div className="dashboard">
                <ChatContainer user={user}/>
                <div className="swipe-container">
                    <div className="card-container">
                        {matchfilteredUsers?.map((finalfilteredUser) =>
                            <TinderCard
                                className="swipe"
                                key={finalfilteredUser.user_id}
                                onSwipe={(dir) => swiped(dir, finalfilteredUser.user_id)}
                                onCardLeftScreen={() => outOfFrame(finalfilteredUser.first_name)}
                            >
                                <div style={{ backgroundImage: `url(${getAbsoluteImageUrl(finalfilteredUser.image)})` }} className="card">
                                    <h3>{finalfilteredUser.first_name}</h3>
                                    <p>{finalfilteredUser.about}</p>
                                    <p>{finalfilteredUser.interest_one},{finalfilteredUser.interest_two}</p>
                                </div>
                            </TinderCard>
                        )}
                        {lastDirection && <div className="swipe-info">
                            <p>You swiped {lastDirection}</p>
                        </div>}
                    </div>
                </div>
            </div>
        )}
    </>
);

}
export default Dashboard
