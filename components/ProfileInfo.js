import React from "react";

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
                <span style={{ color: '#333' }}>{userOrganization || "Independent"}</span>
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

            {isAmbassador && (
                <div style={{ gridColumn: '1 / span 2', padding: '1rem', marginTop: '2rem', borderRadius: '0.5rem', background: 'linear-gradient(to right, #012a1d, #015e41)', color: 'white', display: 'flex', alignItems: 'center', gap: '0.75rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                    <i className="material-icons" style={{ fontSize: '1.25rem' }}>public</i>
                    <span style={{ fontSize: '1rem' }}>{`LitterPic Ambassador since ${new Date(ambassadorDate).toLocaleDateString()}`}</span>
                </div>
            )}
        </div>
    );
};

export default ProfileInfo;
