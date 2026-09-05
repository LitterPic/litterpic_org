import React from "react";

const CustomButton = ({href, children}) => {
    return (
        <a href={href} className="donate-button">
            <span className="material-icons donate-button-icon" aria-hidden="true">volunteer_activism</span>
            <span>{children}</span>
        </a>
    );
};

export default CustomButton;
