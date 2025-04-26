import React from "react";
import { useRouter } from "next/router";

const ProfileStats = ({ followers, following, userId }) => {
    const router = useRouter();

    return (
        <div className="flex gap-10 mt-8">
            <div
                onClick={() => router.push(`/user/${userId}/followers`)}
                className="cursor-pointer text-center hover:bg-green-100 hover:shadow-lg rounded-md transition duration-200 ease-in-out"
            >
                <p className="text-2xl font-bold text-green-950 hover:text-green-700 transition duration-200 ease-in-out">{followers}</p>
                <p className="text-gray-600 hover:text-gray-800 transition duration-200 ease-in-out">Followers</p>
            </div>
            <div
                onClick={() => router.push(`/user/${userId}/following`)}
                className="cursor-pointer text-center hover:bg-green-100 hover:shadow-lg rounded-md transition duration-200 ease-in-out"
            >
                <p className="text-2xl font-bold text-green-950 hover:text-green-700 transition duration-200 ease-in-out">{following}</p>
                <p className="text-gray-600 hover:text-gray-800 transition duration-200 ease-in-out">Following</p>
            </div>
        </div>
    );
};

export default ProfileStats;
