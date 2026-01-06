/**
 * GitHub Handler for MCP Bridge
 *
 * Provides GitHub notifications and repository operations via GitHub CLI (gh).
 * Uses `gh` CLI for authentication to leverage existing user credentials.
 *
 * Build 750: Initial implementation
 *
 * Copyright 2024-2025 Prairie2Cloud LLC
 * Licensed under Apache-2.0
 */

const { exec, spawn } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

// =============================================================================
// Configuration
// =============================================================================

const CONFIG = {
  // Timeout for gh CLI commands (30 seconds)
  commandTimeout: 30000,
  // Max notifications per request
  maxPerPage: 100
};

// =============================================================================
// GitHub CLI Wrapper
// =============================================================================

/**
 * Execute a gh CLI command and return parsed JSON result
 */
async function ghCommand(args, options = {}) {
  const timeout = options.timeout || CONFIG.commandTimeout;

  try {
    const { stdout, stderr } = await execAsync(`gh ${args}`, {
      timeout,
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer for large responses
    });

    // Try to parse as JSON, fall back to raw text
    try {
      return { success: true, data: JSON.parse(stdout) };
    } catch {
      return { success: true, data: stdout.trim() };
    }
  } catch (err) {
    // Check for specific error types
    if (err.killed && err.signal === 'SIGTERM') {
      return { success: false, error: 'command_timeout', message: `Command timed out after ${timeout}ms` };
    }

    if (err.message.includes('gh: command not found')) {
      return {
        success: false,
        error: 'gh_not_installed',
        message: 'GitHub CLI (gh) not installed. Install from https://cli.github.com/'
      };
    }

    if (err.message.includes('not logged in')) {
      return {
        success: false,
        error: 'not_authenticated',
        message: 'Not authenticated to GitHub. Run: gh auth login'
      };
    }

    return {
      success: false,
      error: 'command_failed',
      message: err.message,
      stderr: err.stderr
    };
  }
}

// =============================================================================
// Authentication
// =============================================================================

/**
 * Check if gh CLI is installed and authenticated
 */
async function checkAuthStatus() {
  // Check gh installed
  const versionResult = await ghCommand('--version');
  if (!versionResult.success) {
    return {
      authenticated: false,
      ghInstalled: false,
      error: versionResult.error,
      message: versionResult.message
    };
  }

  // Check auth status
  const authResult = await ghCommand('auth status --show-token 2>&1');
  if (!authResult.success) {
    return {
      authenticated: false,
      ghInstalled: true,
      error: authResult.error,
      message: authResult.message
    };
  }

  // Parse auth status
  const status = authResult.data.toString();
  const loggedIn = status.includes('Logged in to github.com');
  const userMatch = status.match(/account (\S+)/);
  const scopeMatch = status.match(/Token scopes: ([^\n]+)/);

  return {
    authenticated: loggedIn,
    ghInstalled: true,
    user: userMatch ? userMatch[1] : null,
    scopes: scopeMatch ? scopeMatch[1].split(', ').map(s => s.trim()) : [],
    host: 'github.com'
  };
}

// =============================================================================
// Notifications
// =============================================================================

/**
 * List GitHub notifications
 * @param {Object} options - Filter options
 * @param {boolean} options.participating - Only show notifications you're participating in
 * @param {boolean} options.all - Include read notifications
 * @param {number} options.per_page - Results per page (max 100)
 * @param {string} options.repo - Filter by repo (owner/name)
 */
async function listNotifications(options = {}) {
  let args = 'api notifications --paginate';

  // Build query params
  const params = [];
  if (options.all) params.push('all=true');
  if (options.participating) params.push('participating=true');
  params.push(`per_page=${Math.min(options.per_page || 50, CONFIG.maxPerPage)}`);

  if (params.length > 0) {
    args += ` -f ${params.join(' -f ')}`;
  }

  const result = await ghCommand(args);

  if (!result.success) {
    return result;
  }

  // Filter by repo if specified
  let notifications = result.data;
  if (options.repo && Array.isArray(notifications)) {
    notifications = notifications.filter(n =>
      n.repository?.full_name === options.repo
    );
  }

  // Categorize notifications for easier processing
  const categorized = categorizeNotifications(notifications);

  return {
    success: true,
    notifications,
    count: notifications.length,
    categories: categorized,
    fetchedAt: new Date().toISOString()
  };
}

/**
 * Categorize notifications by type and reason
 */
