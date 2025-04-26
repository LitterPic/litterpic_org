import React from "react";

const ProfileHeader = ({ userPhoto, displayName, userEmail, onEdit }) => (
    <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
            <div className="w-28 h-28 rounded-full overflow-hidden">
                <img
                    src={userPhoto || "https://t4.ftcdn.net/jpg/05/49/98/39/360_F_549983970_bRCkYfk0P6PP5fKbMhZMIb07mCJ6esXL.jpg"}
                    alt="Profile Picture"
                    className="object-cover w-full h-full"
                />
            </div>
            <div>
                <h1 className="text-3xl font-bold text-gray-800">{displayName || "No Display Name"}</h1>
                <p className="text-sm text-gray-500 mt-1">{userEmail}</p>
            </div>
        </div>
        <button
            onClick={onEdit}
            className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-950 to-green-600 rounded-lg shadow-md hover:from-green-600 hover:to-green-950 transition duration-300"
        >
            Edit Profile
        </button>
    </div>
);

export default ProfileHeader;
