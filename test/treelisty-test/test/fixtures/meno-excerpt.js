/**
 * Meno Excerpt Fixture
 *
 * A selection from Plato's Meno dialogue for scenario testing.
 * This excerpt covers the famous "What is virtue?" exchange.
 */

// Raw text excerpt (70a - 72d) - The opening exchange on virtue
export const menoExcerptText = `
MENO
PLATO

[70a] Meno (M): Can you tell me, Socrates, is virtue acquired by teaching? Or not by
teaching but by training? Or neither by training or learning, but it comes to men
naturally or in some other way?

Socrates (So): Before now, Meno, Thessalians were famous among the Greeks,
admired for their horsemanship and their wealth, but now, it seems, for their wisdom
[70b] too, especially the Larisaians, the townsfolk of your friend Aristippos. Gorgias
brought this about among you. When he arrived in the city he made the leading men of
the Aleuadai, including your lover Aristippos, lovers of his wisdom, along with the
other Thessalians. And in particular, he has gotten you into this habit, of answering
fearlessly and grandly if anyone asks a question, as befits someone with knowledge.

[71a] But around here, my friend Meno, the opposite is the norm, as though some
shortage of wisdom had occurred, and wisdom might have migrated from our
territory to yours. If you put a question like that to anyone here, there's no one who
won't laugh and say, "My friend, you must think me to be one of the fortunate few, to
know whether virtue is acquired by teaching or in what way it comes to be. I am so far
from knowing whether or not it is teachable that I don't at all know just what virtue
itself is."

[71b] And indeed I myself, Meno, am in the same state. I am impoverished along with
my townsfolk in this matter and I scold myself for not knowing the first thing about
virtue. And when I don't know what some thing is, how can I know what sort of thing it
is? Or do you think it is possible, if someone doesn't at all know who Meno is, to know
whether he is handsome or wealthy or further, noble, or the opposites of these? Does it
seem possible to you?

[71c] M: Not to me. But do you truly not know, Socrates, what virtue is? Is this the
report we will carry home about you?

So: Not only that, my friend, but further, that I also had not met anyone else who
knew, as it seemed to me.

[71e] M: But it's not hard to say, Socrates. To begin with, if you want the virtue of a
man, it's easy. A man's virtue is this: to attend to the affairs of the city effectively and, in
the process, to benefit his friends and harm his enemies and make sure that he suffers
nothing similar himself. If you're looking for the virtue of a woman, it's not hard to
express. It's to manage her home well, preserving her possessions and being obedient to
her husband. And there's a different virtue for children, both male and female, and for
an old man, and, if you want, for a free man and, if you so desire, for a slave. And there
[72a] are so many other virtues that there's no problem saying what virtue is, since
there's a virtue for each occupation and stage of life with respect to each function of
each person.

So: It seems I've had some great good fortune, Meno, if, when looking for a
single virtue, I have discovered in your possession some kind of swarm of virtues. And
[72b] in keeping with that image, of swarms, if I asked what the essence of a bee was
and you were to say that there are many different kinds, how would you answer me if I
asked, "Do you mean that with this respect to this, their being bees, that there are many
different kinds, different from one another? Or do they differ not at all in this respect,
but in some other, such as beauty or size or something else of this sort?"

M: To this I would say that they do not differ at all insofar as they are bees, the
one from the other.

[72c] So: And if after this I said, "Now tell me this, Meno. By what do they not differ
but are all alike, what do you say this is?" Presumably you would have something to
say to me?

M: I would.

So: The same applies to the virtues, too. Even if there are many different kinds,
they all have some one, same, form, on account of which they are virtues, and which, I
suppose, a person who is answering another who asked for what virtue actually is to
[72d] be made clear would rightly have paid attention to. Or don't you understand what
I mean?
`;