function categorizeNotifications(notifications) {
  if (!Array.isArray(notifications)) return {};

  return {
    ci_failures: notifications.filter(n =>
      n.subject?.type === 'CheckSuite' ||
      (n.subject?.type === 'PullRequest' && n.reason === 'ci_activity')
    ),
    review_requests: notifications.filter(n =>
      n.reason === 'review_requested'
    ),
    mentions: notifications.filter(n =>
      n.reason === 'mention' || n.reason === 'team_mention'
    ),
    author: notifications.filter(n =>
      n.reason === 'author'
    ),
    state_change: notifications.filter(n =>
      n.reason === 'state_change'
    ),
    subscribed: notifications.filter(n =>
      n.reason === 'subscribed'
    ),
    other: notifications.filter(n =>
      !['review_requested', 'mention', 'team_mention', 'author', 'state_change', 'subscribed', 'ci_activity'].includes(n.reason)
    )
  };
}

/**
 * Get a specific notification thread
 */
async function getThread(threadId) {
  if (!threadId) {
    return { success: false, error: 'missing_thread_id', message: 'Thread ID required' };
  }

  const result = await ghCommand(`api notifications/threads/${threadId}`);

  if (!result.success) {
    return result;
  }

  return {
    success: true,
    thread: result.data
  };
}

/**
 * Mark a notification thread as read
 */
async function markThreadRead(threadId) {
  if (!threadId) {
    return { success: false, error: 'missing_thread_id', message: 'Thread ID required' };
  }

  const result = await ghCommand(`api -X PATCH notifications/threads/${threadId}`);

  return {
    success: result.success,
    threadId,
    action: 'marked_read',
    error: result.error,
    message: result.success ? 'Thread marked as read' : result.message
  };
}

/**
 * Mark all notifications as read
 * @param {string} lastReadAt - ISO timestamp, mark all before this as read
 */
async function markAllRead(lastReadAt) {
  const timestamp = lastReadAt || new Date().toISOString();

  const result = await ghCommand(`api -X PUT notifications -f last_read_at="${timestamp}"`);

  return {
    success: result.success,
    action: 'marked_all_read',
    lastReadAt: timestamp,
    error: result.error,
    message: result.success ? `All notifications before ${timestamp} marked as read` : result.message
  };
}

/**
 * Subscribe/unsubscribe from a thread
 */
async function setThreadSubscription(threadId, subscribed = true, ignored = false) {
  if (!threadId) {
    return { success: false, error: 'missing_thread_id', message: 'Thread ID required' };
  }

  const result = await ghCommand(
    `api -X PUT notifications/threads/${threadId}/subscription -f subscribed=${subscribed} -f ignored=${ignored}`
  );

  return {
    success: result.success,
    threadId,
    subscribed,
    ignored,
    error: result.error,
    message: result.success ? 'Subscription updated' : result.message
  };
}

// =============================================================================
// Repository & PR Operations
// =============================================================================

/**
 * List recent workflow runs (CI status)
 */
async function listWorkflowRuns(repo, options = {}) {
  if (!repo) {
    return { success: false, error: 'missing_repo', message: 'Repository (owner/name) required' };
  }

  let args = `run list -R ${repo} --json conclusion,createdAt,displayTitle,headBranch,name,number,status,url`;

  if (options.limit) {
    args += ` --limit ${options.limit}`;
  }
  if (options.workflow) {
    args += ` --workflow ${options.workflow}`;
  }
  if (options.branch) {
    args += ` --branch ${options.branch}`;
  }

  const result = await ghCommand(args);

  if (!result.success) {
    return result;
  }

  // Categorize by status
  const runs = result.data;
  return {
    success: true,
    runs,
    count: runs.length,
    summary: {
      passing: runs.filter(r => r.conclusion === 'success').length,
      failing: runs.filter(r => r.conclusion === 'failure').length,
      pending: runs.filter(r => r.status === 'in_progress' || r.status === 'queued').length
    }
  };
}

/**
 * Get details of a failed workflow run
 */
async function getFailedRunDetails(repo, runId) {
  if (!repo || !runId) {
    return { success: false, error: 'missing_params', message: 'Repository and run ID required' };
  }

  const result = await ghCommand(`run view ${runId} -R ${repo} --json jobs,conclusion,createdAt,displayTitle`);

  if (!result.success) {
    return result;
  }

  const run = result.data;

  // Get failed jobs
  const failedJobs = run.jobs?.filter(j => j.conclusion === 'failure') || [];

  return {
    success: true,
    run,
    failedJobs,
    failedSteps: failedJobs.flatMap(j =>
      j.steps?.filter(s => s.conclusion === 'failure').map(s => ({
        job: j.name,
        step: s.name,
        conclusion: s.conclusion
      })) || []
    )
  };
}

/**
 * List pull requests
 */
