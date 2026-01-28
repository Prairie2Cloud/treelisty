/**
 * MCP Resources for TreeListy
 *
 * Resources expose read-only data about the current TreeListy state.
 * Actual data comes from the connected TreeListy instance via WebSocket.
 */
'use strict';

const RESOURCES = [
  {
    uri: 'treelisty://tree/current',
    name: 'Current Tree',
    description: 'The currently loaded tree structure in TreeListy',
    mimeType: 'application/json'
  },
  {
    uri: 'treelisty://tree/metadata',
    name: 'Tree Metadata',
    description: 'Metadata about the current tree (node count, pattern, views, etc.)',
    mimeType: 'application/json'
  },
  {
    uri: 'treelisty://patterns',
    name: 'Available Patterns',
    description: 'List of all available tree patterns with their schemas',
    mimeType: 'application/json'
  },
  {
    uri: 'treelisty://views',
    name: 'Available Views',
    description: 'List of available view modes (tree, canvas, 3d, gantt, etc.)',
    mimeType: 'application/json'
  }
];

/**
 * Get the list of available resource definitions
 * @returns {Array} Array of resource definition objects
 */
function getResourceDefinitions() {
  return RESOURCES;
}

/**
 * Handle a resource read request
 * @param {string} uri - The resource URI to read
 * @returns {Object} Object with uri and needsRelay flag
 *
 * Note: Actual data retrieval is deferred to the bridge which will
 * relay the request to the connected TreeListy instance via WebSocket.
 */
function handleResourceRead(uri) {
  // Validate URI format
  if (!uri.startsWith('treelisty://')) {
    throw new Error(`Invalid resource URI: ${uri}`);
  }

  // Check if resource exists
  const resource = RESOURCES.find(r => r.uri === uri);
  if (!resource) {
    throw new Error(`Resource not found: ${uri}`);
  }

  // Return relay marker - bridge will forward to TreeListy
  return { uri, needsRelay: true };
}

module.exports = { getResourceDefinitions, handleResourceRead, RESOURCES };
