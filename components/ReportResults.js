import React from 'react';

const ReportResults = ({ isLoading, isSubmitted, totalWeight, cityWeights }) => {
    const postCount = cityWeights.reduce((acc) => acc + 1, 0);

    return (
        <div>
            {isLoading ? (
                <div className="report-is-loading">Loading...</div>
            ) : isSubmitted && (
                cityWeights.length > 0 ? (
                    <div>
                        <div className="report-total-weight">Litter Collected:
                            <span className="report-weight-value">{totalWeight.toLocaleString()}</span>
                            lbs
                        </div>
                        <div className="report-post-count" style={{ textAlign: 'center', marginBottom: '1rem', color: '#555' }}>
                            Across <strong>{cityWeights.length}</strong> location{cityWeights.length !== 1 ? 's' : ''}
                        </div>
                        <table className="results-table">
                            <thead>
                            <tr>
                                <th>Location</th>
                                <th>Litter Weight (lbs)</th>
                                <th>% of Total</th>
                            </tr>
                            </thead>
                            <tbody>
                            {cityWeights.sort((a, b) => b[1] - a[1]).map(([key, weight]) => (
                                <tr key={key}>
                                    <td>{key}</td>
                                    <td className="report-td-weight">{weight.toLocaleString()}</td>
                                    <td className="report-td-weight">
                                        {totalWeight > 0 ? ((weight / totalWeight) * 100).toFixed(1) : 0}%
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="report-no-data" style={{ textAlign: 'center', padding: '2rem' }}>
                        <p>No data available for the selected filters.</p>
                    </div>
                )
            )}
        </div>
    );
};

export default ReportResults;