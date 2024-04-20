import axios from "axios";
import { useEffect, useState } from "react";
import { useCookies } from "react-cookie";

const MatchedUsers = ({ matches, setClickedUser }) => {
  const [matchedProfiles, setMatchedProfiles] = useState([]);
  const [cookies] = useCookies(['UserId']);
  const [searchTerm, setSearchTerm] = useState('');  // State to hold the search term

  const matchedUserIds = matches.map(({ user_id }) => user_id);
  const userId = cookies.UserId;

  const getMatches = async () => {
    try {
      if (matchedUserIds.length === 0) {
        setMatchedProfiles([]);
        return;
      }
      const response = await axios.get("http://localhost:8000/users", {
        params: { userIds: JSON.stringify(matchedUserIds) },
      });
      setMatchedProfiles(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    getMatches();
    const intervalId = setInterval(getMatches, 1000);  // Poll every 2 seconds to refresh data
    return () => clearInterval(intervalId);
  }, [matches]);

  // Filtering profiles that include current user in their matches and match the search term
  const filteredMatchedProfiles = matchedProfiles.filter(profile =>
    profile.matches && profile.matches.some(match => match.user_id === userId) &&
    profile.first_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getAbsoluteImageUrl = (relativeUrl) => {
    return `http://localhost:8000/${relativeUrl}`;
  };

  return (
    <div className="matches-display">
      <input
        type="text"
        className="search-input"
        placeholder="🔎 Search by name..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      {filteredMatchedProfiles.map((match, index) => (
        <div
          key={index}
          className="match-card"
          onClick={() => setClickedUser(match)}
        >
          <div className="img-container">
            <img src={getAbsoluteImageUrl(match?.image)} alt={match?.first_name + " profile"} />
          </div>
          <h3 className="match-name">{match?.first_name}</h3>
        </div>
      ))}
    </div>
  );
  
};

export default MatchedUsers;
