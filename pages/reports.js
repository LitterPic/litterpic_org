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
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [startDate, setStartDate] = useState("2022-01-01");
    const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
    const [leaderboard, setLeaderboard] = useState([]);

    const resetForm = () => {
        setSelectedCountry('');
        setSelectedState('');
        setSelectedCity('');
        setSelectedGroup('');
        setStartDate('2022-01-01');
        setEndDate(new Date().toISOString().split("T")[0]);
        setTotalWeight(0);
        setCityWeights([]);
        setIsSubmitted(false);
    };

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const usersSnapshot = await getDocs(collection(db, 'users'));
                const leaderboardData = [];

                for (const userDoc of usersSnapshot.docs) {
                    const userName = userDoc.data().display_name;
                    const organization = userDoc.data().organization;
                    const litterWeight = userDoc.data().totalWeight;

                    leaderboardData.push({
                        name: userName,
                        organization: organization,
                        litterWeight: litterWeight,
                    });
                }

                // Sort by litterWeight and take the top 5
                const sortedLeaderboard = leaderboardData.sort((a, b) => b.litterWeight - a.litterWeight).slice(0, 5);
                setLeaderboard(sortedLeaderboard);

            } catch (error) {
                console.error("Error fetching leaderboard:", error);
            }
        };

        fetchLeaderboard();
    }, []);

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
        setIsLoading(true);
        setIsSubmitted(true);
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

            weightSnapshot.forEach((doc) => {
                const timePosted = doc.data().timePosted.toDate(); // Convert Firestore timestamp to JavaScript Date object
                const postDate = new Date(timePosted);

                // Check if the post falls within the selected date range
                if (postDate >= new Date(startDate) && postDate <= new Date(endDate)) {
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
                }
            });

            setTotalWeight(total);
            setCityWeights(Array.from(cityWeightMap.entries()));

        } catch (error) {

        }
        setIsLoading(false);
    };

    return (
        <div>
            <div className="banner">
                <img src="/images/reports_banner.webp" alt="Banner Image"/>
            </div>
            <div className="page">
                <div className="content">
                    <h1 className="heading-text">Litter Stats</h1>
                    <div className="leaderboard">
                        <h2 className="report-top-litter-pickers">Top Litter Pickers</h2>
                        <div className="leaderboard-grid">
                            <table>
                                <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Organization</th>
                                    <th>Litter Weight</th>
                                </tr>
                                </thead>
                                <tbody>
                                {leaderboard.map((entry, index) => (
                                    <tr key={index}>
                                        <td>{entry.name}</td>
                                        <td>{entry.organization}</td>
                                        <td>{entry.litterWeight}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="interactive-litter-stats-header">Interactive Litter Stats</div>
                        <div className="report-form-group">
                            <div className="label-row grid-layout">
                                <div className="report-form-label">From</div>
                                <div className="report-form-label">To</div>
                                <div className="report-form-label">Organization</div>
                                <div className="report-form-label">Country</div>
                                <div className="report-form-label">State</div>
                                <div className="report-form-label">City</div>
                            </div>
                            <div className="input-row grid-layout">
                                <div className="report-label-mobile">From</div>
                                <input className="report-form-select input-smaller"
                                       type="date"
                                       value={startDate}
                                       onChange={(e) => setStartDate(e.target.value)}
                                />
                                <div className="report-label-mobile">To</div>
                                <input className="report-form-select input-smaller"
                                       type="date"
                                       value={endDate}
                                       onChange={(e) => setEndDate(e.target.value)}
                                />
                                <div className="report-label-mobile">Organization</div>
                                <select
                                    className={`report-form-select ${groups.length > 10 ? 'report-scrollable-dropdown' : ''}`}
                                    value={selectedGroup}
                                    onChange={(e) => setSelectedGroup(e.target.value)}
                                >
                                    <option value="">All Organizations</option>
                                    {groups.sort((a, b) => a.localeCompare(b)).map((group) => (
                                        <option key={group} value={group}>
                                            {group}
                                        </option>
                                    ))}
                                </select>
                                <div className="report-label-mobile">Country</div>
                                <select
                                    className={`report-form-select ${countries.length > 10 ? 'report-scrollable-dropdown' : ''}`}
                                    value={selectedCountry}
                                    onChange={(e) => setSelectedCountry(e.target.value)}
                                >
                                    <option value="">All Countries</option>
                                    {countries.sort((a, b) => a.localeCompare(b)).map((country) => (
                                        <option key={country} value={country}>
                                            {country}
                                        </option>
                                    ))}
                                </select>
                                <div className="report-label-mobile">State</div>
                                <select
                                    className={`report-form-select ${states.length > 10 ? 'report-scrollable-dropdown' : ''}`}
                                    value={selectedState}
                                    onChange={(e) => setSelectedState(e.target.value)}
                                    disabled={!selectedCountry}
                                >
                                    <option value="">All States</option>
                                    {states.sort((a, b) => a.localeCompare(b)).map((state) => (
                                        <option key={state} value={state}>
                                            {state}
                                        </option>
                                    ))}
                                </select>
                                <div className="report-label-mobile">City</div>
                                <select
                                    className={`report-form-select ${cities.length > 10 ? 'report-scrollable-dropdown' : ''}`}
                                    value={selectedCity}
                                    onChange={(e) => setSelectedCity(e.target.value)}
                                    disabled={!selectedState}
                                >
                                    <option value="">All Cities</option>
                                    {cities.sort((a, b) => a.localeCompare(b)).map((city) => (
                                        <option key={city} value={city}>
                                            {city}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <button className="report-submit-button" type="submit">Submit</button>
                            <button className="report-reset-button" type="button" onClick={resetForm}>Reset</button>
                        </div>
                    </form>
                    <div>
                        {isLoading ? (
                            <div className="report-is-loading">Loading...</div>
                        ) : isSubmitted && (
                            cityWeights.length > 0
                                ? (
                                    <div>
                                        <div className="report-total-weight">Litter Collected:
                                            <span className="report-weight-value">{totalWeight}</span>
                                            lbs

                                        </div>
                                        <table className="results-table">
                                            <thead>
                                            <tr>
                                                <th>Location</th>
                                                <th>Weight (lbs)</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {cityWeights.sort((a, b) => b[1] - a[1]).map(([key, weight]) => (
                                                <tr key={key}>
                                                    <td>{key}</td>
                                                    <td className="report-td-weight">{weight}</td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="report-no-data-message">
                                        <br/>No Data Yet <br/><br/>Let's change that, get out there and clean up some
                                        litter!
                                    </div>
                                )
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default withAuth(ReportsPage);
