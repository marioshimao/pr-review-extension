"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitClient = void 0;
const AzureDevOpsApiClient_1 = require("./AzureDevOpsApiClient");
/**
 * A client for interacting with Azure DevOps Git REST API
 */
class GitClient extends AzureDevOpsApiClient_1.AzureDevOpsApiClient {
    /**
     * Get repository by name or ID
     * @param repositoryIdOrName - ID or name of the repository
     * @returns Promise with repository details
     */
    async getRepository(repositoryIdOrName) {
        return this.get(`/git/repositories/${repositoryIdOrName}`);
    }
    /**
     * Get all repositories in the project
     * @returns Promise with repositories
     */
    async getRepositories() {
        return this.get('/git/repositories');
    }
    /**
     * Create a new Git repository
     * @param options - Repository creation options
     * @returns Promise with repository details
     */
    async createRepository(options) {
        return this.post('/git/repositories', options);
    }
    /**
     * Update a Git repository
     * @param repositoryId - ID of the repository
     * @param options - Repository update properties
     * @returns Promise with updated repository details
     */
    async updateRepository(repositoryId, options) {
        return this.patch(`/git/repositories/${repositoryId}`, options);
    }
    /**
     * Delete a Git repository
     * @param repositoryId - ID of the repository
     * @returns Promise with operation result
     */
    async deleteRepository(repositoryId) {
        return this.delete(`/git/repositories/${repositoryId}`);
    }
    /**
     * Get branches for a repository
     * @param repositoryId - ID of the repository
     * @param filter - Optional filter string (e.g., "heads/feature")
     * @returns Promise with branches
     */
    async getBranches(repositoryId, filter) {
        const queryParams = {};
        if (filter) {
            queryParams.filter = filter;
        }
        return this.get(`/git/repositories/${repositoryId}/refs`, queryParams);
    }
    /**
     * Create or update Git references (branches/tags)
     * @param repositoryId - ID of the repository
     * @param refUpdates - Reference updates
     * @returns Promise with updated references
     */
    async updateRefs(repositoryId, refUpdates) {
        return this.post(`/git/repositories/${repositoryId}/refs`, refUpdates);
    }
    /**
     * Delete a Git reference (branch/tag)
     * @param repositoryId - ID of the repository
     * @param name - Name of the reference to delete
     * @param oldObjectId - Old object ID for the reference
     * @returns Promise with operation result
     */
    async deleteRef(repositoryId, name, oldObjectId) {
        const refUpdates = [{
                name,
                oldObjectId,
                newObjectId: '0000000000000000000000000000000000000000'
            }];
        await this.post(`/git/repositories/${repositoryId}/refs`, refUpdates);
    }
    /**
     * Get commits for a repository
     * @param repositoryId - ID of the repository
     * @param searchCriteria - Optional search criteria
     * @param top - Optional number of commits to return
     * @returns Promise with commits
     */
    async getCommits(repositoryId, searchCriteria, top) {
        const queryParams = {};
        if (searchCriteria) {
            queryParams.searchCriteria = JSON.stringify(searchCriteria);
        }
        if (top) {
            queryParams.$top = top.toString();
        }
        return this.get(`/git/repositories/${repositoryId}/commits`, queryParams);
    }
    /**
     * Get commits in batch mode
     * @param repositoryId - ID of the repository
     * @param searchCriteria - Commit search criteria
     * @returns Promise with commits
     */
    async getCommitsBatch(repositoryId, searchCriteria) {
        return this.post(`/git/repositories/${repositoryId}/commitsBatch`, { searchCriteria });
    }
    /**
     * Get a specific commit
     * @param repositoryId - ID of the repository
     * @param commitId - ID of the commit
     * @returns Promise with commit details
     */
    async getCommit(repositoryId, commitId) {
        return this.get(`/git/repositories/${repositoryId}/commits/${commitId}`);
    }
    /**
     * Get changes for a specific commit
     * @param repositoryId - ID of the repository
     * @param commitId - ID of the commit
     * @returns Promise with commit changes
     */
    async getCommitChanges(repositoryId, commitId) {
        return this.get(`/git/repositories/${repositoryId}/commits/${commitId}/changes`);
    }
    /**
     * Get items (files/folders) in a repository
     * @param repositoryId - ID of the repository
     * @param path - Optional path to get items from (defaults to root)
     * @param recursionLevel - Optional recursion level ("none", "oneLevel", "full")
     * @param version - Optional version (commit ID, branch name)
     * @returns Promise with items
     */
    async getItems(repositoryId, path, recursionLevel, version) {
        const queryParams = {};
        if (path) {
            queryParams.path = path;
        }
        if (recursionLevel) {
            queryParams.recursionLevel = recursionLevel;
        }
        if (version) {
            queryParams['versionDescriptor.version'] = version;
        }
        return this.get(`/git/repositories/${repositoryId}/items`, queryParams);
    }
    /**
     * Get content of a specific file
     * @param repositoryId - ID of the repository
     * @param path - Path to the file
     * @param version - Optional version (commit ID, branch name)
     * @returns Promise with file content
     */
    async getFileContent(repositoryId, path, version) {
        const queryParams = {
            path: path,
            includeContent: 'true'
        };
        if (version) {
            queryParams['versionDescriptor.version'] = version;
        }
        const response = await this.get(`/git/repositories/${repositoryId}/items`, queryParams);
        return response.content || '';
    }
    /**
     * Compare two branches/commits and get the diff
     * @param repositoryId - ID of the repository
     * @param baseVersion - Base version (commit ID, branch name)
     * @param targetVersion - Target version (commit ID, branch name)
     * @returns Promise with diff details
     */
    async getDiff(repositoryId, baseVersion, targetVersion) {
        const queryParams = {
            'baseVersionType': 'commit',
            'baseVersion': baseVersion,
            'targetVersionType': 'commit',
            'targetVersion': targetVersion
        };
        return this.get(`/git/repositories/${repositoryId}/diffs/commits`, queryParams);
    }
    /**
     * Create a pull request
     * @param repositoryId - ID of the repository
     * @param options - Pull request creation options
     * @returns Promise with created pull request details
     */
    async createPullRequest(repositoryId, options) {
        return this.post(`/git/repositories/${repositoryId}/pullrequests`, options);
    }
    /**
     * Get a specific pull request
     * @param repositoryId - ID of the repository
     * @param pullRequestId - ID of the pull request
     * @returns Promise with pull request details
     */
    async getPullRequest(repositoryId, pullRequestId) {
        return this.get(`/git/repositories/${repositoryId}/pullrequests/${pullRequestId}`);
    }
    /**
     * Get pull requests for a repository
     * @param repositoryId - ID of the repository
     * @param status - Optional status filter (active, abandoned, completed)
     * @param creatorId - Optional creator ID filter
     * @param reviewerId - Optional reviewer ID filter
     * @param sourceRefName - Optional source branch name filter
     * @param targetRefName - Optional target branch name filter
     * @param top - Optional number of results to return
     * @returns Promise with pull requests
     */
    async getPullRequests(repositoryId, status, creatorId, reviewerId, sourceRefName, targetRefName, top) {
        const queryParams = {};
        if (status) {
            queryParams.status = status;
        }
        if (creatorId) {
            queryParams.creatorId = creatorId;
        }
        if (reviewerId) {
            queryParams.reviewerId = reviewerId;
        }
        if (sourceRefName) {
            queryParams.sourceRefName = sourceRefName;
        }
        if (targetRefName) {
            queryParams.targetRefName = targetRefName;
        }
        if (top) {
            queryParams.$top = top.toString();
        }
        return this.get(`/git/repositories/${repositoryId}/pullrequests`, queryParams);
    }
    /**
     * Get pull requests for a project
     * @param project - Project name
     * @param status - Optional status filter (active, abandoned, completed)
     * @param top - Optional number of results to return
     * @returns Promise with pull requests
     */
    async getPullRequestsByProject(project, status, top) {
        const queryParams = {};
        if (status) {
            queryParams.status = status;
        }
        if (top) {
            queryParams.$top = top.toString();
        }
        const path = project ? `/git/pullrequests` : `/git/pullrequests`;
        return this.get(path, queryParams);
    }
    /**
     * Update a pull request
     * @param repositoryId - ID of the repository
     * @param pullRequestId - ID of the pull request
     * @param options - Pull request update options
     * @returns Promise with updated pull request details
     */
    async updatePullRequest(repositoryId, pullRequestId, options) {
        return this.patch(`/git/repositories/${repositoryId}/pullrequests/${pullRequestId}`, options);
    }
    /**
     * Get pull request iterations
     * @param repositoryId - ID of the repository
     * @param pullRequestId - ID of the pull request
     * @returns Promise with pull request iterations
     */
    async getPullRequestIterations(repositoryId, pullRequestId) {
        return this.get(`/git/repositories/${repositoryId}/pullRequests/${pullRequestId}/iterations`);
    }
    /**
     * Get pull request iteration changes
     * @param repositoryId - ID of the repository
     * @param pullRequestId - ID of the pull request
     * @param iterationId - ID of the iteration
     * @returns Promise with pull request iteration changes
     */
    async getPullRequestIterationChanges(repositoryId, pullRequestId, iterationId) {
        return this.get(`/git/repositories/${repositoryId}/pullRequests/${pullRequestId}/iterations/${iterationId}/changes`);
    }
    /**
     * Get pull request reviewers
     * @param repositoryId - ID of the repository
     * @param pullRequestId - ID of the pull request
     * @returns Promise with pull request reviewers
     */
    async getPullRequestReviewers(repositoryId, pullRequestId) {
        return this.get(`/git/repositories/${repositoryId}/pullRequests/${pullRequestId}/reviewers`);
    }
    /**
     * Add a reviewer to a pull request
     * @param repositoryId - ID of the repository
     * @param pullRequestId - ID of the pull request
     * @param reviewerId - ID of the reviewer
     * @param isRequired - Optional flag indicating if the reviewer is required
     * @returns Promise with reviewer details
     */
    async addPullRequestReviewer(repositoryId, pullRequestId, reviewerId, isRequired = false) {
        return this.put(`/git/repositories/${repositoryId}/pullRequests/${pullRequestId}/reviewers/${reviewerId}`, { isRequired });
    }
    /**
     * Create a status for a commit
     * @param repositoryId - ID of the repository
     * @param commitId - ID of the commit
     * @param status - Status to create
     * @returns Promise with created status
     */
    async createCommitStatus(repositoryId, commitId, status) {
        return this.post(`/git/repositories/${repositoryId}/commits/${commitId}/statuses`, status);
    }
    /**
     * Get statuses for a commit
     * @param repositoryId - ID of the repository
     * @param commitId - ID of the commit
     * @returns Promise with commit statuses
     */
    async getCommitStatuses(repositoryId, commitId) {
        return this.get(`/git/repositories/${repositoryId}/commits/${commitId}/statuses`);
    }
    /**
     * Create a comment thread in a pull request
     * @param repositoryId - ID of the repository
     * @param pullRequestId - ID of the pull request
     * @param thread - Comment thread to create
     * @returns Promise with created comment thread
     */
    async createPullRequestThread(repositoryId, pullRequestId, thread) {
        return this.post(`/git/repositories/${repositoryId}/pullRequests/${pullRequestId}/threads`, thread);
    }
    /**
     * Get comment threads for a pull request
     * @param repositoryId - ID of the repository
     * @param pullRequestId - ID of the pull request
     * @returns Promise with pull request comment threads
     */
    async getPullRequestThreads(repositoryId, pullRequestId) {
        return this.get(`/git/repositories/${repositoryId}/pullRequests/${pullRequestId}/threads`);
    }
    /**
     * Get item content from repository
     * @param repositoryId - ID of the repository
     * @param path - Path of the file
     * @param includeContent - Whether to include content
     * @param versionDescriptor - Version descriptor
     * @returns Promise with file content as stream
     */
    async getItemContent(repositoryId, path, project, scopePath, recursionLevel, includeContentMetadata, latestProcessedChange, includeContent, versionDescriptor) {
        const queryParams = {
            'path': path,
            'includeContent': includeContent ? 'true' : 'false'
        };
        if (versionDescriptor?.version) {
            queryParams['versionDescriptor.version'] = versionDescriptor.version;
        }
        if (versionDescriptor?.versionOptions !== undefined) {
            queryParams['versionDescriptor.versionOptions'] = versionDescriptor.versionOptions.toString();
        }
        if (versionDescriptor?.versionType !== undefined) {
            queryParams['versionDescriptor.versionType'] = versionDescriptor.versionType.toString();
        }
        // Construct the URL
        const url = this.buildUrl(`/git/repositories/${repositoryId}/items`, queryParams);
        // Make a direct fetch request to get the raw content as a stream
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': this.getAuthHeader(),
                'Accept': '*/*'
            }
        });
        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}: ${await response.text()}`);
        }
        // Return the response body as a readable stream
        return response.body;
    }
    /**
     * Build URL with query parameters
     * Override from parent class to make it accessible here
     * @param path - API path
     * @param queryParams - Query parameters
     * @returns Complete URL
     */
    buildUrl(path, queryParams = {}) {
        // Add API version to query params
        const allParams = { 'api-version': this.apiVersion, ...queryParams };
        // Build query string
        const queryString = Object.entries(allParams)
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
            .join('&');
        return `${this.baseUrl}${path}?${queryString}`;
    }
    /**
     * Make a DELETE request to the Azure DevOps API with retry
     * @param path - API path (without base URL)
     * @param queryParams - Optional query parameters
     * @returns Promise with response data
     */
    async delete(path, queryParams = {}) {
        return this.executeWithRetry(async () => {
            const url = this.buildUrl(path, queryParams);
            const response = await fetch(url, {
                method: 'DELETE',
                headers: {
                    'Authorization': this.getAuthHeader(),
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}: ${await response.text()}`);
            }
            // For cases where DELETE returns no content
            const contentLength = response.headers.get('content-length');
            if (contentLength === '0' || !contentLength) {
                return {};
            }
            return await response.json();
        });
    }
}
exports.GitClient = GitClient;
