/**
 * LifeTree Test Fixtures
 *
 * Fixtures for testing LifeTree health check functionality.
 * Each fixture represents a specific issue type that health check should detect.
 */

/**
 * Clean LifeTree - no issues (baseline for comparison)
 * All required and desired fields are populated to avoid sparse detection
 */
export const cleanLifeTree = {
    id: 'root',
    name: 'Test Person',
    type: 'root',
    schemaVersion: 1,
    pattern: { key: 'lifetree' },
    hyperedges: [],
    snapshotRefs: [],
    aiConfig: {},
    children: [
        {
            id: 'phase-childhood',
            name: 'Childhood (1990-2000)',
            type: 'phase',
            phase: 0,
            expanded: true,
            items: [
                {
                    id: 'item-birth',
                    name: 'Born in Springfield',
                    type: 'item',
                    eventDate: 'March 15, 1990',
                    age: '0',
                    location: 'Springfield, IL',
                    description: 'Born at Memorial Hospital',
                    people: 'Parents',
                    emotion: 'joy',
                    confidence: 'Exact',
                    source: 'Birth certificate'
                }
            ]
        },
        {
            id: 'phase-youth',
            name: 'Youth (2000-2010)',
            type: 'phase',
            phase: 1,
            expanded: true,
            items: [
                {
                    id: 'item-graduation',
                    name: 'High School Graduation',
                    type: 'item',
                    eventDate: 'June 2008',
                    age: '18',
                    location: 'Springfield High School',
                    description: 'Graduated with honors',
                    people: 'Family, friends',
                    emotion: 'pride',
                    source: 'Diploma'
                }
            ]
        }
    ]
};

/**
 * LifeTree with empty phases - health check should flag
 */
export const lifeTreeWithEmptyPhases = {
    id: 'root',
    name: 'Test Person',
    type: 'root',
    schemaVersion: 1,
    pattern: { key: 'lifetree' },
    hyperedges: [],
    children: [
        {
            id: 'phase-childhood',
            name: 'Childhood (1990-2000)',
            type: 'phase',
            phase: 0,
            items: [
                {
                    id: 'item-birth',
                    name: 'Born',
                    type: 'item',
                    eventDate: '1990'
                }
            ]
        },
        {
            id: 'phase-empty',
            name: 'Missing Years (2000-2010)',
            type: 'phase',
            phase: 1,
            items: [] // ISSUE: Empty phase
        },
        {
            id: 'phase-adulthood',
            name: 'Adulthood (2010-2020)',
            type: 'phase',
            phase: 2,
            items: [
                {
                    id: 'item-college',
                    name: 'College graduation',
                    type: 'item',
                    eventDate: '2012'
                }
            ]
        }
    ]
};

/**
 * LifeTree with redundant periods - overlapping decade names
 */
export const lifeTreeWithRedundantPeriods = {
    id: 'root',
    name: 'Test Person',
    type: 'root',
    schemaVersion: 1,
    pattern: { key: 'lifetree' },
    hyperedges: [],
    children: [
        {
            id: 'phase-childhood-1',
            name: 'Childhood', // Duplicate name
            type: 'phase',
            phase: 0,
            items: [{ id: 'i1', name: 'Event 1', type: 'item' }]
        },
        {
            id: 'phase-childhood-2',
            name: 'Childhood', // ISSUE: Duplicate name
            type: 'phase',
            phase: 1,
            items: [{ id: 'i2', name: 'Event 2', type: 'item' }]
        },
        {
            id: 'phase-youth',
            name: 'Youth',
            type: 'phase',
            phase: 2,
            items: [{ id: 'i3', name: 'Event 3', type: 'item' }]
        }
    ]
};

/**
 * LifeTree with chronology issues - events out of order by date
 */
export const lifeTreeWithChronologyIssues = {
    id: 'root',
    name: 'Test Person',
    type: 'root',
    schemaVersion: 1,
    pattern: { key: 'lifetree' },
    hyperedges: [],
    children: [
        {
            id: 'phase-youth',
            name: 'Youth (2000-2010)',
            type: 'phase',
            phase: 0, // Should be later
            items: [
                {
                    id: 'item-1',
                    name: 'College graduation',
                    type: 'item',
                    eventDate: '2015' // Later date
                }
            ]
        },
        {
            id: 'phase-childhood',
            name: 'Childhood (1990-2000)',
            type: 'phase',
            phase: 1, // Should be first
            items: [
                {
                    id: 'item-2',
                    name: 'Born',
                    type: 'item',
                    eventDate: '1990' // Earlier date - ISSUE: out of order
                }
            ]
        }
    ]
};

