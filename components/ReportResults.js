import React from 'react';

const ReportResults = ({ isLoading, isSubmitted, totalWeight, cityWeights, renderNoDataMessage }) => {
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
                    renderNoDataMessage()
                )
            )}
        </div>
    );
};

export default ReportResults;