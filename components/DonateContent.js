import React from "react";
import DonorBox from "../components/donorbox";

const DonationContent = () => (
    <div className="content">
        <h1 className="heading-text">Donate</h1>
        <div className="donate">
            <div className="donorbox-widget">
                <div className="donation-use">
                    <h1 className="donation-text-grid">With your help, We will...</h1>
                    <img className="donate-use-image" src="/images/Donation_Use.png"
                         alt="What we use donations for"/>

                    <div className="donate-grid-container">
                        <div className="donate-grid-item">
                            <p>By contributing, you're helping us organize impactful community events and cleanups, uniting individuals in the common goal of keeping our neighborhoods clean and green.</p>
                        </div>

                        <div className="donate-grid-item">
                            <p>With your donations, we invest in cutting-edge technology and innovative solutions, amplifying our ability to address litter issues efficiently and pave the way for a cleaner future.</p>
                        </div>

                        <div className="donate-grid-item">
                            <p>Your support helps us create and distribute educational materials, fostering awareness about the consequences of litter and promoting sustainable practices.</p>
                        </div>

                        <div className="donate-grid-item">
                            <p>With your generous donations, we provide essential cleanup supplies like gloves and bags, empowering volunteers to make a tangible impact on our environment.</p>
                        </div>
                    </div>
                </div>
                <div className="donorbox-container">
                    <DonorBox/>
                </div>
            </div>
            <p className="donate-tax">
                LITTERPIC INC is a 501(c)(3) charitable organization, EIN 88-2549690. All donations are tax-deductible absent any limitations on deductions applicable to a particular taxpayer.
            </p>
            <br/>
            <div>
                <h1 className="heading-text">Help support the mission of a cleaner environment!!</h1>
                <p>
                    If you would like to talk about how you can volunteer or have a project we can help with, please email or give us a call. We look forward to hearing from you!
                </p>
            </div>

            <div className="donate-legal-text">
                <br/>
                <p>
                    Donations are the lifeblood of LitterPic, allowing us to continue our work towards a world free of litter. Your contributions go directly towards supporting our efforts to inspire and empower people to act against litter, making a tangible impact on the health of our planet.
                </p>
                <br/>
                <p>
                    Your donations help us maintain and improve our platform, ensuring it remains user-friendly, secure, and up-to-date. We also use donations to purchase essential litter-picking equipment, including grabbers, bags, and gloves, that enable our volunteers to pick up litter safely and effectively.
                </p>
                <br/>
                <p>
                    Your generous donations enable us to make a real difference in the fight against litter. With your support, we plan to organize and fund events that bring together volunteers from all walks of life to clean up our communities and make them more beautiful, safe, and healthy places to live.
                </p>
                <br/>
                <p>
                    In addition to supporting our future litter-picking events, your donations help us maintain our status as a registered nonprofit organization and pay nonprofit dues. This ensures that we can continue to operate as a legitimate and effective force in the fight against litter.
                </p>
                <br/>
                <p>
                    At LitterPic, we believe that every dollar counts and appreciate any support we receive from our community. We are committed to using your donations efficiently and effectively to achieve our mission of abolishing litter worldwide. Together, we can make a lasting impact on the health and well-being of our planet.
                </p>
                <br/>
            </div>
            <div className="donorbox-images-container-desktop">
                <img className="donate-image-desktop" src="/images/501(c)(3).webp" alt="501(c)(3)"/>
            </div>
            <div className="donorbox-images-container">
                <div className="donate-image-container">
                    <img className="donate-image" src="/images/501(c)(3).webp" alt="501(c)(3)"/>
                    <img className="donate-image" src="/images/nonprofit_seal.webp" alt="Nonprofit Seal"/>
                </div>
            </div>
        </div>
    </div>
);

export default DonationContent;
