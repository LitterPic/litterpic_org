import React from 'react';

const ReportLeaderboard = ({ title, leaderboardData }) => {
    return (
        <div className="leaderboard">
            <h2 className="report-top-litter-pickers">{title}</h2>
            <div className="leaderboard-grid">
                <table>
                    <thead>
                    <tr>
                        {title === "Top Litter Pickers" ? (
                            <>
                                <th>Name</th>
                                <th>Organization</th>
                                <th>Litter Weight Collected (lbs)</th>
                            </>
                        ) : (
                            <>
                                <th>Organization</th>
                                <th>Litter Weight Collected (lbs)</th>
                            </>
                        )}
                    </tr>
                    </thead>
                    <tbody>
                    {leaderboardData.map((entry, index) => (
                        <tr key={index}>
                            {title === "Top Litter Pickers" ? (
                                <>
                                    <td>{entry.name}</td>
                                    <td>{entry.organization}</td>
                                    <td>{entry.litterWeight.toLocaleString()}</td>
                                </>
                            ) : (
                                <>
                                    <td>{entry.organization}</td>
                                    <td>{entry.litterWeight.toLocaleString()}</td>
                                </>
                            )}
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ReportLeaderboard;