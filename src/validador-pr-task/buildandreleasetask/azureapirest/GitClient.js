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
     * Get commits for a repository
     * @param repositoryId - ID of the repository
     * @param branch - Optional branch name
     * @param top - Optional number of commits to return
     * @returns Promise with commits
     */
    async getCommits(repositoryId, branch, top) {
        const queryParams = {};
        if (branch) {
            queryParams.searchCriteria = JSON.stringify({ itemVersion: { version: branch } });
        }
        if (top) {
            queryParams.$top = top.toString();
        }
        return this.get(`/git/repositories/${repositoryId}/commits`, queryParams);
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
     * Get pull request iterations
     * @param repositoryId - ID of the repository
     * @param pullRequestId - ID of the pull request
     * @param project - Project name
     * @returns Promise with pull request iterations
     */
    async getPullRequestIterations(repositoryId, pullRequestId, project) {
        return this.get(`/git/repositories/${repositoryId}/pullRequests/${pullRequestId}/iterations`);
    }
    /**
     * Get pull request iteration changes
     * @param repositoryId - ID of the repository
     * @param pullRequestId - ID of the pull request
     * @param iterationId - ID of the iteration
     * @param project - Project name
     * @returns Promise with pull request iteration changes
     */
    async getPullRequestIterationChanges(repositoryId, pullRequestId, iterationId, project) {
        return this.get(`/git/repositories/${repositoryId}/pullRequests/${pullRequestId}/iterations/${iterationId}/changes`);
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
        } // Return the response body as a readable stream
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
}
exports.GitClient = GitClient;
