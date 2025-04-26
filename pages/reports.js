import React, { useState } from 'react';
import withAuth from '../components/withAuth';
import LeaderboardContainer from '../components/ReportLeaderboardContainer';
import FilterContainer from '../components/ReportFilterContainer';
import ReportResults from '../components/ReportResults';
import GoogleAnalytics from "../components/GoogleAnalytics";
import ReportBanner from "../components/ReportBanner";
import ReportMeta from "../components/ReportMeta";
import { fetchReportData } from '../utils/fetchReportData';

const ReportsPage = () => {
    const [totalWeight, setTotalWeight] = useState(0);
    const [cityWeights, setCityWeights] = useState([]);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (filters) => {
        setIsLoading(true);
        setIsSubmitted(true);
        try {
            const { totalWeight, cityWeights } = await fetchReportData(filters);
            setTotalWeight(totalWeight);
            setCityWeights(cityWeights);
        } catch (error) {
            console.error("Error submitting report:", error);
        }
        setIsLoading(false);
    };

    const resetForm = () => {
        setTotalWeight(0);
        setCityWeights([]);
        setIsSubmitted(false);
    };

    return (
        <div>
            <ReportMeta />
            <GoogleAnalytics />
            <ReportBanner />

            <div className="page">
                <div className="content">
                    <h1 className="heading-text">Litter Stats</h1>

                    <LeaderboardContainer />

                    <FilterContainer onSubmit={handleSubmit} onReset={resetForm} />

                    <ReportResults
                        isLoading={isLoading}
                        isSubmitted={isSubmitted}
                        totalWeight={totalWeight}
                        cityWeights={cityWeights}
                    />
                </div>
            </div>
        </div>
    );
};

export default withAuth(ReportsPage);
