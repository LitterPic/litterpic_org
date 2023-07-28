import React from "react";
import DonorBox from "../components/donorbox";


const Donate = () => {
    return (
        <div>
            <div className="banner">
                <img src="/images/AboutUsBanner.webp" alt="Banner Image"/>
            </div>

            <div className="page">
                <div className="content">
                    <h1 className="heading-text">Donate</h1>
                    <div className="donate">
                        <div className="donorbox-widget">
                            <div className="donorbox-container">
                                <DonorBox/>
                            </div>
                            <div className="donorbox-images-container-desktop">
                                <img className="donate-image-desktop" src="/images/501(c)(3).webp" alt="501(c)(3)"/>
                                <img className="donate-image-desktop" src="/images/nonprofit_seal.webp"
                                     alt="Nonprofit Seal"/>
                            </div>
                        </div>
                        <p className="donate-tax">
                            LITTERPIC INC is a 501(c)(3) charitable organization, EIN 88-2549690. All donations
                            are
                            tax-deductible
                            absent any limitations on deductions applicable to a particular taxpayer.
                        </p>
                        <br/>
                        <div>
                            <h1 className="heading-text">Help support the mission of a cleaner environment!!</h1>
                            <p>
                                If you would like to talk about how you can volunteer or have a project we can help
                                with, please email or give us a call. We look forward to hearing from you!
                            </p>
                        </div>

                        <div className="donate-legal-text">
                            <br/>
                            <p>
                                Donations are the lifeblood of LitterPic, allowing us to continue our work towards a
                                world
                                free
                                of
                                litter. Your contributions go directly towards supporting our efforts to inspire and
                                empower
                                people
                                to act against litter, making a tangible impact on the health of our planet.
                            </p>
                            <br/>
                            <p>
                                Your donations help us maintain and improve our platform, ensuring it remains
                                user-friendly,
                                secure,
                                and up-to-date. We also use donations to purchase essential litter-picking
                                equipment,
                                including
                                grabbers, bags, and gloves, that enable our volunteers to pick up litter safely and
                                effectively.
                            </p>
                            <br/>
                            <p>
                                Your generous donations enable us to make a real difference in the fight against
                                litter.
                                With
                                your
                                support, we plan to organize and fund events that bring together volunteers from all
                                walks
                                of
                                life
                                to clean up our communities and make them more beautiful, safe, and healthy places
                                to
                                live.
                            </p>
                            <br/>
                            <p>
                                In addition to supporting our future litter-picking events, your donations help us
                                maintain
                                our
                                status as a registered nonprofit organization and pay nonprofit dues. This ensures
                                that
                                we
                                can
                                continue to operate as a legitimate and effective force in the fight against litter.
                            </p>
                            <br/>
                            <p>
                                At LitterPic, we believe that every dollar counts and appreciate any support we
                                receive
                                from
                                our
                                community. We are committed to using your donations efficiently and effectively to
                                achieve
                                our
                                mission of abolishing litter worldwide. Together, we can make a lasting impact on
                                the
                                health
                                and
                                well-being of our planet.
                            </p>
                            <br/>
                        </div>
                        <div className="donorbox-images-container">
                            <div className="donate-image-container">
                                <img className="donate-image" src="/images/501(c)(3).webp" alt="501(c)(3)"/>
                                <img className="donate-image" src="/images/nonprofit_seal.webp" alt="Nonprofit Seal"/>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
        ;
};

export default Donate;
