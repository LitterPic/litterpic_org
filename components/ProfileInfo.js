import React from "react";

const ProfileInfo = ({ userOrganization, litterCollected, userBio, memberSince, isAmbassador, ambassadorDate }) => {
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
            <div>
                <p className="text-sm text-gray-500 font-semibold">Organization</p>
                <p className="text-md text-gray-800">{userOrganization || "Independent"}</p>
            </div>
            <div>
                <p className="text-sm text-gray-500 font-semibold">Collected</p>
                <p className="text-md text-gray-800">{renderCollected()}</p>
            </div>
            <div className="md:col-span-2">
                <p className="text-sm text-gray-500 font-semibold">Bio</p>
                <p className="text-md text-gray-800">{userBio || "No Bio Available"}</p>
            </div>
            <div>
                <p className="text-sm text-gray-500 font-semibold">Member Since</p>
                <p className="text-md text-gray-800">{memberSince ? memberSince.toLocaleDateString() : "Not Available"}</p>
            </div>
            {isAmbassador && (
                <div className="bg-gradient-to-r from-green-950 to-green-700 text-white rounded-lg shadow-md p-4 mt-8 flex items-center gap-3">
                    <i className="material-icons text-xl">public</i>
                    <p className="text-md">{`LitterPic Ambassador since ${new Date(ambassadorDate).toLocaleDateString()}`}</p>
                </div>
            )}
        </div>
    );
};

export default ProfileInfo;
