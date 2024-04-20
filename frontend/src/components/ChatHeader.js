import { useCookies } from 'react-cookie';

const ChatHeader = ({ user }) => {
    const [cookies, setCookie, removeCookie] = useCookies(['user']);

    const getAbsoluteImageUrl = (relativeUrl) => {
        return `http://localhost:8000/${relativeUrl}`;
    };

    return (
        <div className="chat-container-header">
            <div className="profile">
                <div className="img-container">
                    <img src={getAbsoluteImageUrl(user.image)} alt={"photo of " + user.first_name} />
                </div>
                <h3>{user.first_name}</h3>
            </div>
        </div>
    );
}

export default ChatHeader;
