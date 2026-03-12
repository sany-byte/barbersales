import React, { useState } from 'react';
import './Tooltip.css';

const Tooltip = ({ text, children, position = 'right', disabled = false }) => {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div
            className="tooltip-container"
            onMouseEnter={() => !disabled && setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children}
            {isVisible && !disabled && (
                <div className={`tooltip-box tooltip-${position}`}>
                    {text}
                </div>
            )}
        </div>
    );
};

export default Tooltip;
