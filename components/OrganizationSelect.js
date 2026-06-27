import React, { useState, useRef, useEffect } from 'react';
import { FaChevronDown } from 'react-icons/fa';

export default function OrganizationSelect({ organizations, value, onChange }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown on click outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef]);

    const selectedOrg = organizations.find(org => org.name === value) || { name: value, logoUrl: null };

    return (
        <div className="relative" ref={dropdownRef}>
            <div
                role="button"
                tabIndex={0}
                onClick={() => setIsOpen(!isOpen)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        setIsOpen(!isOpen);
                        e.preventDefault();
                    }
                }}
                className="w-full bg-white border border-gray-300 rounded-md px-3 py-3 text-left shadow-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600 min-h-[48px] flex items-center justify-between cursor-pointer"
                style={{ color: '#333', backgroundColor: '#fff', transition: 'none' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff'}
            >
                <div className="flex items-center">
                    {selectedOrg.logoUrl ? (
                         <img src={selectedOrg.logoUrl} alt={selectedOrg.name} className="w-6 h-6 mr-3 object-contain" />
                    ) : (
                         <div className="w-6 h-6 mr-3 rounded-full bg-gray-200 flex-shrink-0"></div>
                    )}
                    <span className="truncate">{selectedOrg.name}</span>
                </div>
                <FaChevronDown className="text-gray-400" />
            </div>

            {isOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200 max-h-60 overflow-auto focus:outline-none">
                    <ul className="py-1 text-base">
                        {organizations.map((org, index) => (
                            <li
                                key={index}
                                className={`flex items-center cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-green-50 text-gray-900 ${value === org.name ? 'bg-green-100 font-medium' : ''}`}
                                onClick={() => {
                                    onChange(org.name);
                                    setIsOpen(false);
                                }}
                            >
                                {org.logoUrl ? (
                                    <img src={org.logoUrl} alt={org.name} className="w-6 h-6 mr-3 object-contain" />
                                ) : (
                                    <div className="w-6 h-6 mr-3 rounded-full bg-gray-200 flex-shrink-0"></div>
                                )}
                                <span className="block truncate">{org.name}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
