import React from "react";
import Head from "next/head";

const boardMembers = [
    {
        name: 'Alek Babich  - President & Executive Director',
        image: '/images/Alek.webp',
        content: 'A software engineer by trade, I\'ve been passionate about the environment ever since I can ' +
            'remember. I saw a need for a change, and this year decided to start LitterPic Inc. to make a difference ' +
            'and inspire others to lend a hand in cleaning litter from our roads, beaches, and parks!',
    },
    {
        name: 'Mel Tolman  - Vice President',
        image: '/images/Mel.webp',
        content: 'I love dogs and gardening.  I aim to learn and practice sustainable gardening with no pesticides ' +
            'or fertilizer and plant flowers and vegetables native to our area.  These small actions will help ' +
            'preserve our environment and sustain our pollinators, birds, butterflies, and bees!  We need to take ' +
            'care of our planet, and we can make a difference, one step at a time!',
    },
    {
        name: 'Sally Weiss  - Secretary',
        image: '/images/Sally.webp',
        content: 'As a native of beautiful Mount Desert Island, ME, I am passionate about the environment and ' +
            'keeping it healthy for future generations. I believe that everybody must do their part to contribute ' +
            'to a sustainable future, and I am excited to join the LitterPic initiative to help inspire others to ' +
            'do the same. Get outside!',
    },
    {
        name: 'Jennifer Babich  - Treasurer',
        image: '/images/Jen.webp',
        content: 'I enjoy cooking, baking, and seeing new places with my family. When driving to a new destination, ' +
            'first impressions are everything, and seeing trash on the road isn\'t fun. We like to repeat trips to ' +
            'areas that are taken care of and clean; it makes the experience more pleasant and unforgettable. I ' +
            'joined LitterPic to make a difference, to make the destination clean!',
    },
    {
        name: 'Jason Toussaint  - Board Member',
        image: '/images/Jason.webp',
        content: 'As someone who has enjoyed the outdoors their entire life, I believe taking care of and ' +
            'preserving the environment around us is essential. If everyone does their part, we can keep this ' +
            'planet beautiful and help protect the land, water, and animal species that are in danger from ' +
            'pollution. If we all could do even a little bit now, we can make a difference for ourselves and ' +
            'future generations.',
    }
];

const About = () => {
    return (
        <div>
            <Head>
                <title>About LitterPic</title>
                <meta name="description"
                      content="LitterPic Inc. champions a litter-free world through innovative technology. We inspire global
                      action against litter, offer a community-connecting app, and envision self-driving trucks for urban
                      cleanup. Join our mission for a cleaner planet."/>
                <meta name="robots" content="index, follow"/>
                {/*<link rel="canonical" href="https://litterpic.org/about"/>*/}

                <meta property="og:title" content="LitterPic"/>
                <meta property="og:description"
                      content="LitterPic Inc. champions a litter-free world through innovative technology. We inspire global
                      action against litter, offer a community-connecting app, and envision self-driving trucks for urban
                      cleanup. Join our mission for a cleaner planet."/>
                <meta property="og:image" content="https://litterpic.org/images/litter_pic_logo.png"/>
                <meta property="og:url" content="https://litterpic.org/about"/>
                <meta property="og:type" content="website"/>

                <meta name="twitter:card" content="summary_large_image"/>
                <meta name="twitter:title" content="LitterPic"/>
                <meta name="twitter:description"
                      content="LitterPic Inc. champions a litter-free world through innovative technology. We inspire global
                      action against litter, offer a community-connecting app, and envision self-driving trucks for urban
                      cleanup. Join our mission for a cleaner planet."/>
                <meta name="twitter:image" content="https://litterpic.org/images/litter_pic_logo.png"/>
            </Head>
            <div className="banner">
                <img src="/images/pine_trees_banner.webp" alt="Banner Image"/>
            </div>

            <div className="page">
                <div className="content">
                    <h1 className="heading-text">About Us</h1>
                    <p className="about-us-content">
                        At LitterPic Inc., our vision is bold and unwavering: a world free of litter. We refuse to
                        accept a reality where trash litters our streets, pollutes our waterways, and endangers our
                        wildlife.
                    </p>
                    <p className="about-us-content">
                        We believe that every person has the power to make a difference, and our mission is to inspire
                        and empower individuals worldwide to act against litter. By uniting our efforts, we can create a
                        cleaner, safer, and healthier planet for ourselves and future generations.
                    </p>
                    <p className="about-us-content">
                        At LitterPic, we're not just dreaming of a better world but actively working to make it a
                        reality. We're harnessing the power of technology to connect people, facilitate litter cleanups,
                        and share inspiring stories of individuals who are making a difference.
                    </p>
                    <p className="about-us-content">
                        In addition to our efforts to inspire and empower individuals to act against litter, we are also
                        leveraging technology to make it easier for people to participate. Our team is developing a
                        mobile app that will enable users to connect with other volunteers, organize litter cleanups,
                        and share their progress and impact.
                    </p>
                    <p className="about-us-content">
                        Our long-term goal is to create a fleet of self-driving vacuum trucks that can efficiently and
                        effectively clean up litter in even the busiest urban areas.
                    </p>
                    <p className="about-us-content">
                        Through the power of technology and community, we are determined to make our vision of a world
                        free of litter a reality. Join us in the fight against litter, and together, we can create a
                        cleaner, safer, and more beautiful planet for all.
                    </p>

                    <div className="directors-text">LitterPic Inc. Board of Directors</div>
                    {boardMembers.map((member, index) => (
                        <div className="member-container" key={index}>
                            <img className="member-image" src={member.image} alt={member.name}/>
                            <div className="member-content">
                                <h3>{member.name}</h3>
                                <p>{member.content}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default About;
