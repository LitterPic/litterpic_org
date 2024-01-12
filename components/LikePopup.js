import React, {useEffect, useState} from 'react';

const LikePopup = ({likedUsers}) => {
    const [imageLoaded, setImageLoaded] = useState(false);

    useEffect(() => {
    }, [likedUsers]);

    return (
        <div className="like-list-container">
            {Array.isArray(likedUsers) && likedUsers.length > 0 && (
                <div className="like-list">
                    {likedUsers.map((user) => (
                        <div key={user.id} className={`like-user ${imageLoaded ? 'loaded' : 'loading'}`}>
                            <div className="user-info">
                                <img
                                    src={user.photo_url || "https://t4.ftcdn.net/jpg/05/49/98/39/360_F_549983970_bRCkYfk0P6PP5fKbMhZMIb07mCJ6esXL.jpg"}
                                    alt={user.display_name}
                                    className="user-photo"
                                    onLoad={() => setImageLoaded(true)}
                                />
                                <span className="user-name">{user.display_name}</span>
                                {/* Add the liked date here */}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LikePopup;
