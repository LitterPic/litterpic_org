import React, { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import ReportFilters from '../components/ReportFilters';

// Normalize country names (handle abbreviations and full names)
const normalizeCountry = (country) => {
    if (!country) return '';
    const normalized = country.trim().toUpperCase();
    const countryMap = {
        'US': 'United States',
        'USA': 'United States',
        'UNITED STATES': 'United States',
        'UNITED STATES OF AMERICA': 'United States',
        'CA': 'Canada',
        'CANADA': 'Canada',
        'MX': 'Mexico',
        'MEXICO': 'Mexico',
    };
    return countryMap[normalized] || country.trim();
};

// Normalize state/province to full name (handles both abbreviations and full names)
const normalizeState = (state) => {
    if (!state) return '';
    const normalized = state.trim().toUpperCase();

    // Map of both abbreviations and full names to full state name
    const stateMap = {
        'AL': 'Alabama', 'ALABAMA': 'Alabama',
        'AK': 'Alaska', 'ALASKA': 'Alaska',
        'AZ': 'Arizona', 'ARIZONA': 'Arizona',
        'AR': 'Arkansas', 'ARKANSAS': 'Arkansas',
        'CA': 'California', 'CALIFORNIA': 'California',
        'CO': 'Colorado', 'COLORADO': 'Colorado',
        'CT': 'Connecticut', 'CONNECTICUT': 'Connecticut',
        'DE': 'Delaware', 'DELAWARE': 'Delaware',
        'FL': 'Florida', 'FLORIDA': 'Florida',
        'GA': 'Georgia', 'GEORGIA': 'Georgia',
        'HI': 'Hawaii', 'HAWAII': 'Hawaii',
        'ID': 'Idaho', 'IDAHO': 'Idaho',
        'IL': 'Illinois', 'ILLINOIS': 'Illinois',
        'IN': 'Indiana', 'INDIANA': 'Indiana',
        'IA': 'Iowa', 'IOWA': 'Iowa',
        'KS': 'Kansas', 'KANSAS': 'Kansas',
        'KY': 'Kentucky', 'KENTUCKY': 'Kentucky',
        'LA': 'Louisiana', 'LOUISIANA': 'Louisiana',
        'ME': 'Maine', 'MAINE': 'Maine',
        'MD': 'Maryland', 'MARYLAND': 'Maryland',
        'MA': 'Massachusetts', 'MASSACHUSETTS': 'Massachusetts',
        'MI': 'Michigan', 'MICHIGAN': 'Michigan',
        'MN': 'Minnesota', 'MINNESOTA': 'Minnesota',
        'MS': 'Mississippi', 'MISSISSIPPI': 'Mississippi',
        'MO': 'Missouri', 'MISSOURI': 'Missouri',
        'MT': 'Montana', 'MONTANA': 'Montana',
        'NE': 'Nebraska', 'NEBRASKA': 'Nebraska',
        'NV': 'Nevada', 'NEVADA': 'Nevada',
        'NH': 'New Hampshire', 'NEW HAMPSHIRE': 'New Hampshire',
        'NJ': 'New Jersey', 'NEW JERSEY': 'New Jersey',
        'NM': 'New Mexico', 'NEW MEXICO': 'New Mexico',
        'NY': 'New York', 'NEW YORK': 'New York',
        'NC': 'North Carolina', 'NORTH CAROLINA': 'North Carolina',
        'ND': 'North Dakota', 'NORTH DAKOTA': 'North Dakota',
        'OH': 'Ohio', 'OHIO': 'Ohio',
        'OK': 'Oklahoma', 'OKLAHOMA': 'Oklahoma',
        'OR': 'Oregon', 'OREGON': 'Oregon',
        'PA': 'Pennsylvania', 'PENNSYLVANIA': 'Pennsylvania',
        'RI': 'Rhode Island', 'RHODE ISLAND': 'Rhode Island',
        'SC': 'South Carolina', 'SOUTH CAROLINA': 'South Carolina',
        'SD': 'South Dakota', 'SOUTH DAKOTA': 'South Dakota',
        'TN': 'Tennessee', 'TENNESSEE': 'Tennessee',
        'TX': 'Texas', 'TEXAS': 'Texas',
        'UT': 'Utah', 'UTAH': 'Utah',
        'VT': 'Vermont', 'VERMONT': 'Vermont',
        'VA': 'Virginia', 'VIRGINIA': 'Virginia',
        'WA': 'Washington', 'WASHINGTON': 'Washington',
        'WV': 'West Virginia', 'WEST VIRGINIA': 'West Virginia',
        'WI': 'Wisconsin', 'WISCONSIN': 'Wisconsin',
        'WY': 'Wyoming', 'WYOMING': 'Wyoming',
        'DC': 'District of Columbia', 'DISTRICT OF COLUMBIA': 'District of Columbia',
    };
    return stateMap[normalized] || state.trim();
};

const ReportFilterContainer = ({ onSubmit, onReset }) => {
    const [countries, setCountries] = useState([]);
    const [states, setStates] = useState([]);
    const [cities, setCities] = useState([]);
    const [groups, setGroups] = useState([]);
    const [selectedCountry, setSelectedCountry] = useState('');
    const [selectedState, setSelectedState] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [selectedGroup, setSelectedGroup] = useState('');
    const todayLocal = () => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };
    const [startDate, setStartDate] = useState(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`);
    const [endDate, setEndDate] = useState(todayLocal());

    useEffect(() => {
        const fetchData = async () => {
            try {
                const groupsRef = collection(db, 'litterpickingOrganizations');
                const groupsQuery = query(groupsRef);
                const groupsSnapshot = await getDocs(groupsQuery);
                const groupsSet = new Set();
                groupsSnapshot.forEach((doc) => {
                    groupsSet.add(doc.data().Name);
                });
                const groupsList = Array.from(groupsSet);
                setGroups(groupsList);
            } catch (error) {
                console.error("Error fetching groups:", error);
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
                    const normalizedCountry = normalizeCountry(doc.data().Country);
                    if (normalizedCountry) {
                        countrySet.add(normalizedCountry);
                    }
                });
                const countryList = Array.from(countrySet).sort();
                setCountries(countryList);
            } catch (error) {
                console.error("Error fetching countries:", error);
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
                    const rawState = doc.data().State;
                    if (rawState) {
                        const normalizedState = normalizeState(rawState);
                        if (normalizedState) {
                            stateSet.add(normalizedState);
                        }
                    }
                });
                const stateList = Array.from(stateSet).sort();
                setStates(stateList);
            } catch (error) {
                console.error("Error fetching states:", error);
            }
        };

        if (selectedCountry) {
            fetchStates();
            setSelectedState('');
            setSelectedCity('');
        } else {
            setStates([]);
        }
    }, [selectedCountry]);

    useEffect(() => {
        const fetchCities = async () => {
            try {
                // Fetch all posts for the selected country and filter cities client-side
                // (DB stores raw abbreviations like "ME" but selectedState is normalized "Maine")
                const countriesQuery = query(
                    collection(db, 'userPosts'),
                    where('Country', '==', selectedCountry)
                );
                const citiesSnapshot = await getDocs(countriesQuery);
                const citySet = new Set();
                citiesSnapshot.forEach((doc) => {
                    const rawState = doc.data().State;
                    const docCity = doc.data().City;
                    // If a state is selected, only include cities where the normalized state matches
                    if (selectedState && normalizeState(rawState) !== selectedState) return;
                    if (docCity && docCity.trim()) {
                        citySet.add(docCity.trim());
                    }
                });
                const cityList = Array.from(citySet).sort();
                setCities(cityList);
            } catch (error) {
                console.error("Error fetching cities:", error);
            }
        };

        if (selectedCountry || selectedState) {
            fetchCities();
            setSelectedCity('');
        } else {
            setCities([]);
        }
    }, [selectedCountry, selectedState]);

    const handleCountryChange = (e) => setSelectedCountry(e.target.value);
    const handleStateChange = (e) => setSelectedState(e.target.value);
    const handleCityChange = (e) => setSelectedCity(e.target.value);
    const handleGroupChange = (e) => setSelectedGroup(e.target.value);
    const handleStartDateChange = (e) => setStartDate(e.target.value);
    const handleEndDateChange = (e) => setEndDate(e.target.value);

    const handleResetFilters = () => {
        // Clear all filter selections
        setSelectedCountry('');
        setSelectedState('');
        setSelectedCity('');
        setSelectedGroup('');
        // Reset dates to current month
        setStartDate(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`);
        setEndDate(todayLocal());
        // Call parent reset
        if (onReset) {
            onReset();
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({
            selectedCountry,
            selectedState,
            selectedCity,
            selectedGroup,
            startDate,
            endDate,
        });
    };

    return (
        <ReportFilters
            countries={countries}
            states={states}
            cities={cities}
            groups={groups}
            selectedCountry={selectedCountry}
            selectedState={selectedState}
            selectedCity={selectedCity}
            selectedGroup={selectedGroup}
            startDate={startDate}
            endDate={endDate}
            onCountryChange={handleCountryChange}
            onStateChange={handleStateChange}
            onCityChange={handleCityChange}
            onGroupChange={handleGroupChange}
            onStartDateChange={handleStartDateChange}
            onEndDateChange={handleEndDateChange}
            onSubmit={handleSubmit}
            onReset={handleResetFilters}
        />
    );
};

export default ReportFilterContainer;
