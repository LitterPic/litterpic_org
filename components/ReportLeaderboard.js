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
                                    <td>
                                        <div className="flex items-center space-x-2">
                                            {entry.photoUrl ? (
                                                <img src={entry.photoUrl} alt={`${entry.name} profile`} className="w-8 h-8 rounded-full object-cover" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold text-gray-500">
                                                    {entry.name ? entry.name[0].toUpperCase() : 'U'}
                                                </div>
                                            )}
                                            <span>{entry.name}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex items-center space-x-2">
                                            {entry.orgLogoUrl ? (
                                                <img src={entry.orgLogoUrl} alt={`${entry.organization} logo`} className="w-8 h-8 rounded-full object-cover" />
                                            ) : (
                                                entry.organization ? (
                                                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold text-gray-500">
                                                        {entry.organization[0].toUpperCase()}
                                                    </div>
                                                ) : null
                                            )}
                                            <span>{entry.organization}</span>
                                        </div>
                                    </td>
                                    <td>{entry.litterWeight.toLocaleString()}</td>
                                </>
                            ) : (
                                <>
                                    <td>
                                        <div className="flex items-center space-x-2">
                                            {entry.orgLogoUrl ? (
                                                <img src={entry.orgLogoUrl} alt={`${entry.organization} logo`} className="w-8 h-8 rounded-full object-cover" />
                                            ) : (
                                                entry.organization ? (
                                                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold text-gray-500">
                                                        {entry.organization[0].toUpperCase()}
                                                    </div>
                                                ) : null
                                            )}
                                            <span>{entry.organization}</span>
                                        </div>
                                    </td>
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