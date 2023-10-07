import React, {useEffect, useState} from 'react';
import {db} from '../lib/firebase'; // Assuming the db object is exported from your firebase.js file
import {collection, getDocs, query, where} from 'firebase/firestore';
import withAuth from '../components/withAuth';

const ReportsPage = () => {
    const [countries, setCountries] = useState([]);
    const [states, setStates] = useState([]);
    const [cities, setCities] = useState([]);
    const [groups, setGroups] = useState([]);
    const [selectedCountry, setSelectedCountry] = useState('');
    const [selectedState, setSelectedState] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [selectedGroup, setSelectedGroup] = useState('');
    const [totalWeight, setTotalWeight] = useState(0);
    const [cityWeights, setCityWeights] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const groupsRef = collection(db, 'litterpickingOrganizations');
                const groupsQuery = query(groupsRef);
                const countriesSnapshot = await getDocs(groupsQuery);
                const groupsSet = new Set();
                countriesSnapshot.forEach((doc) => {
                    groupsSet.add(doc.data().Name);
                });
                const groupsList = Array.from(groupsSet);
                setGroups(groupsList);
            } catch (error) {

            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const userPostsRef = collection(db, 'userPosts');
                const countriesQuery = query(userPostsRef);
                const countriesSnapshot = await getDocs(countriesQuery);
                const countrySet = new Set();
                countriesSnapshot.forEach((doc) => {
                    countrySet.add(doc.data().Country);
                });
                const countryList = Array.from(countrySet);
                setCountries(countryList);
            } catch (error) {

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
                    if (doc.data().State) {
                        stateSet.add(doc.data().State);
                    }
                });
                const stateList = Array.from(stateSet);
                setStates(stateList);
            } catch (error) {

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
                    if (doc.data().City) {
                        citySet.add(doc.data().City);
                    }
                });
                const cityList = Array.from(citySet);
                setCities(cityList);
            } catch (error) {

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
            // Step 1: Get user IDs belonging to the selected group
            let userIds = [];
            if (selectedGroup) {
                const normalizedSelectedGroup = selectedGroup.toLowerCase().trim();
                const usersSnapshot = await getDocs(collection(db, 'users'));
                userIds = usersSnapshot.docs
                    .filter(doc => {
                        const orgName = doc.data().organization ? doc.data().organization : null;
                        return orgName && orgName.toLowerCase().trim() === normalizedSelectedGroup;
                    })
                    .map(doc => doc.id);
            }


            // Step 2: Filter userPosts based on the selected country, state, and city
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

            // Additional filtering based on userIds
            weightSnapshot.forEach((doc) => {
                const postUserRef = doc.data().postUser;
                const userId = postUserRef.id;

                if (selectedGroup && userIds.length === 0) {
                    return;
                }

                if (userIds.length === 0 || userIds.includes(userId)) {
                    const city = doc.data().City;
                    const state = doc.data().State;
                    const country = doc.data().Country;
                    const litterWeight = doc.data().litterWeight;
                    total += litterWeight;

                    if (!selectedCity || city === selectedCity) {
                        const key = `${city ? city + ',' : ''} ${state ? state + ',' : ''} ${country}`;
                        if (cityWeightMap.has(key)) {
                            cityWeightMap.set(key, cityWeightMap.get(key) + litterWeight);
                        } else {
                            cityWeightMap.set(key, litterWeight);
                        }
                    }
                }
            });

            setTotalWeight(total);
            setCityWeights(Array.from(cityWeightMap.entries()));

        } catch (error) {

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
                        <div className="report-form-group">
                            <div className="label-row">
                                <label className="report-form-label">Organization</label>
                                <label className="report-form-label">Country</label>
                                <label className="report-form-label">State</label>
                                <label className="report-form-label">City</label>
                            </div>
                            <div className="input-row">
                                <select className="report-form-select"
                                        value={selectedGroup}
                                        onChange={(e) => setSelectedGroup(e.target.value)}
                                >
                                    <option value="">Select your Group</option>
                                    {groups.map((group) => (
                                        <option key={group} value={group}>
                                            {group}
                                        </option>
                                    ))}
                                </select>
                                <select className="report-form-select"
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
                                <select className="report-form-select"
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
                                <select className="report-form-select"
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
                            </div>
                            <button type="submit">Submit</button>
                        </div>
                    </form>
                    <div>
                        {cityWeights.length > 0 && (
                            <div>
                                <div className="report-total-weight">Total Weight: <span
                                    className="report-weight-value"> {totalWeight}</span></div>
                                <table className="results-table">
                                    <thead>
                                    <tr>
                                        <th>City</th>
                                        <th>Weight (lbs)</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {cityWeights.sort((a, b) => b[1] - a[1]).map(([key, weight]) => (
                                        <tr key={key}>
                                            <td>{key}</td>
                                            <td>{weight}</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default withAuth(ReportsPage);
