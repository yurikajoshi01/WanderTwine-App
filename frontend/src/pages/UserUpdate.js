import NewNav from '../components/NewNav'
import React, { useState, useEffect } from 'react';
import { useCookies } from 'react-cookie'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { countries as countriesList } from 'countries-list'
import citiesList from 'cities.json'

const UserUpdate = () => {
    const [cookies] = useCookies(['user'])
    const [formData, setFormData] = useState({
        user_id: cookies.UserId,
        first_name: "",
        dob: "",
        gender_identity: "",
        status:"",
        gender_request: "",
        localcompanion_request: false,
        current_residence: "",
        current_city:"",
        destinationcountry:"",
        destinationcity:"",
        interest_one:"",
        interest_two:"",
        image: "",
        about: "",
    })
    const [initialState, setInitialState] = useState({ ...formData })
    const userId = cookies.UserId

    const [errors, setErrors] = useState({
        gender_identity: false,
        status: false,
        gender_request: false,
    });
    
    const [cityOptions, setCityOptions] = useState([]);  //State required for destination city options
    const [currentCityOptions, setCurrentCityOptions] = useState([]); //State required for current city of companions

    let navigate = useNavigate()

      // Function to create an array of country options for the dropdown
    const getCountryOptions = () => {
        const countryOptions = [];
        for (const code in countriesList) {
            const country = countriesList[code];
            countryOptions.push({ label: country.name, value: code });
        }
        return countryOptions;
    }

    const countryOptions = getCountryOptions(); // Array of country options


    const handleSubmit = async (e) => {
        e.preventDefault();
        // Check if the status is Wanderer and destination country and city is not selected
        if (formData.status === "wanderer") {
            if (!formData.destinationcountry) {
                alert("Please select a destination country.");
                document.getElementById('destinationcountry').focus();
                return;
            }
            if (!formData.destinationcity) {
                alert("Please select a destination city.");
                document.getElementById('destinationcity').focus();
                return;
            }
        }
         // Check if the status is Wanderer and destination country and city is not selected
         if (formData.status === "companion") {
            if (!formData.current_city) {
                alert("Please select a City You are In.");
                document.getElementById('current_city').focus();
                return;
            }
        }
        // Validation checks
    let hasError = false;
    let newErrors = {
        gender_identity: !formData.gender_identity,
        status: !formData.status
    };

    if (newErrors.gender_identity || newErrors.status) {
        hasError = true;
        setErrors(newErrors);
    }

    if (hasError) {
        // Stop the form submission if there is an error
        return;
    }
    if (!hasError) {
       
    const formDataWithImage = new FormData();
    Object.keys(formData).forEach(key => {
        let value = formData[key];
        // Check if it's a boolean and convert to string if necessary
        if (typeof value === 'boolean') {
            value = String(value);
        }
        if (key !== 'image' && formData[key] !== initialState[key]) {
            formDataWithImage.append(key, formData[key]);
        }
      
    });

    if (formData.image instanceof File) {
        formDataWithImage.append('image', formData.image);
    }

    // Submit the formDataWithImage to the backend
    try {
        const response = await axios.patch(`http://localhost:8000/user/${userId}`, formDataWithImage, {
            headers: {'Content-Type': 'multipart/form-data'}
        });
        if (response.status === 200) {
            navigate('/dashboard');
            setInitialState(formData);  // Update initialState after successful update
        } else {
            console.log('Error updating user:', response.statusText);
        }
    } catch (err) {
        console.log('Error:', err);
    }
}
    }
    
    

     // Possible Travelling interests options
     const travelInterestOptions = [
        { label: "Adventure Sports", value: "adventure_sports" },
        { label: "Adventure Travel", value: "adventure_travel" },
        { label: "Cultural Exploration", value: "cultural_exploration" },
        { label: "Dark Tourism", value: "dark_tourism" },
        { label: "Food Exploration", value: "food_exploration" },
        { label: "Rural Tourism", value: "rural_tourism" },
        { label: "Trekking / Hiking", value: "trekking"},
        { label: "Wildlife Capture", value: "wildlife_capture"}       
    ];


    const convertToBoolean = value => {
        if (typeof value === 'string') {
            return value.toLowerCase() === 'true'
        }
        return value
    }

    
    
   
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await axios.get(`http://localhost:8000/user/${userId}`);
                if (response.status === 200) {
                    let userData = response.data;
                    // Apply conversion to boolean where necessary
                    userData.localcompanion_request = convertToBoolean(userData.localcompanion_request);
                    // Assume any other fields that need conversion are handled similarly
                    setFormData(userData);
                    setInitialState(userData);
                } else {
                    console.log('Error fetching user data:', response.statusText);
                }
            } catch (error) {
                console.log('Error fetching user data:', error);
            }
        };
    
        fetchUserData();
    }, [userId]);  // Dependency on userId ensures this runs only when userId changes
    


      // useEffect to update city options based on selected destination country or current residence
      useEffect(() => {
        // Update destination city options
        if (formData.destinationcountry) {
            const destinationCities = citiesList.filter(city => city.country === formData.destinationcountry);
            const destinationCityOptions = destinationCities.map(city => ({ label: city.name, value: city.name }));
            setCityOptions(destinationCityOptions);
        } else {
            setCityOptions([]);
        }
    
        // Update current city options for companions
        if (formData.current_residence) {
            const residenceCities = citiesList.filter(city => city.country === formData.current_residence);
            const residenceCityOptions = residenceCities.map(city => ({ label: city.name, value: city.name }));
            setCurrentCityOptions(residenceCityOptions);
        } else {
            setCurrentCityOptions([]);
        }
    }, [formData.destinationcountry, formData.current_residence]); // Adding formData.current_residence as a dependency
    
    useEffect(() => {
        return () => {
            // This cleanup function runs when the component unmounts or image changes
            if (formData.image && formData.image instanceof File) {
                URL.revokeObjectURL(formData.image);
            }
        };
    }, [formData.image]);
    

    
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const fileType = file.type;
            const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
            if (validTypes.includes(fileType)) {
                setFormData(prevState => ({ ...prevState, image: file }));
            } else {
                alert('Please select a valid image file (PNG, JPEG, JPG, WEBP)');
                setFormData(prevState => ({ ...prevState, image: null }));
            }
        }
    };
    

    const handleChange = (e) => {
        const value = e.target.type === "checkbox" ? e.target.checked : e.target.value
        const name = e.target.name

        setFormData((prevState) => ({
            ...prevState,
            [name]: value
        }))
    }

    return (
        <>
            <NewNav/>

            <div className="onboarding">
                <h2>ACCOUNT UPDATE</h2>

                <form onSubmit={handleSubmit}>
                    <section>
                        <label htmlFor="first_name">First Name</label>
                        <input
                            id="first_name"
                            type='text'
                            name="first_name"
                            placeholder="First Name"
                            required={true}
                            value={formData.first_name}
                            onChange={handleChange}
                        />

                        <label>Date of Birth</label>
                    
                            <input
                                id="dob"
                                type="date"
                                name="dob"
                                required={true}
                                value={formData.dob}
                                onChange={handleChange}
                            />

                        <label>Gender</label>
                        <div className="multiple-input-container">
                            <input
                                id="man-gender-identity"
                                type="radio"
                                name="gender_identity"
                                value="man"
                                onChange={(e) => {
                                    handleChange(e);
                                    setErrors({ ...errors, gender_identity: false });
                                }}
                                checked={formData.gender_identity === "man"}
                            />
                            <label htmlFor="man-gender-identity">Man</label>
                            <input
                                id="woman-gender-identity"
                                type="radio"
                                name="gender_identity"
                                value="woman"
                                onChange={(e) => {
                                    handleChange(e);
                                    setErrors({ ...errors, gender_identity: false });
                                }}
                                checked={formData.gender_identity === "woman"}
                            />
                            <label htmlFor="woman-gender-identity">Woman</label>
                            <input
                                id="more-gender-identity"
                                type="radio"
                                name="gender_identity"
                                value="lgbtq"
                                onChange={(e) => {
                                    handleChange(e);
                                    setErrors({ ...errors, gender_identity: false });
                                }}
                                checked={formData.gender_identity === "lgbtq"}
                            />
                            <label htmlFor="more-gender-identity">LGBTQ</label>
                        </div>
                        {errors.gender_identity && <p className="error-message">Please select your gender identity.</p>}


                        <label>Status: <p>If you are searching for a companion for travelling(aka guide) please select your status as Wanderer else if you want to be a companion to the fellow wanderer, please select Companion.</p></label>
                        <div className="multiple-input-container">
                            <input
                                id="companion"
                                type="radio"
                                name="status"
                                value="companion"
                                onChange={(e) => {
                                    handleChange(e);
                                    setErrors({ ...errors, status: false });
                                }}
                        
                                checked={formData.status === "companion"}
                            />
                            <label htmlFor="companion">Companion</label>
                            <input
                                id="wanderer"
                                type="radio"
                                name="status"
                                value="wanderer"
                                
                                onChange={(e) => {
                                    handleChange(e);
                                    setErrors({ ...errors, status: false });
                                }}
                        
                                checked={formData.status === "wanderer"}
                            />
                            <label htmlFor="wanderer">Wanderer</label>
                        </div>
                        {errors.status && <p className="error-message">Please select your status.</p>}

                        <label>Request for users based on genders:</label>

                        <div className="multiple-input-container">
                            <input
                                id="man-gender-interest"
                                type="radio"
                                name="gender_request"
                                value="man"
                                onChange={handleChange}
                                checked={formData.gender_request === "man"}
                            />
                            <label htmlFor="man-gender-interest">Man</label>
                            <input
                                id="woman-gender-interest"
                                type="radio"
                                name="gender_request"
                                value="woman"
                                onChange={handleChange}
                                checked={formData.gender_request === "woman"}
                            />
                            <label htmlFor="woman-gender-interest">Woman</label>
                            <input
                                id="everyone-gender-interest"
                                type="radio"
                                name="gender_request"
                                value="everyone"
                                onChange={handleChange}
                                checked={formData.gender_request === "everyone"}
                            />
                            <label htmlFor="everyone-gender-interest">Everyone</label>

                        </div>

                        <label htmlFor="localcompanion_request">Connect to Local People: <p>If you tick it, it will find you local companion based on your Destination nation, else anyone currently in the Destination Country.</p></label>

                        <input
                            id="localcompanion_request"
                            type="checkbox"
                            name="localcompanion_request"
                            onChange={handleChange}
                            checked={formData.localcompanion_request}
                        />

                    <label htmlFor="interests">Interests:</label>
                    <div className="multiple-input-container">
                        
                        <select
                        id="interest_one"
                        name="interest_one"
                        required={true}
                        value={formData.interest_one}
                        onChange={handleChange}
                        className="custom-select" 
                    >
                        <option value="">Select Interest 1</option>
                        {travelInterestOptions.map((option, index) => (
                            <option key={index} value={option.value}>{option.label}</option>
                        ))}
                    </select>

                    <select
                        id="interest_two"
                        name="interest_two"
                        required={true}
                        value={formData.interest_two}
                        onChange={handleChange}
                        className="custom-select" 
                    >
                        <option value="">Select Interest 2</option>
                        {travelInterestOptions.map((option, index) => (
                            <option key={index} value={option.value}>{option.label}</option>
                        ))}
                    </select>
                    </div>

                        <label htmlFor="about">About me</label>
                        <input
                            id="about"
                            type="text"
                            name="about"
                            required={true}
                            placeholder="I like long walks..."
                            value={formData.about}
                            onChange={handleChange}
                        />

                        <input type="submit"/>
                    </section>

                 
                    <section>
                    <label htmlFor="current_residence">Current Residence:</label>
                    <select
                        id="current_residence"
                        name="current_residence"
                        value={formData.current_residence}
                        onChange={handleChange}
                        className="custom-select" 
                        required={true}
                    >
                        <option value="">Select Current Residence</option>
                        {countryOptions.map((option, index) => (
                            <option key={index} value={option.value}>{option.label}</option>
                        ))}
                    </select>

                    {/* Current City selection only for Companion */}
                    {formData.status === "companion" && (
                        <>
                            <label htmlFor="current_city">Current City:</label>
                            <select
                                id="current_city"
                                name="current_city"
                                value={formData.current_city}
                                onChange={handleChange}
                                className="custom-select"
                                required={formData.status === "companion"}
                            >
                                <option value="">Select Current City</option>
                                {currentCityOptions.map((option, index) => (
                                    <option key={index} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                        </>
                    )}

                   

                    {/* Destination Country and City selection only for Wanderer */}
                    {formData.status === "wanderer" && (
                        <>
                            <label htmlFor="destinationcountry">Destination Country:</label>
                            <select
                                id="destinationcountry"
                                name="destinationcountry"
                                value={formData.destinationcountry}
                                className="custom-select" 
                                onChange={handleChange}
                                required={formData.status === "wanderer"}
                            >
                                <option value="">Select Destination Country</option>
                                {countryOptions.map((option, index) => (
                                    <option key={index} value={option.value}>{option.label}</option>
                                ))}
                            </select>

                            <label htmlFor="destinationcity">Destination City:</label>
                            <select
                                id="destinationcity"
                                name="destinationcity"
                                value={formData.destinationcity}
                                onChange={handleChange}
                                className="custom-select" 
                                required={formData.status === "wanderer"}
                            >
                                <option value="">Select Destination City</option>
                                {cityOptions.map((option, index) => (
                                    <option key={index} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                        </>
                    )}

                        <label htmlFor="image">Profile Photo</label>
                        <input
                            type="file"
                            name="image"
                            id="image"
                            accept=".png, .jpeg, .jpg, .webp"
                            onChange={handleFileChange}
                            required={false}
                        />
                        <div className="photo-container">
                            {formData.image && formData.image instanceof File && (
                                <img src={URL.createObjectURL(formData.image)} alt="profile pic preview" />
                            )}
                        </div>

                    </section>

                </form>
            </div>
        </>
    )
}
export default UserUpdate

