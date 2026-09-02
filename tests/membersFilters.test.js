import { describe, it, expect } from 'vitest';
import { filterMembers, getMemberFilterStateFromQuery, sortMembers } from '../lib/membersFilters';

describe('filterMembers', () => {
  const members = [
    {
      id: 'u1',
      displayName: 'Alice',
      organization: 'Blue Ocean Society',
      createdTime: new Date('2024-01-15T00:00:00Z'),
      totalWeight: 120,
      postCount: 3
    },
    {
      id: 'u2',
      displayName: 'Bob',
      organization: 'Independent',
      createdTime: new Date('2024-03-12T00:00:00Z'),
      totalWeight: 320,
      postCount: 8
    },
    {
      id: 'u3',
      displayName: 'Carol',
      organization: 'Blue Ocean Society',
      createdTime: new Date('2023-11-20T00:00:00Z'),
      totalWeight: 210,
      postCount: 5
    }
  ];

  it('filters by organization when an org is selected', () => {
    const result = filterMembers(members, {
      selectedMonth: '',
      selectedYear: '',
      selectedOrganization: 'blue ocean society'
    });

    expect(result).toHaveLength(2);
    expect(result.map((member) => member.id)).toEqual(['u1', 'u3']);
  });

  it('combines organization, month, and year filters together', () => {
    const result = filterMembers(members, {
      selectedMonth: '01',
      selectedYear: '2024',
      selectedOrganization: 'blue ocean society'
    });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('u1');
  });

  it('returns all members when organization filter is blank', () => {
    const result = filterMembers(members, {
      selectedMonth: '',
      selectedYear: '',
      selectedOrganization: ''
    });

    expect(result).toHaveLength(3);
    expect(result.map((member) => member.id)).toEqual(['u1', 'u2', 'u3']);
  });

  it('reads month, year, and org filters from URL query state', () => {
    const result = getMemberFilterStateFromQuery({
      month: '01',
      year: '2024',
      org: 'Blue Ocean Society'
    });

    expect(result).toEqual({
      selectedMonth: '01',
      selectedYear: '2024',
      selectedOrganization: 'Blue Ocean Society'
    });
  });

  it('sorts members by litter collected in descending order', () => {
    const result = sortMembers(members, 'litterCollected', 'desc');

    expect(result.map((member) => member.id)).toEqual(['u2', 'u3', 'u1']);
  });
});
