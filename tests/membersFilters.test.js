import { describe, it, expect } from 'vitest';
import { filterMembers } from '../lib/membersFilters';

describe('filterMembers', () => {
  const members = [
    {
      id: 'u1',
      displayName: 'Alice',
      organization: 'Blue Ocean Society',
      createdTime: new Date('2024-01-15T00:00:00Z')
    },
    {
      id: 'u2',
      displayName: 'Bob',
      organization: 'Independent',
      createdTime: new Date('2024-03-12T00:00:00Z')
    },
    {
      id: 'u3',
      displayName: 'Carol',
      organization: 'Blue Ocean Society',
      createdTime: new Date('2023-11-20T00:00:00Z')
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
});
