import { db } from '../lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

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

export const fetchReportData = async (filters) => {
    const { selectedCountry, selectedState, selectedCity, selectedGroup, startDate, endDate } = filters;

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

    // ...existing code...
    const weightQuery = query(collection(db, 'userPosts'));

    const weightSnapshot = await getDocs(weightQuery);

    let total = 0;
    const cityWeightMap = new Map();

    weightSnapshot.forEach((doc) => {
        try {
            const timePosted = doc.data().timePosted.toDate();
            const postDate = new Date(timePosted);

            // Parse dates - set start to beginning of day and end to end of day (local time)
            const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
            const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
            const startDateTime = new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0);
            const endDateTime = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999);

            if (postDate < startDateTime || postDate > endDateTime) {
                return; // Date filter
            }

            const postUserRef = doc.data().postUser;
            if (!postUserRef) {
                return;
            }
            const userId = postUserRef.id;

            if (selectedGroup && userIds.length === 0) {
                return;
            }

            if (selectedGroup && !userIds.includes(userId)) {
                return; // Group filter
            }

            const litterWeight = doc.data().litterWeight;
            if (typeof litterWeight !== 'number') {
                return;
            }

            // Use stored City/State/Country fields first (more reliable),
            // fall back to parsing the location string
            let city = doc.data().City || '';
            let state = doc.data().State || '';
            let country = doc.data().Country || '';

            // If stored fields are missing, parse the location string
            if (!city && !state && !country) {
                const location = doc.data().location || '';
                const locationParts = location.split(',').map(part => part.trim());

                if (locationParts.length >= 3) {
                    country = locationParts[locationParts.length - 1];
                    state = locationParts[locationParts.length - 2].replace(/\d+/g, '').trim();
                    city = locationParts.slice(0, locationParts.length - 2).join(', ').trim();
                } else if (locationParts.length === 2) {
                    state = locationParts[0];
                    country = locationParts[1];
                } else if (locationParts.length === 1) {
                    city = locationParts[0];
                }
            }

            // Normalize state and country
            state = normalizeState(state);
            country = normalizeCountry(country);

            // Apply Country filter
            if (selectedCountry && normalizeCountry(selectedCountry) !== country) {
                return;
            }

            // Apply State filter
            if (selectedState && normalizeState(selectedState) !== state) {
                return;
            }

            // Apply City filter
            if (selectedCity && selectedCity !== city) {
                return;
            }

            // All filters passed - include this post
            total += litterWeight;

            const keyParts = [city, state, country].filter(part => part && part.trim() !== '');
            const key = keyParts.join(', ');

            if (cityWeightMap.has(key)) {
                cityWeightMap.set(key, cityWeightMap.get(key) + litterWeight);
            } else {
                cityWeightMap.set(key, litterWeight);
            }
        } catch (error) {
            console.error('Error processing post:', error);
        }
    });

    return {
        totalWeight: total,
        cityWeights: Array.from(cityWeightMap.entries()),
    };
};
