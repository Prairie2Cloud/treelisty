/**
 * MCP Prompts for TreeListy
 *
 * Prompts provide reusable prompt templates for common TreeListy workflows.
 */
'use strict';

const PROMPTS = [
  {
    name: 'build-tree',
    description: 'Build a comprehensive tree from a topic using the Semantic Onion Model',
    arguments: [
      { name: 'topic', description: 'The topic to build a tree about', required: true },
      { name: 'depth', description: 'How many levels deep (2-5)', required: false }
    ]
  },
  {
    name: 'analyze-structure',
    description: 'Analyze the current tree structure and suggest improvements',
    arguments: []
  },
  {
    name: 'debate-node',
    description: 'Generate counter-arguments for a specific node using debate pattern',
    arguments: [
      { name: 'node_name', description: 'Name of the node to debate', required: true },
      { name: 'school', description: 'Philosophical school (socratic, kantian, hegelian, empiricist)', required: false }
    ]
  },
  {
    name: 'summarize-branch',
    description: 'Create a narrative summary of a tree branch',
    arguments: [
      { name: 'node_name', description: 'Root node of the branch to summarize', required: true }
    ]
  },
  {
    name: 'weekly-review',
    description: 'Generate a weekly review of checklist progress and upcoming tasks',
    arguments: []
  }
];

/**
 * Get the list of available prompt definitions
 * @returns {Array} Array of prompt definition objects
 */
function getPromptDefinitions() {
  return PROMPTS;
}

/**
 * Get the message array for a specific prompt
 * @param {string} name - The prompt name
 * @param {Object} args - Arguments for the prompt
 * @returns {Array|null} Array of message objects or null if prompt not found
 */
function getPromptMessages(name, args = {}) {
  switch (name) {
    case 'build-tree':
      return [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Build a comprehensive tree about "${args.topic}" using the Semantic Onion Model. ${args.depth ? `Go ${args.depth} levels deep.` : 'Use 3-4 levels.'}\n\nStart with the canonical structure, then peel each layer adding granularity. The deepest level should contain specific claims or tasks.`
          }
        }
      ];

    case 'analyze-structure':
      return [
        {
          role: 'user',
          content: {
            type: 'text',
            text: 'Analyze the current tree structure. Look for: imbalanced branches, missing categories, nodes that could be split or merged, and suggest organizational improvements.'
          }
        }
      ];

    case 'debate-node':
      return [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Generate counter-arguments for the node "${args.node_name}"${args.school ? ` from the ${args.school} philosophical tradition` : ''}. Present the strongest objections and alternative viewpoints.`
          }
        }
      ];

    case 'summarize-branch':
      return [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Create a narrative summary of the branch rooted at "${args.node_name}". Synthesize the key points, relationships, and conclusions from all child nodes into a coherent narrative.`
          }
        }
      ];

    case 'weekly-review':
      return [
        {
          role: 'user',
          content: {
            type: 'text',
            text: 'Generate a weekly review: summarize completed checklist items, highlight overdue tasks, identify blocked items, and suggest priorities for next week.'
          }
        }
      ];

    default:
      return null;
  }
}

module.exports = { getPromptDefinitions, getPromptMessages, PROMPTS };
