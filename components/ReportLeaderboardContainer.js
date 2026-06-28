import React, { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import Leaderboard from '../components/ReportLeaderboard';

const ReportLeaderboardContainer = () => {
    const [leaderboard, setLeaderboard] = useState([]);
    const [orgLeaderboard, setOrgLeaderboard] = useState([]);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                // Fetch organizations first to create a lookup map for logos
                const orgsSnapshot = await getDocs(collection(db, 'litterpickingOrganizations'));
                const orgLogos = {};
                orgsSnapshot.forEach(doc => {
                    const data = doc.data();
                    if (data.Name) {
                        orgLogos[data.Name] = data.logoUrl || null;
                    }
                });

                const usersSnapshot = await getDocs(collection(db, 'users'));
                const userLeaderboardData = [];
                const orgLeaderboardData = {};

                for (const userDoc of usersSnapshot.docs) {
                    const userName = userDoc.data().display_name;
                    const organization = userDoc.data().organization;
                    const litterWeight = userDoc.data().totalWeight || 0;
                    const photoUrl = userDoc.data().photo_url || null;

                    userLeaderboardData.push({
                        name: userName,
                        organization: organization,
                        litterWeight: litterWeight,
                        photoUrl: photoUrl,
                        orgLogoUrl: organization ? (orgLogos[organization] || null) : null
                    });

                    if (organization) {
                        if (!orgLeaderboardData[organization]) {
                            orgLeaderboardData[organization] = { weight: 0, logoUrl: orgLogos[organization] || null };
                        }
                        orgLeaderboardData[organization].weight += litterWeight;
                    }
                }

                const sortedUserLeaderboard = userLeaderboardData.sort((a, b) => b.litterWeight - a.litterWeight).slice(0, 5);
                setLeaderboard(sortedUserLeaderboard);

                const sortedOrgLeaderboard = Object.entries(orgLeaderboardData)
                    .sort(([, a], [, b]) => b.weight - a.weight)
                    .slice(0, 5)
                    .map(([org, data]) => ({ organization: org, litterWeight: data.weight, orgLogoUrl: data.logoUrl }));

                setOrgLeaderboard(sortedOrgLeaderboard);

            } catch (error) {
                console.error("Error fetching leaderboard:", error);
            }
        };
        fetchLeaderboard();
    }, []);

    return (
        <>
            <Leaderboard title="Top Litter Pickers" leaderboardData={leaderboard} />
            <Leaderboard title="Top Litter Picking Organizations" leaderboardData={orgLeaderboard} />
        </>
    );
};

export default ReportLeaderboardContainer;