async function listPullRequests(repo, options = {}) {
  if (!repo) {
    return { success: false, error: 'missing_repo', message: 'Repository (owner/name) required' };
  }

  let args = `pr list -R ${repo} --json number,title,state,author,createdAt,url,headRefName,isDraft,reviewDecision`;

  if (options.state) {
    args += ` --state ${options.state}`;
  }
  if (options.limit) {
    args += ` --limit ${options.limit}`;
  }
  if (options.assignee) {
    args += ` --assignee ${options.assignee}`;
  }

  const result = await ghCommand(args);

  if (!result.success) {
    return result;
  }

  return {
    success: true,
    pullRequests: result.data,
    count: result.data.length
  };
}

/**
 * Get PR review status
 */
async function getPRReviewStatus(repo, prNumber) {
  if (!repo || !prNumber) {
    return { success: false, error: 'missing_params', message: 'Repository and PR number required' };
  }

  const result = await ghCommand(
    `pr view ${prNumber} -R ${repo} --json reviews,reviewDecision,reviewRequests,state,mergeable`
  );

  if (!result.success) {
    return result;
  }

  return {
    success: true,
    pr: result.data
  };
}

// =============================================================================
// Issue Operations
// =============================================================================

/**
 * List issues assigned to current user
 */
async function listMyIssues(options = {}) {
  let args = 'issue list --assignee @me --json number,title,state,repository,createdAt,url,labels';

  if (options.state) {
    args += ` --state ${options.state}`;
  }
  if (options.limit) {
    args += ` --limit ${options.limit}`;
  }

  const result = await ghCommand(args);

  if (!result.success) {
    return result;
  }

  return {
    success: true,
    issues: result.data,
    count: result.data.length
  };
}

// =============================================================================
// Triage Summary Generator
// =============================================================================

/**
 * Generate a triage summary of current notifications
 * This is what TB would use to understand the notification landscape
 */
async function generateTriageSummary() {
  // Get notifications
  const notifResult = await listNotifications({ participating: true, per_page: 100 });

  if (!notifResult.success) {
    return notifResult;
  }

  const { notifications, categories } = notifResult;

  // Build summary
  const summary = {
    success: true,
    timestamp: new Date().toISOString(),
    totalNotifications: notifications.length,
    breakdown: {
      ci_failures: categories.ci_failures.length,
      review_requests: categories.review_requests.length,
      mentions: categories.mentions.length,
      author_updates: categories.author.length,
      state_changes: categories.state_change.length,
      other: categories.other.length
    },
    urgentItems: [],
    suggestedActions: []
  };

  // Identify urgent items (CI failures, review requests)
  if (categories.ci_failures.length > 0) {
    summary.urgentItems.push({
      type: 'ci_failures',
      count: categories.ci_failures.length,
      repos: [...new Set(categories.ci_failures.map(n => n.repository?.full_name))],
      message: `${categories.ci_failures.length} CI failure(s) need attention`
    });

    summary.suggestedActions.push({
      action: 'investigate_ci',
      label: 'Investigate CI Failures',
      description: 'View failed workflow runs and error logs'
    });
  }

  if (categories.review_requests.length > 0) {
    summary.urgentItems.push({
      type: 'review_requests',
      count: categories.review_requests.length,
      prs: categories.review_requests.map(n => ({
        repo: n.repository?.full_name,
        title: n.subject?.title,
        url: n.subject?.url
      })),
      message: `${categories.review_requests.length} PR(s) awaiting your review`
    });

    summary.suggestedActions.push({
      action: 'batch_review',
      label: 'Start PR Review Session',
      description: 'Review pending pull requests'
    });
  }

  if (categories.mentions.length > 0) {
    summary.suggestedActions.push({
      action: 'check_mentions',
      label: 'Check Mentions',
      description: `${categories.mentions.length} mention(s) may need response`
    });
  }

  // Suggest bulk cleanup if many non-urgent notifications
  const nonUrgentCount = categories.subscribed.length + categories.other.length;
  if (nonUrgentCount > 10) {
    summary.suggestedActions.push({
      action: 'bulk_archive',
      label: 'Archive Low-Priority',
      description: `Mark ${nonUrgentCount} subscribed/other notifications as read`
    });
  }

  return summary;
}

// =============================================================================
// Exports
// =============================================================================

module.exports = {
  // Auth
  checkAuthStatus,

  // Notifications
  listNotifications,
  getThread,
  markThreadRead,
  markAllRead,
  setThreadSubscription,

  // Repos & PRs
  listWorkflowRuns,
  getFailedRunDetails,
  listPullRequests,
  getPRReviewStatus,

  // Issues
  listMyIssues,

  // Triage
  generateTriageSummary,
  categorizeNotifications
};
