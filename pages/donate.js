import React from "react";
import DonorBox from "../components/donorbox";


const Donate = () => {
    return (
        <div className="content">
            <div className="donate">
                <div className="image_container">
                    <img className="donate-image" src="/images/501(c)(3).webp" alt="501(c)(3)"/>
                    <img className="donate-image" src="/images/nonprofit_seal.webp" alt="Nonprofit Seal"/>
                </div>

                <div className="legal_donorbox_container">


                    <div className="legal">
                        <p>
                            LITTERPIC INC is a 501(c)(3) charitable organization, EIN 88-2549690. All donations are
                            tax-deductible
                            absent any limitations on deductions applicable to a particular taxpayer.
                        </p>
                        <p>
                            Donations are the lifeblood of LitterPic, allowing us to continue our work towards a world
                            free
                            of
                            litter. Your contributions go directly towards supporting our efforts to inspire and empower
                            people
                            to act against litter, making a tangible impact on the health of our planet.
                        </p>
                        <p>
                            Your donations help us maintain and improve our platform, ensuring it remains user-friendly,
                            secure,
                            and up-to-date. We also use donations to purchase essential litter-picking equipment,
                            including
                            grabbers, bags, and gloves, that enable our volunteers to pick up litter safely and
                            effectively.
                        </p>
                        <p>
                            Your generous donations enable us to make a real difference in the fight against litter.
                            With
                            your
                            support, we plan to organize and fund events that bring together volunteers from all walks
                            of
                            life
                            to clean up our communities and make them more beautiful, safe, and healthy places to live.
                        </p>
                        <p>
                            In addition to supporting our future litter-picking events, your donations help us maintain
                            our
                            status as a registered nonprofit organization and pay nonprofit dues. This ensures that we
                            can
                            continue to operate as a legitimate and effective force in the fight against litter.
                        </p>
                        <p>
                            At LitterPic, we believe that every dollar counts and appreciate any support we receive from
                            our
                            community. We are committed to using your donations efficiently and effectively to achieve
                            our
                            mission of abolishing litter worldwide. Together, we can make a lasting impact on the health
                            and
                            well-being of our planet.
                        </p>
                    </div>

                    <div className="donorbox_container">
                        <DonorBox/>
                    </div>


                </div>

            </div>
        </div>
    )
        ;
};

export default Donate;