/**
 * LifeTree with sparse events - phases with minimal detail
 */
export const lifeTreeWithSparseEvents = {
    id: 'root',
    name: 'Test Person',
    type: 'root',
    schemaVersion: 1,
    pattern: { key: 'lifetree' },
    hyperedges: [],
    children: [
        {
            id: 'phase-childhood',
            name: 'Childhood (1990-2000)',
            type: 'phase',
            phase: 0,
            items: [
                {
                    id: 'item-sparse',
                    name: 'Something happened',
                    type: 'item'
                    // ISSUE: Missing eventDate, age, location, description
                }
            ]
        }
    ]
};

/**
 * LifeTree with multiple issues (integration test fixture)
 * Has: empty phase, redundant names, chronology issues, sparse events
 */
export const lifeTreeWithMultipleIssues = {
    id: 'root',
    name: 'Test Person',
    type: 'root',
    schemaVersion: 1,
    pattern: { key: 'lifetree' },
    hyperedges: [],
    children: [
        {
            id: 'phase-1',
            name: 'Early Life',
            type: 'phase',
            phase: 0,
            items: [] // Empty phase issue
        },
        {
            id: 'phase-2',
            name: 'Early Life', // Duplicate name issue
            type: 'phase',
            phase: 1,
            items: [
                {
                    id: 'item-dated',
                    name: 'Middle event',
                    type: 'item',
                    eventDate: '2000', // Establish a date for chronology check
                    description: 'A dated event'
                },
                {
                    id: 'item-sparse',
                    name: 'Event',
                    type: 'item'
                    // Sparse - no required fields
                }
            ]
        },
        {
            id: 'phase-3',
            name: 'Later Life (2020-2030)',
            type: 'phase',
            phase: 2,
            items: [
                {
                    id: 'item-old',
                    name: 'Early event',
                    type: 'item',
                    eventDate: '1985', // Chronology issue - earlier than previous phase's 2000
                    description: 'This event is out of order'
                }
            ]
        }
    ]
};

// ============================================================================
// HEALTH CHECK DETECTION UTILITIES (mirror the production logic)
// ============================================================================

/**
 * Detect empty phases in a LifeTree
 * @param {Object} tree - The tree to check
 * @returns {Array} - Array of phase objects that are empty
 */
export function detectEmptyPhases(tree) {
    const phases = tree?.children || [];
    return phases.filter(p => !p.items || p.items.length === 0);
}

/**
 * Detect redundant (duplicate name) phases
 * @param {Object} tree - The tree to check
 * @returns {Array} - Array of {name, phases[]} groupings with duplicates
 */
export function detectRedundantPeriods(tree) {
    const phases = tree?.children || [];
    const nameMap = {};

    phases.forEach(p => {
        // Normalize: strip dates/years from name for comparison
        const normalized = p.name.replace(/\s*\([^)]*\)\s*$/, '').trim().toLowerCase();
        if (!nameMap[normalized]) {
            nameMap[normalized] = [];
        }
        nameMap[normalized].push(p);
    });

    // Return only groups with duplicates
    return Object.entries(nameMap)
        .filter(([_, phases]) => phases.length > 1)
        .map(([name, phases]) => ({ name, phases }));
}

/**
 * Detect chronology issues (phases out of temporal order)
 * @param {Object} tree - The tree to check
 * @returns {Array} - Array of {phase, issue} objects
 */
