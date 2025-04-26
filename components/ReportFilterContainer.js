import React, { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import ReportFilters from '../components/ReportFilters';

const ReportFilterContainer = ({ onSubmit, onReset }) => {
    const [countries, setCountries] = useState([]);
    const [states, setStates] = useState([]);
    const [cities, setCities] = useState([]);
    const [groups, setGroups] = useState([]);
    const [selectedCountry, setSelectedCountry] = useState('');
    const [selectedState, setSelectedState] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [selectedGroup, setSelectedGroup] = useState('');
    const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);

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
                    countrySet.add(doc.data().Country);
                });
                const countryList = Array.from(countrySet);
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
                    if (doc.data().State) {
                        stateSet.add(doc.data().State);
                    }
                });
                const stateList = Array.from(stateSet);
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
            onReset={onReset}
        />
    );
};

export default ReportFilterContainer;
