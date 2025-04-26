import { useState } from 'react';

export default function SignInInputs({ email, setEmail, password, setPassword, isMigratedUser }) {
    const [showPassword, setShowPassword] = useState(false);
    const [showIcon, setShowIcon] = useState(false);

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div>
            <div className="sign-in-new-user-heading">
                New to LitterPic?
                <a className="sign-in-sign-up-link" href="/signup">Sign Up</a>
            </div>
            <input
                className="sign-in-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
            />
            <div className="signup-password-container">
                <input
                    className="sign-in-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    required
                    readOnly={isMigratedUser}
                    onFocus={() => setShowIcon(true)}
                />
                {showIcon && (
                    <i
                        className="material-icons signup-password-toggle-icon"
                        onClick={togglePasswordVisibility}
                    >
                        {showPassword ? 'visibility_off' : 'visibility'}
                    </i>
                )}
            </div>
        </div>
    );
}
