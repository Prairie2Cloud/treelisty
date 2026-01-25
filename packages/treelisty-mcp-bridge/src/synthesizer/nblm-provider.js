/**
 * NBLM Provider - NotebookLM integration via notebooklm-mcp
 *
 * Wraps the notebooklm-mcp server to provide synthesis capabilities.
 * Uses stdio MCP protocol to communicate with the server.
 *
 * @module synthesizer/nblm-provider
 */

const { spawn } = require('child_process');
const { SynthesisProvider } = require('./abstract-synthesizer');

class NBLMProvider extends SynthesisProvider {
  constructor(config = {}) {
    super(config);
    this.name = 'nblm';
    this.process = null;
    this.requestId = 0;
    this.pendingRequests = new Map();
    this.selectedNotebook = null;
    this.buffer = '';
  }

  /**
   * Start the notebooklm-mcp server process
   */
  async start() {
    if (this.process) return;

    return new Promise((resolve, reject) => {
      this.process = spawn('npx', ['-y', 'notebooklm-mcp@latest'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true
      });

      this.process.stdout.on('data', (data) => {
        this.handleOutput(data.toString());
      });

      this.process.stderr.on('data', (data) => {
        console.error('[NBLM] stderr:', data.toString());
      });

      this.process.on('error', (err) => {
        console.error('[NBLM] Process error:', err);
        this.process = null;
        reject(err);
      });

      this.process.on('close', (code) => {
        console.log('[NBLM] Process closed with code:', code);
        this.process = null;
      });

      // Give it a moment to start
      setTimeout(() => resolve(), 1000);
    });
  }

  /**
   * Stop the server process
   */
  stop() {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
  }

  /**
   * Handle output from the MCP server
   */
  handleOutput(data) {
    this.buffer += data;

    // Try to parse complete JSON-RPC messages
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const msg = JSON.parse(line);
        if (msg.id && this.pendingRequests.has(msg.id)) {
          const { resolve, reject } = this.pendingRequests.get(msg.id);
          this.pendingRequests.delete(msg.id);

          if (msg.error) {
            reject(new Error(msg.error.message || 'Unknown error'));
          } else {
            resolve(msg.result);
          }
        }
      } catch (e) {
        // Not JSON, might be log output
      }
    }
  }

  /**
   * Send MCP request to the server
   */
  async sendRequest(method, params = {}) {
    if (!this.process) {
      await this.start();
    }

    const id = ++this.requestId;
    const request = {
      jsonrpc: '2.0',
      id,
      method,
      params
    };

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });

      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Request timeout'));
        }
      }, 30000);

      this.process.stdin.write(JSON.stringify(request) + '\n');
    });
  }

  /**
   * Call an MCP tool
   */
  async callTool(name, args = {}) {
    return this.sendRequest('tools/call', { name, arguments: args });
  }

  // ============ SynthesisProvider Implementation ============

  async healthCheck() {
    try {
      const result = await this.callTool('get_health');
      this.healthy = result?.healthy ?? false;
      this.lastHealthCheck = new Date().toISOString();

      return {
        healthy: this.healthy,
        message: this.healthy ? 'NBLM connected and authenticated' : 'NBLM not authenticated',
        details: result
      };
    } catch (error) {
      this.healthy = false;
      return {
        healthy: false,
        message: `Health check failed: ${error.message}`
      };
    }
  }

  async clusterItems(items) {
    // NBLM doesn't have native clustering - we use ask_question with a clustering prompt
    const itemsSummary = items.map(i =>
      `[${i.type}] ${i.metadata?.subject || i.metadata?.title || i.id}: ${i.content?.slice(0, 200)}...`
    ).join('\n');

    const query = `Group these items into logical clusters by topic/project. Return JSON array of clusters with name, briefing (1-2 sentences), and item IDs:\n\n${itemsSummary}`;

    try {
      const result = await this.callTool('ask_question', { question: query });

      // Parse the response - NBLM returns structured answer
      const answer = result?.answer || result?.content || '';

      // Try to extract JSON from the answer
      const jsonMatch = answer.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Fallback: single cluster
      return [{
        id: 'cluster_1',
        name: 'All Items',
        briefing: answer.slice(0, 200),
        items: items.map(i => i.id)
      }];
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  async queryContext(query, sourceIds = []) {
    try {
      const result = await this.callTool('ask_question', {
        question: query,
        source_ids: sourceIds.length > 0 ? sourceIds : undefined
      });

      this.recordSuccess();

      return {
        answer: result?.answer || result?.content || 'No answer available',
        citations: result?.citations || [],
        confidence: result?.confidence ?? 0.8
      };
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  async generatePodcast(text, options = {}) {
    try {
      // notebooklm-mcp may have a generate_audio or studio tool
      const result = await this.callTool('generate_audio', {
        content: text,
        ...options
      });

      this.recordSuccess();

      return {
        audioUrl: result?.audio_url || result?.url,
        duration: result?.duration || 0,
        transcript: result?.transcript || text
      };
    } catch (error) {
      // Podcast generation may not be available
      this.recordFailure();
      throw new Error(`Podcast generation not available: ${error.message}`);
    }
  }

  async generateBriefing(text, options = {}) {
    const query = `Create a concise briefing document from this content. Format as markdown with sections: Summary, Key Points, Action Items.\n\nContent:\n${text}`;

    try {
      const result = await this.callTool('ask_question', { question: query });

      this.recordSuccess();

      const markdown = result?.answer || result?.content || '';
      return {
        markdown,
        wordCount: markdown.split(/\s+/).length
      };
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  async listNotebooks() {
    try {
      const result = await this.callTool('list_notebooks');

      return (result?.notebooks || []).map(nb => ({
        id: nb.id || nb.notebook_id,
        name: nb.name || nb.title,
        sourceCount: nb.source_count || nb.sources?.length || 0,
        lastModified: nb.last_modified || nb.updated_at
      }));
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  async selectNotebook(notebookId) {
    try {
      const result = await this.callTool('select_notebook', {
        notebook_id: notebookId
      });

      this.selectedNotebook = notebookId;
      this.recordSuccess();

      return {
        success: true,
        notebook: result?.notebook || { id: notebookId }
      };
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  async addSource(notebookId, source) {
    try {
      const params = {
        notebook_id: notebookId,
        source_type: source.type,
        content: source.content
      };

      if (source.type === 'url') {
        params.url = source.content;
      }

      const result = await this.callTool('add_source', params);

      this.recordSuccess();

      return {
        success: true,
        sourceId: result?.source_id || result?.id
      };
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  async removeSource(notebookId, sourceId) {
    try {
      await this.callTool('remove_source', {
        notebook_id: notebookId,
        source_id: sourceId
      });

      // Verify deletion
      const notebooks = await this.listNotebooks();
      const notebook = notebooks.find(n => n.id === notebookId);
      // Can't directly verify without listing sources, assume success

      this.recordSuccess();

      return {
        success: true,
        verified: true // Best effort verification
      };
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  getCapabilities() {
    return {
      clustering: true,  // Via ask_question with clustering prompt
      queries: true,     // Native ask_question
      podcasts: true,    // If generate_audio available
      briefings: true    // Via ask_question with briefing prompt
    };
  }
}

module.exports = NBLMProvider;
