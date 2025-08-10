import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { collection, doc, getDocs, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import Image from 'next/image';

const FollowersFollowingPage = () => {
    const router = useRouter();
    const { userId, type } = router.query;
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId || !type) return;

        const fetchUsers = async () => {
            try {
                let collectionPath = '';
                if (type === 'followers') {
                    collectionPath = `followers/${userId}/userFollowers`;
                } else if (type === 'following') {
                    collectionPath = `following/${userId}/userFollowing`;
                }

                if (!collectionPath) return;

                const snapshot = await getDocs(collection(db, collectionPath));
                const userIds = snapshot.docs.map(doc => doc.id);
                const usersData = [];

                for (const id of userIds) {
                    const userDoc = await getDoc(doc(db, `users/${id}`));
                    if (userDoc.exists()) {
                        usersData.push({ id, ...userDoc.data() });
                    }
                }

                setUsers(usersData);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching followers/following:', error);
                setLoading(false);
            }
        };

        fetchUsers();
    }, [userId, type]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-950 to-green-500">
                <p className="text-white text-xl font-semibold">Loading...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-green-950 to-green-500 py-10 px-4">
            <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-xl p-10">
                <h2 className="text-4xl font-bold mb-12 text-center text-gray-800 tracking-wide">
                    {type === 'followers' ? 'Followers' : 'Following'}
                </h2>
                {users.length === 0 ? (
                    <p className="text-center text-gray-500 text-lg">{type === 'followers' ? "No Followers" : "Not Following Anyone" } yet.</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {users.map((user, index) => (
                            <div
                                key={index}
                                className="flex items-center p-6 bg-white rounded-2xl border border-gray-200 shadow-lg transform transition duration-500 hover:scale-105 hover:shadow-2xl hover:border-green-500 hover:bg-gradient-to-br from-white to-gray-200"
                            >
                                {/* Profile Image Section */}
                                <div className="flex-shrink-0">
                                    <div className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0">
                                        <Image
                                            src={user.photo_url || '/images/default-avatar.jpg'}
                                            alt={`${user.display_name}'s profile picture`}
                                            width={80}
                                            height={80}
                                            className="object-cover w-full h-full"
                                        />
                                    </div>
                                </div>
                                {/* Profile Info Section */}
                                <div className="ml-6 flex flex-col justify-center w-full max-w-[200px]">
                                    <h3 className="text-xl font-semibold text-gray-800 truncate overflow-hidden whitespace-nowrap">
                                        {user.display_name || 'No Display Name'}
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1">{user.organization || 'Independent'}</p>
                                    <button
                                        onClick={() => router.push(`/profile/${user.id}`)}
                                        className="mt-4 w-32 px-4 py-2 text-sm font-medium leading-6 text-white bg-gradient-to-r from-green-950 to-green-600 rounded-full shadow-md hover:from-green-600 hover:to-green-950 transition duration-300 text-center"
                                    >
                                        View Profile
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );



};

export default FollowersFollowingPage;
