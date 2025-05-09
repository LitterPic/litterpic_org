import React from "react";

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
        name: 'Jennifer Babich  - Treasurer',
        image: '/images/Jen.webp',
        content: 'I enjoy cooking, baking, and seeing new places with my family. When driving to a new destination, ' +
            'first impressions are everything, and seeing trash on the road isn\'t fun. We like to repeat trips to ' +
            'areas that are taken care of and clean; it makes the experience more pleasant and unforgettable. I ' +
            'joined LitterPic to make a difference, to make the destination clean!',
    },
    {
        name: 'Sally Weiss  - Board Member',
        image: '/images/Sally.webp',
        content: 'As a native of beautiful Mount Desert Island, ME, I am passionate about the environment and ' +
            'keeping it healthy for future generations. I believe that everybody must do their part to contribute ' +
            'to a sustainable future, and I am excited to join the LitterPic initiative to help inspire others to ' +
            'do the same. Get outside!',
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

const BoardMembers = () => (
    <div>
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
);

export default BoardMembers;
