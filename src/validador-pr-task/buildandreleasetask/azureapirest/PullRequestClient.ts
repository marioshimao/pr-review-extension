import { AzureDevOpsApiClient } from './AzureDevOpsApiClient';

/**
 * Interface for pull request comment thread position
 */
export interface CommentThreadPosition {
    line: number;
    offset: number;
    lineType?: string;
}

/**
 * Interface for pull request comment thread
 */
export interface CommentThread {
    comments: Comment[];
    status: string;
    threadContext: {
        filePath: string;
        rightFileStart: CommentThreadPosition;
        rightFileEnd?: CommentThreadPosition;
    };
}

/**
 * Interface for comment properties
 */
export interface Comment {
    parentCommentId?: number;
    content: string;
    commentType: number; // 1 for code line comment, 2 for pull request comment
}

/**
 * Interface for pull request details
 */
export interface PullRequest {
    pullRequestId: number;
    title: string;
    description: string;
    status: string;
    sourceRefName: string;
    targetRefName: string;
    createdBy: {
        displayName: string;
        url: string;
        id: string;
        uniqueName: string;
    };
    creationDate: string;
    lastMergeSourceCommit: {
        commitId: string;
    };
}

/**
 * Interface for pull request changes
 */
export interface PullRequestChange {
    changeType: string; // "add", "edit", "delete"
    item: {
        objectId: string;
        path: string;
    };
}

/**
 * Interface for pull request thread creation response
 */
export interface CommentThreadResponse {
    id: number;
    publishedDate: string;
    lastUpdatedDate: string;
    comments: Comment[];
    status: string;
}

/**
 * A client for interacting with Azure DevOps Pull Request REST API
 */
export class PullRequestClient extends AzureDevOpsApiClient {
    /**
     * Get pull request by ID
     * @param repositoryId - ID of the repository
     * @param pullRequestId - ID of the pull request
     * @returns Promise with pull request details
     */
    async getPullRequest(repositoryId: string, pullRequestId: number): Promise<PullRequest> {
        return this.get<PullRequest>(
            `/git/repositories/${repositoryId}/pullRequests/${pullRequestId}`
        );
    }

    /**
     * Get pull request changes
     * @param repositoryId - ID of the repository
     * @param pullRequestId - ID of the pull request
     * @returns Promise with pull request changes
     */
    async getPullRequestChanges(repositoryId: string, pullRequestId: number): Promise<{ changes: PullRequestChange[] }> {
        return this.get<{ changes: PullRequestChange[] }>(
            `/git/repositories/${repositoryId}/pullRequests/${pullRequestId}/changes`
        );
    }

    /**
     * Get pull request content
     * @param repositoryId - ID of the repository
     * @param pullRequestId - ID of the pull request
     * @param path - Path of the file
     * @returns Promise with file content
     */
    async getFileContent(repositoryId: string, pullRequestId: number, path: string): Promise<string> {
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

        const response = await this.get<any>(itemUrl, queryParams);
        return response.content;
    }

    /**
     * Create a comment thread on a pull request
     * @param repositoryId - ID of the repository
     * @param pullRequestId - ID of the pull request
     * @param thread - Comment thread data
     * @returns Promise with created thread
     */
    async createCommentThread(
        repositoryId: string, 
        pullRequestId: number, 
        thread: CommentThread
    ): Promise<CommentThreadResponse> {
        return this.post<CommentThreadResponse>(
            `/git/repositories/${repositoryId}/pullRequests/${pullRequestId}/threads`,
            thread
        );
    }

    /**
     * Get all comment threads on a pull request
     * @param repositoryId - ID of the repository
     * @param pullRequestId - ID of the pull request
     * @returns Promise with all threads
     */
    async getCommentThreads(
        repositoryId: string, 
        pullRequestId: number
    ): Promise<{ value: CommentThreadResponse[] }> {
        return this.get<{ value: CommentThreadResponse[] }>(
            `/git/repositories/${repositoryId}/pullRequests/${pullRequestId}/threads`
        );
    }

    /**
     * Add a comment to an existing thread
     * @param repositoryId - ID of the repository
     * @param pullRequestId - ID of the pull request
     * @param threadId - ID of the thread
     * @param commentContent - Content of the comment
     * @returns Promise with added comment
     */
    async addComment(
        repositoryId: string, 
        pullRequestId: number, 
        threadId: number, 
        commentContent: string
    ): Promise<Comment> {
        const comment = {
            content: commentContent,
            commentType: 1 // Code line comment
        };

        return this.post<Comment>(
            `/git/repositories/${repositoryId}/pullRequests/${pullRequestId}/threads/${threadId}/comments`,
            comment
        );
    }

    /**
     * Update pull request status
     * @param repositoryId - ID of the repository
     * @param pullRequestId - ID of the pull request
     * @param status - New status ("active", "abandoned", "completed")
     * @returns Promise with updated pull request
     */
    async updatePullRequestStatus(
        repositoryId: string, 
        pullRequestId: number, 
        status: string
    ): Promise<PullRequest> {
        const updateData = {
            status: status
        };

        return this.patch<PullRequest>(
            `/git/repositories/${repositoryId}/pullRequests/${pullRequestId}`,
            updateData
        );
    }
}
