import Nav from '../components/Nav'
import React, { useState, useEffect } from 'react';
import { useCookies } from 'react-cookie'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { countries as countriesList } from 'countries-list'
import citiesList from 'cities.json'

const AccountCreation = () => {
    const [cookies, setCookie, removeCookie] = useCookies(null)
    const [formData, setFormData] = useState({
        user_id: cookies.UserId,
        first_name: "",
        dob: "",
        gender_identity: "",
        status:"",
        gender_request: "",
        localcompanion_request: false,
        birthcountry: "",
        current_residence: "",
        current_city:null,
        destinationcountry:"",
        destinationcity: null,
        interest_one:"",
        interest_two:"",
        image: "",
        about: "",
        matches: []
    })

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
        const countryOptions = []
        for (const code in countriesList) {
            const country = countriesList[code]
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
   
        try {
             const formDataWithImage = new FormData();
        // Append all form data for submission
        Object.keys(formData).forEach(key => {
            formDataWithImage.append(key, formData[key]);
        });
            const response = await axios.put('http://localhost:8000/user', formDataWithImage);
            setCookie('Stat', response.data.stat);
            const success = response.status === 200;
            if (success) navigate('/dashboard');
        } catch (err) {
            console.log(err);
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
    

    const handleFileChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            const fileType = file.type
            const validTypes = ['image/png', 'image/jpeg', 'image/jpg']
            if (validTypes.includes(fileType)) {
                setFormData(prevState => ({ ...prevState, image: file }))
            } else {
                alert('Please select a valid image file (PNG, JPEG, JPG)')
            }
        }
    }

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
            <Nav
                minimal={true}
                setShowModal={() => {
                }}
                showModal={false}
            />

            <div className="onboarding">
                <h2>ACCOUNT UPDATE</h2>
                <p>Hey! You are on your way to find your fellow travelling mate. The purpose for collecting you information is to find you your optimal companion! It only takes a few minutes 😉</p>
                <form onSubmit={handleSubmit}>
                    <section>
                        <label htmlFor="first_name">Name</label>
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
                            <label htmlFor="more-gender-identity">Other</label>
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
                    <label htmlFor="birthcountry">Birth Country:</label>
                     {/* Dropdown for Birth Country */}
                     <select
                        id="birthcountry"
                        name="birthcountry"
                        value={formData.birthcountry}
                        className="custom-select" 
                        onChange={handleChange}
                        required={true}
                    >
                        <option value="">Select Birth Country</option>
                        {countryOptions.map((option, index) => (
                            <option key={index} value={option.value}>{option.label}</option>
                        ))}
                    </select>

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
                                required={false}
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
                            required={true}
                        />
                        <div className="photo-container">
                            {formData.image && <img src={URL.createObjectURL(formData.image)} alt="profile pic preview" />}
                        </div>
                    </section>

                </form>
            </div>
        </>
    )
}
export default AccountCreation