import React from "react";
import Image from "next/image";
import ImagePreloader from "./ImagePreloader";

// Images to preload
const communityServiceImages = [
    "/images/optimized/plastic-garbage-near-metallic-bin-park.webp",
    "/images/optimized/young-activist-taking-action.webp",
    "/images/optimized/lucas-van-oort-mhtPKJrG_EU-unsplash.webp",
    "/images/optimized/closeup-plastic-bottle-male-hand-cleaning-up-nature.webp"
];

const CommunityServiceContent = () => (
    <div className="page">
        <ImagePreloader imagePaths={communityServiceImages} />
        <div className="content">
            <h1 className="heading-text">Community Service Hours</h1>
            <div className="image-row">
                <div className="image-container">
                    <Image
                        src="/images/optimized/plastic-garbage-near-metallic-bin-park.webp"
                        alt="Plastic garbage near a metallic bin in a park"
                        fill
                        sizes="125px"
                        className="community-service-image"
                        priority
                        style={{ objectFit: 'cover' }}
                    />
                </div>
                <div className="image-container">
                    <Image
                        src="/images/optimized/young-activist-taking-action.webp"
                        alt="Young activist taking action against litter"
                        fill
                        sizes="125px"
                        className="community-service-image"
                        priority
                        style={{ objectFit: 'cover' }}
                    />
                </div>
                <div className="image-container">
                    <Image
                        src="/images/optimized/lucas-van-oort-mhtPKJrG_EU-unsplash.webp"
                        alt="Person collecting litter on a beach"
                        fill
                        sizes="125px"
                        className="community-service-image"
                        priority
                        style={{ objectFit: 'cover' }}
                    />
                </div>
                <div className="image-container">
                    <Image
                        src="/images/optimized/closeup-plastic-bottle-male-hand-cleaning-up-nature.webp"
                        alt="Closeup of a plastic bottle in a male hand cleaning up nature"
                        fill
                        sizes="125px"
                        className="community-service-image"
                        priority
                        style={{ objectFit: 'cover' }}
                    />
                </div>
            </div>
            <p>
                At LitterPic, we extend our deepest gratitude to all volunteers who have chosen us as their nonprofit
                organization to complete their community service hours. We appreciate your dedication and commitment
                to making the world cleaner and healthier. To complete your community service hours with LitterPic,
                please ensure that you:
            </p>
            <br/>
            <div className="blank-space"></div>
            <ol>
                <li>Clean a littered area of your choice; take before and after pictures to show off your efforts
                    and inspire others.
                </li>
                <li>After taking photos of the litter and litter bags collected, correctly recycle and dispose of
                    the litter.
                </li>
                <li>Create a post with before and after pictures of collected litter and a picture of the litter
                    bags collected.
                </li>
                <li>Comply with safety guidelines, wear appropriate clothing and equipment, and follow all laws
                    and regulations during the cleanup.
                </li>
            </ol>
            <div className="blank-space"></div>
            <p>
                You can request validation of your service hours and obtain proof through LitterPic by emailing {' '}
                <a href="mailto:contact@litterpic.org">contact@litterpic.org</a>
                .
            </p>
            <p>
                In your email, please provide your name, LitterPic.org login email, the number of hours needing
                verification, and the contact information of the requesting party. After we validate your posts,
                we will gladly issue a letter to the relevant requesting party.
            </p>
            <p>
                LitterPic will diligently verify the photo metadata and cross-check the recorded hours with the
                accompanying visuals to ensure the authenticity of all submissions; LitterPic reserves the right
                to request original photos taken to resolve any discrepancies. We are eagerly anticipating
                witnessing the positive impact that your contributions will bring about in your community.
            </p>
            <p>
                Please don't hesitate to reach out if you have any questions.
            </p>
        </div>
    </div>
);

export default CommunityServiceContent;
