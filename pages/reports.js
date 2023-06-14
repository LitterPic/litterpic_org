import React, {useState, useEffect} from 'react';
import {db} from '../lib/firebase'; // Assuming the db object is exported from your firebase.js file
import {collection, getDocs, query, where} from 'firebase/firestore';

const ReportsPage = () => {
    const [countries, setCountries] = useState([]);
    const [states, setStates] = useState([]);
    const [cities, setCities] = useState([]);
    const [selectedCountry, setSelectedCountry] = useState('');
    const [selectedState, setSelectedState] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [totalWeight, setTotalWeight] = useState(0);
    const [cityWeights, setCityWeights] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const userPostsRef = collection(db, 'userPosts');

                // Fetch distinct countries from Firebase
                const countriesQuery = query(userPostsRef);
                const countriesSnapshot = await getDocs(countriesQuery);
                const countrySet = new Set();
                countriesSnapshot.forEach((doc) => {
                    countrySet.add(doc.data().Country);
                });
                const countryList = Array.from(countrySet);
                setCountries(countryList);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        const fetchStates = async () => {
            try {
                const statesQuery = query(
                    collection(db, 'userPosts'),
                    where('Country', '==', selectedCountry)
                );
                const statesSnapshot = await getDocs(statesQuery);
                const stateSet = new Set();
                statesSnapshot.forEach((doc) => {
                    stateSet.add(doc.data().State);
                });
                const stateList = Array.from(stateSet);
                setStates(stateList);
            } catch (error) {
                console.error('Error fetching states:', error);
            }
        };

        if (selectedCountry) {
            fetchStates();
            setSelectedState(''); // Reset selected state when the country changes
            setSelectedCity(''); // Reset selected city when the country changes
        } else {
            setStates([]);
        }
    }, [selectedCountry]);

    useEffect(() => {
        const fetchCities = async () => {
            try {
                let citiesQuery = query(
                    collection(db, 'userPosts'),
                    where('Country', '==', selectedCountry)
                );
                if (selectedState) {
                    citiesQuery = query(
                        citiesQuery,
                        where('State', '==', selectedState)
                    );
                }
                const citiesSnapshot = await getDocs(citiesQuery);
                const citySet = new Set();
                citiesSnapshot.forEach((doc) => {
                    citySet.add(doc.data().City);
                });
                const cityList = Array.from(citySet);
                setCities(cityList);
            } catch (error) {
                console.error('Error fetching cities:', error);
            }
        };

        if (selectedCountry || selectedState) {
            fetchCities();
            setSelectedCity(''); // Reset selected city when the state changes
        } else {
            setCities([]);
        }
    }, [selectedCountry, selectedState]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            let weightQuery = query(collection(db, 'userPosts'));

            if (selectedCountry) {
                weightQuery = query(
                    weightQuery,
                    where('Country', '==', selectedCountry)
                );
            }
            if (selectedState) {
                weightQuery = query(
                    weightQuery,
                    where('State', '==', selectedState)
                );
            }
            if (selectedCity) {
                weightQuery = query(
                    weightQuery,
                    where('City', '==', selectedCity)
                );
            }

            const weightSnapshot = await getDocs(weightQuery);

            let total = 0;
            const cityWeightMap = new Map();
            weightSnapshot.forEach((doc) => {
                const city = doc.data().City;
                const state = doc.data().State;
                const country = doc.data().Country;
                const litterWeight = doc.data().litterWeight;

                total += litterWeight;

                if (!selectedCity || city === selectedCity) {
                    const key = selectedCity
                        ? `${city}, ${state}, ${country}`
                        : `${city}, ${state ? state + ',' : ''} ${country}`;

                    if (cityWeightMap.has(key)) {
                        cityWeightMap.set(key, cityWeightMap.get(key) + litterWeight);
                    } else {
                        cityWeightMap.set(key, litterWeight);
                    }
                }
            });

            setTotalWeight(total);
            setCityWeights(Array.from(cityWeightMap.entries()));
        } catch (error) {
            console.error('Error calculating total weight:', error);
        }
    };

    return (
        <div>

            <div className="banner">
                <img src="/images/reports_banner.webp" alt="Banner Image"/>
            </div>

            <div className="page">
                <div className="content">
                    <h1 className="heading-text">Reports</h1>
                    <form onSubmit={handleSubmit}>
                        <label>
                            Country:
                            <select
                                value={selectedCountry}
                                onChange={(e) => setSelectedCountry(e.target.value)}
                            >
                                <option value="">Select a country</option>
                                {countries.map((country) => (
                                    <option key={country} value={country}>
                                        {country}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <br/>
                        <label>
                            State:
                            <select
                                value={selectedState}
                                onChange={(e) => setSelectedState(e.target.value)}
                                disabled={!selectedCountry}
                            >
                                <option value="">Select a state</option>
                                {states.map((state) => (
                                    <option key={state} value={state}>
                                        {state}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <br/>
                        <label>
                            City:
                            <select
                                value={selectedCity}
                                onChange={(e) => setSelectedCity(e.target.value)}
                                disabled={!selectedState}
                            >
                                <option value="">Select a city</option>
                                {cities.map((city) => (
                                    <option key={city} value={city}>
                                        {city}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <br/>
                        <button type="submit">Submit</button>
                    </form>
                    <div>

                        {cityWeights.length > 0 && (
                            <div>
                                <h2>Total Weight: {totalWeight}</h2>
                                <h3>Litter Weight By City</h3>
                                <ul>
                                    {cityWeights.map(([key, weight]) => (
                                        <li key={key}>
                                            {key}: {weight} lbs
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ReportsPage;
