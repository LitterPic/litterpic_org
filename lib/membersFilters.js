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

    const orgFilter = normalizeOrganization(selectedOrganization).toLowerCase();

    let filtered = [...members];

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
