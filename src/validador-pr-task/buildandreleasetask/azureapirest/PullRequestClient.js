"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PullRequestClient = void 0;
const AzureDevOpsApiClient_1 = require("./AzureDevOpsApiClient");
/**
 * A client for interacting with Azure DevOps Pull Request REST API
 */
class PullRequestClient extends AzureDevOpsApiClient_1.AzureDevOpsApiClient {
    /**
     * Get pull request by ID
     * @param repositoryId - ID of the repository
     * @param pullRequestId - ID of the pull request
     * @returns Promise with pull request details
     */
    async getPullRequest(repositoryId, pullRequestId) {
        return this.get(`/git/repositories/${repositoryId}/pullRequests/${pullRequestId}`);
    }
    /**
     * Get pull request changes
     * @param repositoryId - ID of the repository
     * @param pullRequestId - ID of the pull request
     * @returns Promise with pull request changes
     */
    async getPullRequestChanges(repositoryId, pullRequestId) {
        return this.get(`/git/repositories/${repositoryId}/pullRequests/${pullRequestId}/changes`);
    }
    /**
     * Get pull request content
     * @param repositoryId - ID of the repository
     * @param pullRequestId - ID of the pull request
     * @param path - Path of the file
     * @returns Promise with file content
     */
    async getFileContent(repositoryId, pullRequestId, path) {
        // First get the latest commit ID from the source branch
        const pullRequest = await this.getPullRequest(repositoryId, pullRequestId);
        const commitId = pullRequest.lastMergeSourceCommit.commitId;
        // Use the Git Items API to get the raw content
        const itemUrl = `/git/repositories/${repositoryId}/items`;
        const queryParams = {
            'path': path,
            'versionDescriptor.version': commitId,
            'versionDescriptor.versionType': 'commit',
            'includeContent': 'true'
        };
        const response = await this.get(itemUrl, queryParams);
        return response.content;
    }
    /**
     * Create a comment thread on a pull request
     * @param repositoryId - ID of the repository
     * @param pullRequestId - ID of the pull request
     * @param thread - Comment thread data
     * @returns Promise with created thread
     */
    async createCommentThread(repositoryId, pullRequestId, thread) {
        return this.post(`/git/repositories/${repositoryId}/pullRequests/${pullRequestId}/threads`, thread);
    }
    /**
     * Get all comment threads on a pull request
     * @param repositoryId - ID of the repository
     * @param pullRequestId - ID of the pull request
     * @returns Promise with all threads
     */
    async getCommentThreads(repositoryId, pullRequestId) {
        return this.get(`/git/repositories/${repositoryId}/pullRequests/${pullRequestId}/threads`);
    }
    /**
     * Add a comment to an existing thread
     * @param repositoryId - ID of the repository
     * @param pullRequestId - ID of the pull request
     * @param threadId - ID of the thread
     * @param commentContent - Content of the comment
     * @returns Promise with added comment
     */
    async addComment(repositoryId, pullRequestId, threadId, commentContent) {
        const comment = {
            content: commentContent,
            commentType: 1 // Code line comment
        };
        return this.post(`/git/repositories/${repositoryId}/pullRequests/${pullRequestId}/threads/${threadId}/comments`, comment);
    }
    /**
     * Update pull request status
     * @param repositoryId - ID of the repository
     * @param pullRequestId - ID of the pull request
     * @param status - New status ("active", "abandoned", "completed")
     * @returns Promise with updated pull request
     */
    async updatePullRequestStatus(repositoryId, pullRequestId, status) {
        const updateData = {
            status: status
        };
        return this.patch(`/git/repositories/${repositoryId}/pullRequests/${pullRequestId}`, updateData);
    }
    /**
     * Create a thread with a comment on a specific file and line in a pull request
     * @param thread - Thread data
     * @param repositoryId - ID of the repository
     * @param pullRequestId - ID of the pull request
     * @param project - Project name
     * @returns Promise with created thread
     */
    async createThread(thread, repositoryId, pullRequestId, project) {
        return this.post(`/git/repositories/${repositoryId}/pullRequests/${pullRequestId}/threads`, thread);
    }
    /**
     * Create a pull request status
     * @param status - Status data
     * @param repositoryId - ID of the repository
     * @param pullRequestId - ID of the pull request
     * @param project - Project name
     * @returns Promise with created status
     */
    async createPullRequestStatus(status, repositoryId, pullRequestId, project) {
        return this.post(`/git/repositories/${repositoryId}/pullRequests/${pullRequestId}/statuses`, status);
    }
    /**
     * Create or update a pull request reviewer with vote
     * @param reviewer - Reviewer data with vote
     * @param repositoryId - ID of the repository
     * @param pullRequestId - ID of the pull request
     * @param reviewerId - ID of the reviewer
     * @param project - Project name
     * @returns Promise with updated reviewer
     */
    async createPullRequestReviewer(reviewer, repositoryId, pullRequestId, reviewerId, project) {
        return this.put(`/git/repositories/${repositoryId}/pullRequests/${pullRequestId}/reviewers/${reviewerId}`, reviewer);
    }
    /**
     * Make a PUT request to the Azure DevOps API
     * @param path - API path (without base URL)
     * @param body - Request body
     * @param queryParams - Optional query parameters
     * @returns Promise with response data
     */
    async put(path, body, queryParams = {}) {
        const url = this.buildUrl(path, queryParams);
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': this.getAuthHeader(),
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(body)
        });
        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}: ${await response.text()}`);
        }
        return await response.json();
    }
}
exports.PullRequestClient = PullRequestClient;
