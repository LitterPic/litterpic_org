import React, {useEffect, useState} from 'react';
import Link from "next/link";

const LikePopup = ({likedUsers}) => {
    const [imageLoaded, setImageLoaded] = useState(false);

    useEffect(() => {
    }, [likedUsers]);

    return (
        <div className="like-list-container">
            {Array.isArray(likedUsers) && likedUsers.length > 0 && (
                <div className="like-list">
                    {likedUsers.map((user, index) => (
                        <div key={user?.uid || user?.id || index} className={`like-user ${imageLoaded ? 'loaded' : 'loading'}`}>
                            <div className="user-info">
                                <img
                                    src={user?.photo_url || "/images/default-avatar.jpg"}
                                    alt={user?.display_name || "Volunteer"}
                                    className="user-photo"
                                    onLoad={() => setImageLoaded(true)}
                                />
                                {user?.uid ? (
                                    <Link href={`/profile/${user.uid}`} className="user-name">
                                        {user?.display_name || "Volunteer"}
                                    </Link>
                                ) : (
                                    <span className="user-name disabled">
                                        {user?.display_name || "Volunteer"}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LikePopup;