export function detectChronologyIssues(tree) {
    const phases = tree?.children || [];
    const issues = [];

    // Extract earliest date from each phase
    function getEarliestDate(phase) {
        const items = phase.items || [];
        let earliest = null;

        for (const item of items) {
            if (item.eventDate) {
                // Extract year from various formats
                const yearMatch = item.eventDate.match(/\d{4}/);
                if (yearMatch) {
                    const year = parseInt(yearMatch[0]);
                    if (earliest === null || year < earliest) {
                        earliest = year;
                    }
                }
            }
        }
        return earliest;
    }

    let previousEarliest = null;
    for (let i = 0; i < phases.length; i++) {
        const phase = phases[i];
        const earliest = getEarliestDate(phase);

        if (earliest !== null && previousEarliest !== null) {
            if (earliest < previousEarliest) {
                issues.push({
                    phase,
                    issue: `Events in "${phase.name}" (${earliest}) are earlier than previous phase (${previousEarliest})`
                });
            }
        }

        if (earliest !== null) {
            previousEarliest = earliest;
        }
    }

    return issues;
}

/**
 * Detect sparse events (items missing key LifeTree fields)
 * @param {Object} tree - The tree to check
 * @returns {Array} - Array of sparse items with their missing fields
 */
export function detectSparseEvents(tree) {
    const phases = tree?.children || [];
    const sparse = [];
    const requiredFields = ['eventDate', 'description'];
    const desiredFields = ['location', 'people', 'emotion', 'source'];

    for (const phase of phases) {
        for (const item of (phase.items || [])) {
            const missing = requiredFields.filter(f => !item[f]);
            const incomplete = desiredFields.filter(f => !item[f]);

            if (missing.length > 0 || incomplete.length >= 3) {
                sparse.push({
                    item,
                    phase: phase.name,
                    missing,
                    incomplete
                });
            }
        }
    }

    return sparse;
}

/**
 * Run full health check (combines all detectors)
 * @param {Object} tree - The tree to check
 * @returns {Object} - Full health report
 */
export function runHealthCheck(tree) {
    return {
        emptyPhases: detectEmptyPhases(tree),
        redundantPeriods: detectRedundantPeriods(tree),
        chronologyIssues: detectChronologyIssues(tree),
        sparseEvents: detectSparseEvents(tree),
        isHealthy: function() {
            return this.emptyPhases.length === 0 &&
                   this.redundantPeriods.length === 0 &&
                   this.chronologyIssues.length === 0 &&
                   this.sparseEvents.length === 0;
        }
    };
}

// ============================================================================
// FIX UTILITIES (mirror production fix logic)
// ============================================================================

/**
 * Delete a phase by ID
 * @param {Object} tree - The tree to modify
 * @param {string} phaseId - The phase ID to delete
 * @returns {boolean} - Whether deletion succeeded
 */
export function deletePhase(tree, phaseId) {
    if (!tree.children) return false;
    const index = tree.children.findIndex(p => p.id === phaseId);
    if (index !== -1) {
        tree.children.splice(index, 1);
        return true;
    }
    return false;
}

/**
 * Consolidate redundant phases (merge items into first, delete others)
 * @param {Object} tree - The tree to modify
 * @param {Array} redundantGroup - Array of phases with same name
 * @returns {number} - Number of phases consolidated
 */
export function consolidatePhases(tree, redundantGroup) {
    if (redundantGroup.length < 2) return 0;

    const [keep, ...merge] = redundantGroup;
    let consolidated = 0;

    for (const phase of merge) {
        // Move items to keep phase
        keep.items = keep.items || [];
        keep.items.push(...(phase.items || []));

        // Delete merged phase
        if (deletePhase(tree, phase.id)) {
            consolidated++;
        }
    }

    return consolidated;
}

/**
 * Fix chronology by reordering phases
 * @param {Object} tree - The tree to modify
 */
export function fixChronology(tree) {
    if (!tree.children || tree.children.length < 2) return;

    // Sort phases by earliest event date
    tree.children.sort((a, b) => {
        const getEarliest = (phase) => {
            let earliest = Infinity;
            for (const item of (phase.items || [])) {
                if (item.eventDate) {
                    const yearMatch = item.eventDate.match(/\d{4}/);
                    if (yearMatch) {
                        earliest = Math.min(earliest, parseInt(yearMatch[0]));
                    }
                }
            }
            return earliest;
        };
        return getEarliest(a) - getEarliest(b);
    });

    // Update phase indices
    tree.children.forEach((p, i) => {
        p.phase = i;
    });
}