// Expected Philosophy pattern structure after tree-listing
// This represents what a GOOD tree-listing of the Meno should produce
export const menoExpectedStructure = {
    id: 'root',
    name: 'Meno: What is Virtue?',
    type: 'root',
    schemaVersion: 1,
    pattern: 'philosophy',
    hyperedges: [],
    snapshotRefs: [],
    aiConfig: {
        tone: 'neutral',
        verbosity: 'balanced',
        dialecticMode: true,
        customInstructions: ''
    },
    children: [
        {
            id: 'movement-0',
            name: 'Opening Question',
            type: 'phase',
            phase: 0,
            subtitle: 'Opening Question',
            items: [
                {
                    id: 'claim-0-0',
                    name: "Meno's Initial Question",
                    type: 'item',
                    itemType: 'question',
                    description: 'Can virtue be taught, trained, or is it natural?',
                    subItems: [
                        {
                            id: 'support-0-0-0',
                            name: 'Teaching hypothesis',
                            type: 'subtask',
                            description: 'Virtue acquired by teaching'
                        },
                        {
                            id: 'support-0-0-1',
                            name: 'Training hypothesis',
                            type: 'subtask',
                            description: 'Virtue acquired by training/practice'
                        },
                        {
                            id: 'support-0-0-2',
                            name: 'Nature hypothesis',
                            type: 'subtask',
                            description: 'Virtue comes naturally or by divine gift'
                        }
                    ]
                }
            ]
        },
        {
            id: 'movement-1',
            name: "Socrates' Confession of Ignorance",
            type: 'phase',
            phase: 1,
            subtitle: 'First Definition',
            items: [
                {
                    id: 'claim-1-0',
                    name: 'Prior question requirement',
                    type: 'item',
                    itemType: 'premise',
                    description: 'One must know WHAT virtue is before knowing HOW it is acquired',
                    subItems: [
                        {
                            id: 'support-1-0-0',
                            name: 'Meno analogy',
                            type: 'subtask',
                            description: 'Cannot know if Meno is handsome without knowing who Meno is'
                        }
                    ]
                },
                {
                    id: 'claim-1-1',
                    name: 'Socratic ignorance',
                    type: 'item',
                    itemType: 'premise',
                    description: 'Socrates claims not to know what virtue itself is'
                }
            ]
        },
        {
            id: 'movement-2',
            name: "Meno's First Definition",
            type: 'phase',
            phase: 2,
            subtitle: 'Refutation',
            items: [
                {
                    id: 'claim-2-0',
                    name: 'Virtue as role-specific excellence',
                    type: 'item',
                    itemType: 'definition',
                    description: 'Different virtues for different roles: man, woman, child, slave',
                    subItems: [
                        {
                            id: 'support-2-0-0',
                            name: "Man's virtue",
                            type: 'subtask',
                            description: 'Attend to city affairs, benefit friends, harm enemies'
                        },
                        {
                            id: 'support-2-0-1',
                            name: "Woman's virtue",
                            type: 'subtask',
                            description: 'Manage home well, preserve possessions, obey husband'
                        }
                    ]
                }
            ]
        },
        {
            id: 'movement-3',
            name: "Socrates' Refutation: The Swarm",
            type: 'phase',
            phase: 3,
            subtitle: 'Second Attempt',
            items: [
                {
                    id: 'claim-3-0',
                    name: 'The Bee Analogy',
                    type: 'item',
                    itemType: 'refutation',
                    description: 'Many bees differ in size/beauty but share one essence of bee-ness',
                    subItems: [
                        {
                            id: 'support-3-0-0',
                            name: 'Unity beneath plurality',
                            type: 'subtask',
                            description: 'Looking for the ONE form that makes all virtues virtue'
                        }
                    ]
                },
                {
                    id: 'claim-3-1',
                    name: 'Demand for essential definition',
                    type: 'item',
                    itemType: 'conclusion',
                    description: 'Need the single form (eidos) common to all virtues'
                }
            ]
        }
    ]
};

// Structural fidelity criteria for evaluation
export const structuralFidelityCriteria = {
    // Must capture the dialectical structure
    dialecticalFlow: {
        weight: 0.3,
        description: 'Does the tree capture the back-and-forth between Socrates and Meno?',
        checkpoints: [
            'Initial question captured',
            'Socratic response (ignorance) captured',
            'Meno\'s definition captured',
            'Refutation/analogy captured'
        ]
    },

    // Must identify argument types correctly
    argumentTypes: {
        weight: 0.25,
        description: 'Are claims correctly typed (question, premise, definition, refutation)?',
        expectedTypes: ['question', 'definition', 'refutation', 'premise', 'conclusion']
    },

    // Must preserve logical dependencies
    logicalStructure: {
        weight: 0.25,
        description: 'Are supporting points nested under their parent claims?',
        checkpoints: [
            'Hypotheses nested under opening question',
            'Meno analogy supports prior-question requirement',
            'Bee analogy supports refutation'
        ]
    },

    // Must not distort or omit key content
    contentFidelity: {
        weight: 0.2,
        description: 'Is the philosophical content accurately represented?',
        keyTerms: ['virtue', 'teaching', 'nature', 'swarm', 'form/eidos', 'essence']
    }
};

// Sample "bad" tree-listing for comparison (what NOT to do)
export const menoPoorStructure = {
    id: 'root',
    name: 'Meno Dialogue',
    type: 'root',
    schemaVersion: 1,
    pattern: 'philosophy',
    children: [
        {
            id: 'movement-0',
            name: 'Part 1',
            type: 'phase',
            items: [
                {
                    id: 'claim-0-0',
                    name: 'Discussion about virtue',
                    type: 'item',
                    description: 'Socrates and Meno talk about virtue'
                    // Problems: Too vague, no argument type, no structure
                }
            ]
        },
        {
            id: 'movement-1',
            name: 'Part 2',
            type: 'phase',
            items: [
                {
                    id: 'claim-1-0',
                    name: 'Bees are mentioned',
                    type: 'item',
                    description: 'Socrates uses a bee analogy'
                    // Problems: Misses the point, no connection to argument
                }
            ]
        }
    ]
};
