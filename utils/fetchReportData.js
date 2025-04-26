import { db } from '../lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

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
        const timePosted = doc.data().timePosted.toDate();
        const postDate = new Date(timePosted);
        const location = doc.data().location || '';

        if (postDate >= new Date(startDate) && postDate <= new Date(endDate)) {
            const postUserRef = doc.data().postUser;
            const userId = postUserRef.id;

            if (selectedGroup && userIds.length === 0) {
                return;
            }

            if (userIds.length === 0 || userIds.includes(userId)) {
                const litterWeight = doc.data().litterWeight;
                total += litterWeight;

                const locationParts = location.split(',').map(part => part.trim());
                const city = locationParts[0] || '';
                const state = locationParts[1] || '';
                const country = locationParts.slice(2).join(', ') || '';

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

    return {
        totalWeight: total,
        cityWeights: Array.from(cityWeightMap.entries()),
    };
};
