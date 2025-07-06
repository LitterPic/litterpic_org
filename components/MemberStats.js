import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

const MemberStats = () => {
    const router = useRouter();
    const [totalMembers, setTotalMembers] = useState(0);
    const [filteredMembers, setFilteredMembers] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [filterEnabled, setFilterEnabled] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState('');
    const [selectedYear, setSelectedYear] = useState('');

    // Get current year and generate year options
    const currentYear = new Date().getFullYear();
    const yearOptions = Array.from({ length: 10 }, (_, i) => currentYear - i);
    
    const monthOptions = [
        { value: '01', label: 'January' },
        { value: '02', label: 'February' },
        { value: '03', label: 'March' },
        { value: '04', label: 'April' },
        { value: '05', label: 'May' },
        { value: '06', label: 'June' },
        { value: '07', label: 'July' },
        { value: '08', label: 'August' },
        { value: '09', label: 'September' },
        { value: '10', label: 'October' },
        { value: '11', label: 'November' },
        { value: '12', label: 'December' }
    ];

    // Fetch total member count on component mount
    useEffect(() => {
        fetchTotalMembers();
    }, []);

    const fetchTotalMembers = async () => {
        try {
            setIsLoading(true);
            const usersSnapshot = await getDocs(collection(db, 'users'));
            setTotalMembers(usersSnapshot.size);
        } catch (error) {
            console.error('Error fetching total members:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchFilteredMembers = async () => {
        if (!selectedMonth && !selectedYear) {
            alert('Please select at least month or year');
            return;
        }

        try {
            setIsLoading(true);

            // Get all users and filter client-side for better debugging
            const usersSnapshot = await getDocs(collection(db, 'users'));
            let count = 0;
            let totalUsersWithCreatedTime = 0;

            console.log('Total users in database:', usersSnapshot.size);

            usersSnapshot.forEach(doc => {
                const userData = doc.data();

                // Check if user has created_time field
                if (userData.created_time) {
                    totalUsersWithCreatedTime++;

                    let memberDate;
                    // Handle different possible formats of created_time
                    if (userData.created_time.toDate) {
                        // Firestore Timestamp
                        memberDate = userData.created_time.toDate();
                    } else if (userData.created_time instanceof Date) {
                        // JavaScript Date
                        memberDate = userData.created_time;
                    } else if (typeof userData.created_time === 'string') {
                        // String date
                        memberDate = new Date(userData.created_time);
                    } else {
                        console.log('Unknown created_time format:', userData.created_time);
                        return;
                    }

                    const memberYear = memberDate.getFullYear().toString();
                    const memberMonth = (memberDate.getMonth() + 1).toString().padStart(2, '0');

                    let matches = false;

                    if (selectedMonth && selectedYear) {
                        // Filter by specific month and year
                        matches = memberMonth === selectedMonth && memberYear === selectedYear;
                    } else if (selectedYear) {
                        // Filter by year only
                        matches = memberYear === selectedYear;
                    } else if (selectedMonth) {
                        // Filter by month only (across all years)
                        matches = memberMonth === selectedMonth;
                    }

                    if (matches) {
                        count++;
                        console.log('Match found:', userData.display_name || userData.email, memberDate);
                    }
                }
            });

            console.log('Users with created_time field:', totalUsersWithCreatedTime);
            console.log('Filtered count:', count);

            setFilteredMembers(count);
            setFilterEnabled(true);
        } catch (error) {
            console.error('Error fetching filtered members:', error);
            alert('Error fetching member data. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const resetFilter = () => {
        setFilterEnabled(false);
        setSelectedMonth('');
        setSelectedYear('');
        setFilteredMembers(0);
    };

    const handleApplyFilter = () => {
        fetchFilteredMembers();
    };

    // Auto-apply filter when month or year changes
    useEffect(() => {
        if (selectedMonth || selectedYear) {
            fetchFilteredMembers();
        }
    }, [selectedMonth, selectedYear]);

    const handleMemberCountClick = () => {
        // Navigate to members page with current filters
        const query = {};
        if (selectedMonth) query.month = selectedMonth;
        if (selectedYear) query.year = selectedYear;

        router.push({
            pathname: '/members',
            query: query
        });
    };

    return (
        <div className="member-stats-container">
            <div className="member-stats-header">
                <h2 className="member-stats-title">LitterPic Members</h2>
                <div className="member-count-display">
                    {isLoading ? (
                        <div className="loading-text">Loading...</div>
                    ) : (
                        <div className="member-count clickable" onClick={handleMemberCountClick}>
                            <span className="count-number">
                                {filterEnabled ? filteredMembers : totalMembers}
                            </span>
                            <span className="count-label">
                                {filterEnabled
                                    ? (() => {
                                        if (selectedMonth && selectedYear) {
                                            return `Members joined in ${monthOptions.find(m => m.value === selectedMonth)?.label} ${selectedYear}`;
                                        } else if (selectedYear) {
                                            return `Members joined in ${selectedYear}`;
                                        } else if (selectedMonth) {
                                            return `Members joined in ${monthOptions.find(m => m.value === selectedMonth)?.label} (all years)`;
                                        }
                                        return 'Filtered Members';
                                    })()
                                    : 'Total Members'
                                }
                            </span>
                            <span className="click-hint">Click to view members</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="member-filter-container">
                <div className="filter-controls">
                    <div className="filter-inputs">
                        <div className="input-group">
                            <label htmlFor="month-select">Month:</label>
                            <select
                                id="month-select"
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                disabled={isLoading}
                            >
                                <option value="">Select Month</option>
                                {monthOptions.map(month => (
                                    <option key={month.value} value={month.value}>
                                        {month.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="input-group">
                            <label htmlFor="year-select">Year:</label>
                            <select
                                id="year-select"
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(e.target.value)}
                                disabled={isLoading}
                            >
                                <option value="">Select Year</option>
                                {yearOptions.map(year => (
                                    <option key={year} value={year}>
                                        {year}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {(selectedMonth || selectedYear) && (
                        <div className="filter-buttons">
                            <button
                                onClick={resetFilter}
                                disabled={isLoading}
                                className="reset-filter-btn"
                            >
                                Clear Filters
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MemberStats;
