import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import Head from 'next/head';
import withAuth from '../components/withAuth';

const MembersPage = () => {
    const router = useRouter();
    const { month, year } = router.query;
    
    const [members, setMembers] = useState([]);
    const [filteredMembers, setFilteredMembers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(month || '');
    const [selectedYear, setSelectedYear] = useState(year || '');
    const [showFilters, setShowFilters] = useState(false);
    const [availableYears, setAvailableYears] = useState([]);
    
    const monthOptions = [
        { value: '', label: 'All Months' },
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

    useEffect(() => {
        fetchMembers();
    }, []);

    useEffect(() => {
        if (members.length > 0) {
            applyFilters();
        }
    }, [members, selectedMonth, selectedYear]);

    const fetchMembers = async () => {
        try {
            setIsLoading(true);
            const usersSnapshot = await getDocs(collection(db, 'users'));
            const membersList = [];
            const years = new Set();

            usersSnapshot.forEach(doc => {
                const userData = doc.data();
                if (userData.created_time && userData.display_name) {
                    const memberDate = userData.created_time.toDate();
                    years.add(memberDate.getFullYear());
                    
                    membersList.push({
                        id: doc.id,
                        displayName: userData.display_name || userData.email || 'Unknown User',
                        email: userData.email || '',
                        photoUrl: userData.photo_url || '/images/default-avatar.png',
                        organization: userData.organization || 'Independent',
                        createdTime: memberDate,
                        totalWeight: userData.totalWeight || 0
                    });
                }
            });

            // Sort members alphabetically
            membersList.sort((a, b) => a.displayName.toLowerCase().localeCompare(b.displayName.toLowerCase()));
            
            // Sort years descending (newest first)
            const sortedYears = Array.from(years).sort((a, b) => b - a);
            
            setMembers(membersList);
            setAvailableYears(sortedYears);
        } catch (error) {
            console.error('Error fetching members:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = members;

        if (selectedMonth || selectedYear) {
            filtered = members.filter(member => {
                const memberYear = member.createdTime.getFullYear().toString();
                const memberMonth = (member.createdTime.getMonth() + 1).toString().padStart(2, '0');
                
                const yearMatch = !selectedYear || memberYear === selectedYear;
                const monthMatch = !selectedMonth || memberMonth === selectedMonth;
                
                return yearMatch && monthMatch;
            });
        }

        setFilteredMembers(filtered);
    };

    const clearFilters = () => {
        setSelectedMonth('');
        setSelectedYear('');
        router.push('/members', undefined, { shallow: true });
    };

    const getFilterDescription = () => {
        if (!selectedMonth && !selectedYear) return 'All Members';
        
        if (selectedMonth && selectedYear) {
            const monthName = monthOptions.find(m => m.value === selectedMonth)?.label;
            return `Members joined in ${monthName} ${selectedYear}`;
        } else if (selectedYear) {
            return `Members joined in ${selectedYear}`;
        } else if (selectedMonth) {
            const monthName = monthOptions.find(m => m.value === selectedMonth)?.label;
            return `Members joined in ${monthName} (all years)`;
        }
    };

    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    };

    if (isLoading) {
        return (
            <div className="members-loading">
                <div className="loading-spinner"></div>
                <p>Loading members...</p>
            </div>
        );
    }

    return (
        <div>
            <Head>
                <title>LitterPic Members - Community</title>
                <meta name="description" content="Browse LitterPic community members and their contributions to environmental cleanup." />
            </Head>

            <div className="members-page">
                <div className="members-header">
                    <button 
                        className="back-button"
                        onClick={() => router.back()}
                    >
                        ← Back
                    </button>
                    
                    <div className="members-title-section">
                        <h1>LitterPic Members</h1>
                        <p className="members-count">
                            {filteredMembers.length} {filteredMembers.length === 1 ? 'member' : 'members'}
                        </p>
                        <p className="filter-description">{getFilterDescription()}</p>
                    </div>

                    <button 
                        className="filter-toggle"
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        {showFilters ? '✕' : '⚙️'} Filter
                    </button>
                </div>

                {showFilters && (
                    <div className="members-filters">
                        <div className="filter-row">
                            <div className="filter-group">
                                <label>Year:</label>
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(e.target.value)}
                                >
                                    <option value="">All Years</option>
                                    {availableYears.map(year => (
                                        <option key={year} value={year}>
                                            {year}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="filter-group">
                                <label>Month:</label>
                                <select
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                >
                                    {monthOptions.map(month => (
                                        <option key={month.value} value={month.value}>
                                            {month.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {(selectedMonth || selectedYear) && (
                            <button className="clear-filters-btn" onClick={clearFilters}>
                                Clear Filters
                            </button>
                        )}
                    </div>
                )}

                <div className="members-list">
                    {filteredMembers.map(member => (
                        <div key={member.id} className="member-card">
                            <div className="member-avatar">
                                <img 
                                    src={member.photoUrl} 
                                    alt={member.displayName}
                                    onError={(e) => {
                                        e.target.src = '/images/default-avatar.png';
                                    }}
                                />
                            </div>
                            
                            <div className="member-info">
                                <h3 className="member-name">{member.displayName}</h3>
                                <p className="member-organization">{member.organization}</p>
                                <p className="member-joined">Joined: {formatDate(member.createdTime)}</p>
                                {member.totalWeight > 0 && (
                                    <p className="member-weight">
                                        Collected: {member.totalWeight} lbs
                                    </p>
                                )}
                            </div>
                            
                            <div className="member-actions">
                                <button 
                                    className="view-profile-btn"
                                    onClick={() => router.push(`/profile/${member.id}`)}
                                >
                                    View Profile →
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredMembers.length === 0 && (
                    <div className="no-members">
                        <p>No members found for the selected criteria.</p>
                        {(selectedMonth || selectedYear) && (
                            <button onClick={clearFilters}>Clear filters to see all members</button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default withAuth(MembersPage);
