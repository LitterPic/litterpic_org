import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import Head from 'next/head';
import withAuth from '../components/withAuth';
import { filterMembers, getMemberFilterStateFromQuery, getMemberSortStateFromQuery, getOrganizationTotalWeight, normalizeOrganization, sortMembers } from '../lib/membersFilters';

const MembersPage = () => {
    const router = useRouter();
    const { org, month, year, sort, direction } = router.query;
    
    const [members, setMembers] = useState([]);
    const [filteredMembers, setFilteredMembers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState('');
    const [selectedYear, setSelectedYear] = useState('');
    const [selectedOrganization, setSelectedOrganization] = useState(org ? normalizeOrganization(org) : '');
    const [sortField, setSortField] = useState('litterCollected');
    const [sortDirection, setSortDirection] = useState('desc');
    const [showFilters, setShowFilters] = useState(false);

    const sortOptions = [
        { value: 'litterCollected', label: 'Litter Collected' },
        { value: 'numPosts', label: 'Number of Posts' },
        { value: 'joinedDate', label: 'Joined Date' },
        { value: 'name', label: 'Name' }
    ];


    useEffect(() => {
        fetchMembers();
    }, []);

    useEffect(() => {
        const queryState = getMemberFilterStateFromQuery({ month, year, org });
        const sortState = getMemberSortStateFromQuery({ sort, direction });

        setSelectedMonth(queryState.selectedMonth);
        setSelectedYear(queryState.selectedYear);
        setSelectedOrganization(queryState.selectedOrganization);
        setSortField(sortState.sortField);
        setSortDirection(sortState.sortDirection);
    }, [month, year, org, sort, direction]);

    useEffect(() => {
        if (members.length > 0) {
            applyFilters();
        }
    }, [members, selectedOrganization, selectedMonth, selectedYear, sortField, sortDirection]);

    const fetchMembers = async () => {
        try {
            setIsLoading(true);
            const [usersSnapshot, postsSnapshot] = await Promise.all([
                getDocs(collection(db, 'users')),
                getDocs(collection(db, 'userPosts'))
            ]);

            const postCountsByUser = {};
            postsSnapshot.forEach(postDoc => {
                const postData = postDoc.data();
                const postUser = postData.postUser;
                const userId = (postUser && typeof postUser === 'object' && postUser.id)
                    ? postUser.id
                    : (postData.userId || postData.user_id || null);

                if (!userId) return;
                postCountsByUser[userId] = (postCountsByUser[userId] || 0) + 1;
            });

            const membersList = [];

            usersSnapshot.forEach(doc => {
                const userData = doc.data();
                if (userData.created_time && userData.display_name && userData.display_name.trim() !== '') {
                    const memberDate = userData.created_time.toDate();
                    const postCount = Number(postCountsByUser[doc.id] ?? userData.numberOfPosts ?? userData.postCount ?? userData.postsCount ?? 0);

                    membersList.push({
                        id: doc.id,
                        displayName: userData.display_name || userData.email || 'Unknown User',
                        email: userData.email || '',
                        photoUrl: userData.photo_url || '/images/default-avatar.jpg',
                        organization: userData.organization || 'Independent',
                        createdTime: memberDate,
                        totalWeight: userData.totalWeight || 0,
                        postCount
                    });
                }
            });

            membersList.sort((a, b) => a.displayName.toLowerCase().localeCompare(b.displayName.toLowerCase()));
            
            setMembers(membersList);
        } catch (error) {
            console.error('Error fetching members:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const applyFilters = () => {
        const filtered = filterMembers(members, {
            selectedMonth,
            selectedYear,
            selectedOrganization
        });

        const sorted = sortMembers(filtered, sortField, sortDirection);
        setFilteredMembers(sorted);
    };

    const clearFilters = () => {
        setSelectedMonth('');
        setSelectedYear('');
        setSelectedOrganization('');
        setSortField('litterCollected');
        setSortDirection('desc');
        router.push({ pathname: '/members', query: {} }, undefined, { shallow: true });
    };

    const getPageTitle = () => {
        if (selectedOrganization && selectedMonth && selectedYear) {
            return `Members of ${normalizeOrganization(selectedOrganization)} · ${selectedMonth}/${selectedYear}`;
        }

        if (selectedMonth || selectedYear) {
            const joinedText = selectedMonth ? `Joined in ${selectedMonth}` : 'Joined in';
            const yearText = selectedYear ? ` ${selectedYear}` : '';
            return `${joinedText}${yearText}`;
        }

        if (selectedOrganization) {
            return `Members of ${normalizeOrganization(selectedOrganization)}`;
        }

        return 'LitterPic Members';
    };

    const orgTotalWeight = selectedOrganization
        ? getOrganizationTotalWeight(members, selectedOrganization)
        : 0;

    const getFilterDescription = () => {
        if (selectedOrganization && selectedMonth && selectedYear) {
            return `${normalizeOrganization(selectedOrganization)} members joined in ${selectedMonth}/${selectedYear}`;
        }

        if (selectedOrganization) {
            return `${normalizeOrganization(selectedOrganization)} members`;
        }

        if (selectedMonth && selectedYear) {
            return `Members joined in ${selectedMonth}/${selectedYear}`;
        }

        if (selectedMonth) {
            return `Members joined in month ${selectedMonth}`;
        }

        if (selectedYear) {
            return `Members joined in ${selectedYear}`;
        }

        return 'All Members';
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
                <title>{getPageTitle()} - Community</title>
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
                        <h1>{getPageTitle()}</h1>
                        <p className="members-count">
                            {filteredMembers.length} {filteredMembers.length === 1 ? 'member' : 'members'}
                        </p>
                        {selectedOrganization && (
                            <p className="filter-description">
                                {`${normalizeOrganization(selectedOrganization)} total: ${orgTotalWeight.toLocaleString()} lbs`}
                            </p>
                        )}
                        {!selectedOrganization && <p className="filter-description">{getFilterDescription()}</p>}
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
                                <label>Sort By</label>
                                <select
                                    value={sortField}
                                    onChange={(e) => setSortField(e.target.value)}
                                >
                                    {sortOptions.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="filter-group">
                                <label>Direction</label>
                                <select
                                    value={sortDirection}
                                    onChange={(e) => setSortDirection(e.target.value)}
                                >
                                    <option value="asc">Ascending</option>
                                    <option value="desc">Descending</option>
                                </select>
                            </div>

                            <div className="filter-group">
                                <label>Organization:</label>
                                <select
                                    value={selectedOrganization}
                                    onChange={(e) => setSelectedOrganization(e.target.value)}
                                >
                                    <option value="">All Organizations</option>
                                    {Array.from(new Set(members.map(member => normalizeOrganization(member.organization || 'Independent')).sort((a, b) => a.localeCompare(b)))).map((organization) => (
                                        <option key={organization} value={organization}>
                                            {organization}
                                        </option>
                                    ))}
                                </select>
                            </div>

                        </div>

                        {(selectedOrganization || sortField !== 'litterCollected' || sortDirection !== 'desc') && (
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
                                        // Prevent infinite loop by checking if we're already using the fallback
                                        if (!e.target.src.endsWith('/images/default-avatar.jpg')) {
                                            e.target.src = '/images/default-avatar.jpg';
                                        }
                                    }}
                                />
                            </div>
                            
                            <div className="member-info">
                                <h3 className="member-name">{member.displayName}</h3>
                                <p className="member-organization">{member.organization}</p>
                                <p className="member-joined">Joined: {formatDate(member.createdTime)}</p>
                                <p className="member-weight">
                                    Collected: {member.totalWeight || 0} lbs
                                </p>
                                <p className="member-post-count">
                                    Posts: {member.postCount || 0}
                                </p>
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
                        {(selectedOrganization || sortField !== 'litterCollected' || sortDirection !== 'desc') && (
                            <button onClick={clearFilters}>Clear filters to see all members</button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default withAuth(MembersPage);
