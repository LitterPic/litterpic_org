import React from "react";

const CustomButton = ({href, children}) => {
    return (
        <a href={href} className="donate-button">
            {children}
        </a>
    );
};

export default CustomButton;
