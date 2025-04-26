import React from 'react';

const ReportFilters = ({
                           countries,
                           states,
                           cities,
                           groups,
                           selectedCountry,
                           selectedState,
                           selectedCity,
                           selectedGroup,
                           startDate,
                           endDate,
                           onCountryChange,
                           onStateChange,
                           onCityChange,
                           onGroupChange,
                           onStartDateChange,
                           onEndDateChange,
                           onSubmit,
                           onReset,
                       }) => {
    return (
        <form onSubmit={onSubmit}>
            <div className="interactive-litter-stats-header">Interactive Litter Stats</div>
            <div className="report-form-group">
                <div className="label-row grid-layout">
                    <div className="report-form-label">From</div>
                    <div className="report-form-label">To</div>
                    <div className="report-form-label">Organization</div>
                    <div className="report-form-label">Country</div>
                    <div className="report-form-label">State</div>
                    <div className="report-form-label">City</div>
                </div>
                <div className="input-row grid-layout">
                    <div className="report-label-mobile">From</div>
                    <input className="report-form-select input-smaller" type="date" value={startDate} onChange={onStartDateChange} />
                    <div className="report-label-mobile">To</div>
                    <input className="report-form-select input-smaller" type="date" value={endDate} onChange={onEndDateChange} />
                    <div className="report-label-mobile">Organization</div>
                    <select className={`report-form-select ${groups.length > 10 ? 'report-scrollable-dropdown' : ''}`} value={selectedGroup} onChange={onGroupChange}>
                        <option value="">All Organizations</option>
                        {groups.sort((a, b) => a.localeCompare(b)).map((group) => (<option key={group} value={group}>{group}</option>))}
                    </select>
                    <div className="report-label-mobile">Country</div>
                    <select className={`report-form-select ${countries.length > 10 ? 'report-scrollable-dropdown' : ''}`} value={selectedCountry} onChange={onCountryChange}>
                        <option value="">All Countries</option>
                        {countries.sort((a, b) => a.localeCompare(b)).map((country) => (<option key={country} value={country}>{country}</option>))}
                    </select>
                    <div className="report-label-mobile">State</div>
                    <select className={`report-form-select ${states.length > 10 ? 'report-scrollable-dropdown' : ''}`} value={selectedState} onChange={onStateChange} disabled={!selectedCountry}>
                        <option value="">All States</option>
                        {states.sort((a, b) => a.localeCompare(b)).map((state) => (<option key={state} value={state}>{state}</option>))}
                    </select>
                    <div className="report-label-mobile">City</div>
                    <select className={`report-form-select ${cities.length > 10 ? 'report-scrollable-dropdown' : ''}`} value={selectedCity} onChange={onCityChange} disabled={!selectedState}>
                        <option value="">All Cities</option>
                        {cities.sort((a, b) => a.localeCompare(b)).map((city) => (<option key={city} value={city}>{city}</option>))}
                    </select>
                </div>
                <button className="report-submit-button" type="submit">Submit</button>
                <button className="report-reset-button" type="button" onClick={onReset}>Reset</button>
            </div>
        </form>
    );
};

export default ReportFilters;