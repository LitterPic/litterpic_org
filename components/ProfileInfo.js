import React from "react";
import Link from "next/link";

const ProfileInfo = ({ userOrganization, userOrganizationLogo, litterCollected, userBio, memberSince, isAmbassador, ambassadorDate }) => {
    const renderCollected = () => {
        if (userOrganization === 'Blue Ocean Society') {
            return (
                <a href="https://www.blueoceansociety.org/" target="_blank" rel="noopener noreferrer">
                    Visit Blue Ocean Society
                </a>
            );
        } else {
            return `${litterCollected} pounds`;
        }
    };

    return (
        <div className="profile-info mt-10" style={{ rowGap: '1rem' }}>
            <div className="profile-item" style={{ gridColumn: 1, gridRow: 1 }}>Organization</div>
            <div className="profile-value" style={{ gridColumn: 2, gridRow: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, padding: 0, paddingLeft: '1rem', paddingTop: '1rem' }}>
                {userOrganizationLogo && (
                    <img src={userOrganizationLogo} alt={`${userOrganization} Logo`} style={{ width: '2rem', height: '2rem', objectFit: 'contain' }} />
                )}
                <Link
                    href={{
                        pathname: '/members',
                        query: { org: userOrganization || 'Independent' }
                    }}
                    className="profile-organization-link"
                >
                    {userOrganization || "Independent"}
                </Link>
            </div>

            <div className="profile-item" style={{ gridColumn: 1, gridRow: 2 }}>Collected</div>
            <div className="profile-value" style={{ gridColumn: 2, gridRow: 2, margin: 0, padding: 0, paddingLeft: '1rem', paddingTop: '1rem' }}>
                <span style={{ color: '#333' }}>{renderCollected()}</span>
            </div>

            <div className="profile-item" style={{ gridColumn: 1, gridRow: 3 }}>Bio</div>
            <div className="profile-value" style={{ gridColumn: 2, gridRow: 3, margin: 0, padding: 0, paddingLeft: '1rem', paddingTop: '1rem' }}>
                <span style={{ color: '#333' }}>{userBio || "No Bio Available"}</span>
            </div>

            <div className="profile-item" style={{ gridColumn: 1, gridRow: 4 }}>Member Since</div>
            <div className="profile-value" style={{ gridColumn: 2, gridRow: 4, margin: 0, padding: 0, paddingLeft: '1rem', paddingTop: '1rem' }}>
                <span style={{ color: '#333' }}>
                    {memberSince 
                        ? (typeof memberSince === 'string' 
                            ? memberSince 
                            : typeof memberSince.toLocaleDateString === 'function'
                                ? memberSince.toLocaleDateString()
                                : "Not Available")
                        : "Not Available"}
                </span>
            </div>
        </div>
    );
};

export default ProfileInfo;
