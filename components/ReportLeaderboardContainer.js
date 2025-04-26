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
                const usersSnapshot = await getDocs(collection(db, 'users'));
                const userLeaderboardData = [];
                const orgLeaderboardData = {};

                for (const userDoc of usersSnapshot.docs) {
                    const userName = userDoc.data().display_name;
                    const organization = userDoc.data().organization;
                    const litterWeight = userDoc.data().totalWeight || 0;

                    userLeaderboardData.push({
                        name: userName,
                        organization: organization,
                        litterWeight: litterWeight,
                    });

                    if (organization) {
                        if (!orgLeaderboardData[organization]) {
                            orgLeaderboardData[organization] = 0;
                        }
                        orgLeaderboardData[organization] += litterWeight;
                    }
                }

                const sortedUserLeaderboard = userLeaderboardData.sort((a, b) => b.litterWeight - a.litterWeight).slice(0, 5);
                setLeaderboard(sortedUserLeaderboard);

                const sortedOrgLeaderboard = Object.entries(orgLeaderboardData)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([org, weight]) => ({ organization: org, litterWeight: weight }));

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
