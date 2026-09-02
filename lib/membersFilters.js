export const normalizeOrganization = (organization = '') => {
    const rawValue = String(organization || '').trim();
    if (!rawValue) {
        return 'independent';
    }

    const value = rawValue === 'Litterpicking Organization' ? 'Independent' : rawValue;
    return value.trim();
};

export const getOrganizationTotalWeight = (members = [], organizationName = '') => {
    const targetOrganization = normalizeOrganization(organizationName).toLowerCase();

    if (!targetOrganization || targetOrganization === 'independent') {
        return members.reduce((total, member) => {
            const memberOrganization = normalizeOrganization(member.organization || 'Independent').toLowerCase();
            if (memberOrganization === 'independent' || memberOrganization === 'litterpicking organization') {
                return total + Number(member.totalWeight || 0);
            }
            return total;
        }, 0);
    }

    return members.reduce((total, member) => {
        const memberOrganization = normalizeOrganization(member.organization || 'Independent').toLowerCase();
        if (memberOrganization === targetOrganization) {
            return total + Number(member.totalWeight || 0);
        }
        return total;
    }, 0);
};

export const filterMembers = (members = [], filters = {}) => {
    const {
        selectedMonth = '',
        selectedYear = '',
        selectedOrganization = ''
    } = filters;

    let filtered = [...members];

    if (selectedOrganization) {
        const orgFilter = normalizeOrganization(selectedOrganization).toLowerCase();

        if (orgFilter && orgFilter !== 'independent') {
            filtered = filtered.filter((member) => {
                const memberOrganization = normalizeOrganization(member.organization || 'Independent');
                return memberOrganization.toLowerCase() === orgFilter;
            });
        } else if (orgFilter === 'independent') {
            filtered = filtered.filter((member) => {
                const memberOrganization = normalizeOrganization(member.organization || 'Independent');
                const memberOrgText = memberOrganization.toLowerCase();
                return memberOrgText === 'independent' || memberOrgText === 'litterpicking organization';
            });
        }
    }

    if (selectedMonth || selectedYear) {
        filtered = filtered.filter((member) => {
            const memberYear = member.createdTime.getFullYear().toString();
            const memberMonth = (member.createdTime.getMonth() + 1).toString().padStart(2, '0');

            const yearMatch = !selectedYear || memberYear === selectedYear;
            const monthMatch = !selectedMonth || memberMonth === selectedMonth;

            return yearMatch && monthMatch;
        });
    }

    return filtered;
};

export const getMemberFilterStateFromQuery = (query = {}) => {
    const month = typeof query.month === 'string' ? query.month : '';
    const year = typeof query.year === 'string' ? query.year : '';
    const org = typeof query.org === 'string' ? query.org : '';

    return {
        selectedMonth: month,
        selectedYear: year,
        selectedOrganization: org ? normalizeOrganization(org) : ''
    };
};

export const getMemberSortStateFromQuery = (query = {}) => {
    const sortField = typeof query.sort === 'string' ? query.sort : 'litterCollected';
    const sortDirection = typeof query.direction === 'string' ? query.direction : 'desc';

    return {
        sortField: ['litterCollected', 'numPosts', 'joinedDate', 'name'].includes(sortField)
            ? sortField
            : 'litterCollected',
        sortDirection: sortDirection === 'asc' ? 'asc' : 'desc'
    };
};

export const sortMembers = (members = [], sortBy = 'litterCollected', direction = 'desc') => {
    const sorted = [...members];
    const multiplier = direction === 'asc' ? 1 : -1;

    sorted.sort((a, b) => {
        let valueA;
        let valueB;

        switch (sortBy) {
            case 'litterCollected':
                valueA = Number(a.totalWeight || 0);
                valueB = Number(b.totalWeight || 0);
                break;
            case 'numPosts':
                valueA = Number(a.postCount || 0);
                valueB = Number(b.postCount || 0);
                break;
            case 'joinedDate':
                valueA = a.createdTime ? new Date(a.createdTime).getTime() : 0;
                valueB = b.createdTime ? new Date(b.createdTime).getTime() : 0;
                break;
            case 'name':
                valueA = (a.displayName || '').toLowerCase();
                valueB = (b.displayName || '').toLowerCase();
                return valueA.localeCompare(valueB) * (direction === 'asc' ? 1 : -1);
            default:
                valueA = Number(a.totalWeight || 0);
                valueB = Number(b.totalWeight || 0);
        }

        if (typeof valueA === 'string' && typeof valueB === 'string') {
            return valueA.localeCompare(valueB) * multiplier;
        }

        return (valueA - valueB) * multiplier;
    });

    return sorted;
};
