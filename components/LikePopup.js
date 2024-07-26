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
                        <div key={user?.id || index} className={`like-user ${imageLoaded ? 'loaded' : 'loading'}`}>
                            <div className="user-info">
                                <img
                                    src={user?.photo_url || "https://t4.ftcdn.net/jpg/05/49/98/39/360_F_549983970_bRCkYfk0P6PP5fKbMhZMIb07mCJ6esXL.jpg"}
                                    alt={user?.display_name || "Volunteer"}
                                    className="user-photo"
                                    onLoad={() => setImageLoaded(true)}
                                />
                                <Link href={`/profile/${user?.uid || '#'}`} className="user-name">
                                    {user?.display_name || "Volunteer"}
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LikePopup;
