import React from 'react';

const ReportResults = ({ isLoading, isSubmitted, totalWeight, cityWeights }) => {
    return (
        <div>
            {isLoading ? (
                <div className="report-is-loading">Loading...</div>
            ) : isSubmitted && (
                cityWeights.length > 0 ? (
                    <div>
                        <div className="report-total-weight">Litter Collected:
                            <span className="report-weight-value">{totalWeight}</span>
                            lbs
                        </div>
                        <table className="results-table">
                            <thead>
                            <tr>
                                <th>Location</th>
                                <th>Litter Weight (lbs)</th>
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
                    <div className="report-no-data" style={{ textAlign: 'center', padding: '2rem' }}>
                        <p>No data available for the selected filters.</p>
                    </div>
                )
            )}
        </div>
    );
};

export default ReportResults;