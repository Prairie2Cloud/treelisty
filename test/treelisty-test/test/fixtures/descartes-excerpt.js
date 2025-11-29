/**
 * Descartes Meditations Excerpt Fixture
 *
 * From Meditation II - The Cogito argument
 * Public domain translation
 */

export const descartesExcerptText = `
MEDITATION II
OF THE NATURE OF THE HUMAN MIND

Yesterday's meditation filled my mind with so many doubts that it is no longer in my power to forget them. I see no way to resolve them. As if I had suddenly fallen into very deep water, I am so taken aback that I can neither plant my feet on the bottom nor swim to the top.

But I will make an effort and try once again the same path as yesterday. I will reject everything that admits of the slightest doubt, as if I had found it to be absolutely false. I will continue until I know something certain, or at least until I know for certain that nothing is certain.

Archimedes sought but one firm and immovable point to move the whole earth. Great things are to be hoped for if I am fortunate enough to find one thing that is certain and indubitable.

I suppose then that all things I see are false. I believe that none of what my deceitful memory represents ever existed. I have no senses. Body, shape, extension, motion, and place are chimeras. What then will be true? Perhaps only this one thing: that nothing is certain.

But how do I know there is not something different from all these things I have listed, about which there is not the slightest occasion for doubt? Is there not some God, or by whatever name I might call him, who puts these thoughts into me? But why would I think that, since I myself could be the author of these thoughts?

Am I not at least something? But I have already denied that I have any senses or any body. Still, I hesitate, for what follows from this? Am I so bound to the body and the senses that I cannot exist without them?

But I have persuaded myself that there is nothing at all in the world: no heaven, no earth, no minds, no bodies. Does it follow that I too do not exist? No, surely I must exist if I persuaded myself of something.

But there is a deceiver, supremely powerful and cunning, who deliberately deceives me all the time. Then too there is no doubt that I exist, if he is deceiving me. Let him deceive me as much as he can, he will never bring it about that I am nothing so long as I think I am something.

Thus, having weighed all these considerations sufficiently and more than sufficiently, I must finally conclude that this proposition, I AM, I EXIST, is necessarily true whenever I assert it or conceive it in my mind.

But I do not yet understand sufficiently what I am, I who now necessarily exist. So I must be careful that I do not perhaps substitute something else in place of me and thus make a mistake in this knowledge that I claim to be the most certain and evident of all.
`;

// Expected structure for the Cogito argument
export const descartesExpectedStructure = {
    id: 'root',
    name: 'Meditation II: The Cogito',
    type: 'root',
    schemaVersion: 1,
    pattern: 'philosophy',
    hyperedges: [],
    snapshotRefs: [],
    aiConfig: {},
    children: [
        {
            id: 'movement-0',
            name: 'Method of Doubt',
            type: 'phase',
            phase: 0,
            subtitle: 'Systematic doubt of all beliefs',
            items: [
                {
                    id: 'claim-0-0',
                    name: 'Rejection of uncertain beliefs',
                    type: 'item',
                    itemType: 'premise',
                    description: 'Reject everything that admits of the slightest doubt',
                    subItems: [
                        {
                            id: 'support-0-0-0',
                            name: 'Archimedes point',
                            type: 'subtask',
                            description: 'Seeking one firm and immovable point of certainty'
                        }
                    ]
                }
            ]
        },
        {
            id: 'movement-1',
            name: 'Universal Doubt',
            type: 'phase',
            phase: 1,
            subtitle: 'Doubting senses, body, and external world',
            items: [
                {
                    id: 'claim-1-0',
                    name: 'Senses are deceptive',
                    type: 'item',
                    itemType: 'premise',
                    description: 'All sensory experience may be false',
                    subItems: []
                },
                {
                    id: 'claim-1-1',
                    name: 'Deceiver hypothesis',
                    type: 'item',
                    itemType: 'premise',
                    description: 'A supremely powerful deceiver may be fooling me',
                    subItems: []
                }
            ]
        },
        {
            id: 'movement-2',
            name: 'The Cogito Discovery',
            type: 'phase',
            phase: 2,
            subtitle: 'Finding the indubitable foundation',
            items: [
                {
                    id: 'claim-2-0',
                    name: 'Self-refuting doubt',
                    type: 'item',
                    itemType: 'refutation',
                    description: 'If I am being deceived, I must exist to be deceived',
                    subItems: [
                        {
                            id: 'support-2-0-0',
                            name: 'Deception requires existence',
                            type: 'subtask',
                            description: 'The deceiver cannot make me nothing while I think I am something'
                        }
                    ]
                }
            ]
        },
        {
            id: 'movement-3',
            name: 'Cogito Conclusion',
            type: 'phase',
            phase: 3,
            subtitle: 'The certain foundation',
            items: [
                {
                    id: 'claim-3-0',
                    name: 'I am, I exist',
                    type: 'item',
                    itemType: 'conclusion',
                    description: 'This proposition is necessarily true whenever asserted or conceived',
                    subItems: [
                        {
                            id: 'support-3-0-0',
                            name: 'Most certain knowledge',
                            type: 'subtask',
                            description: 'The most certain and evident of all knowledge'
                        }
                    ]
                },
                {
                    id: 'claim-3-1',
                    name: 'What am I?',
                    type: 'item',
                    itemType: 'question',
                    description: 'I do not yet understand sufficiently what I am',
                    subItems: []
                }
            ]
        }
    ]
};
