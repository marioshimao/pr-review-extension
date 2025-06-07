import { AzureDevOpsApiClient } from './AzureDevOpsApiClient';
import { GitPullRequestIteration, GitPullRequestIterationChanges, VersionControlChangeType, GitStatusState, CommentThreadStatus, CommentType, GitPullRequestCommentThread } from './interfaces';

/**
 * Interface for Git repository
 */
export interface Repository {
    id: string;
    name: string;
    url: string;
    project: {
        id: string;
        name: string;
    };
    defaultBranch: string;
    size: number;
    remoteUrl: string;
    webUrl?: string;
    isDisabled?: boolean;
    isFork?: boolean;
}

/**
 * Interface for creating a repository
 */
export interface RepositoryCreateOptions {
    name: string;
    projectId?: string;
    parentRepository?: {
        id: string;
        projectId?: string;
    };
}

/**
 * Interface for Git branch
 */
export interface Branch {
    name: string;
    objectId: string;
    creator: {
        displayName: string;
        url: string;
        id: string;
        uniqueName: string;
    };
    url: string;
}

/**
 * Interface for Git ref update
 */
export interface GitRefUpdate {
    name: string;
    oldObjectId: string;
    newObjectId: string;
}

/**
 * Interface for Git commit
 */
export interface Commit {
    commitId: string;
    author: {
        name: string;
        email: string;
        date: string;
    };
    committer: {
        name: string;
        email: string;
        date: string;
    };
    comment: string;
    url: string;
    changeCounts: {
        add: number;
        edit: number;
        delete: number;
    };
    parents?: string[];
}

/**
 * Interface for commit search criteria
 */
export interface CommitSearchCriteria {
    itemVersion?: {
        version?: string;
        versionType?: string;
        versionOptions?: string;
    };
    compareVersion?: {
        version?: string;
        versionType?: string;
        versionOptions?: string;
    };
    fromDate?: string;
    toDate?: string;
    author?: string;
    itemPath?: string;
    user?: string;
    ids?: string[];
}

/**
 * Interface for file change item
 */
export interface GitItem {
    objectId: string;
    gitObjectType: string;
    commitId: string;
    path: string;
    isFolder: boolean;
    content?: string;
    contentMetadata?: {
        fileName: string;
        extension: string;
        contentType: string;
    };
}

/**
 * Interface for diff between two commits
 */
export interface GitDiff {
    changes: Array<{
        item: {
            objectId: string;
            originalObjectId: string;
            gitObjectType: string;
            commitId: string;
            path: string;
        };
        changeType: string; // "add", "edit", "delete"
    }>;
    commonCommit: string;
    aheadCount: number;
    behindCount: number;
}

/**
 * Interface for commit changes
 */
export interface GitCommitChanges {
    changes: Array<{
        item: {
            objectId: string;
            path: string;
        };
        changeType: VersionControlChangeType;
    }>;
}

/**
 * Interface for pull request
 */
export interface GitPullRequest {
    pullRequestId: number;
    title: string;
    description?: string;
    repository: Repository;
    sourceRefName: string;
    targetRefName: string;
    status: string;
    createdBy: {
        id: string;
        displayName: string;
    };
    creationDate: string;
    reviewers?: Array<{
        id: string;
        displayName: string;
        vote?: number;
        isRequired?: boolean;
    }>;
    isDraft?: boolean;
    mergeStatus?: string;
    autoCompleteSetBy?: {
        id: string;
        displayName: string;
    };
    completionOptions?: {
        mergeStrategy?: string;
        deleteSourceBranch?: boolean;
        transitionWorkItems?: boolean;
        squashMerge?: boolean;
    };
}

/**
 * Interface for pull request create options
 */
export interface GitPullRequestCreateOptions {
    sourceRefName: string;
    targetRefName: string;
    title: string;
    description?: string;
    reviewers?: Array<{
        id: string;
    }>;
    isDraft?: boolean;
    completionOptions?: {
        mergeStrategy?: string;
        deleteSourceBranch?: boolean;
        transitionWorkItems?: boolean;
    };
}

/**
 * Interface for pull request update options
 */
export interface GitPullRequestUpdateOptions {
    title?: string;
    description?: string;
    status?: string;
    completionOptions?: {
        mergeStrategy?: string;
        deleteSourceBranch?: boolean;
        transitionWorkItems?: boolean;
    };
}

/**
 * Interface for commit status
 */
export interface GitStatus {
    state: GitStatusState;
    description?: string;
    context: {
        name: string;
        genre?: string;
    };
    targetUrl?: string;
}

/**
 * A client for interacting with Azure DevOps Git REST API
 */
export class GitClient extends AzureDevOpsApiClient {
    /**
     * Get repository by name or ID
     * @param repositoryIdOrName - ID or name of the repository
     * @returns Promise with repository details
     */
    async getRepository(repositoryIdOrName: string): Promise<Repository> {
        return this.get<Repository>(`/git/repositories/${repositoryIdOrName}`);
    }

    /**
     * Get all repositories in the project
     * @returns Promise with repositories
     */
    async getRepositories(): Promise<{ value: Repository[] }> {
        return this.get<{ value: Repository[] }>('/git/repositories');
    }

    /**
     * Create a new Git repository
     * @param options - Repository creation options
     * @returns Promise with repository details
     */
    async createRepository(options: RepositoryCreateOptions): Promise<Repository> {
        return this.post<Repository>('/git/repositories', options);
    }

    /**
     * Update a Git repository
     * @param repositoryId - ID of the repository
     * @param options - Repository update properties
     * @returns Promise with updated repository details
     */
    async updateRepository(repositoryId: string, options: Partial<Repository>): Promise<Repository> {
        return this.patch<Repository>(`/git/repositories/${repositoryId}`, options);
    }

    /**
     * Delete a Git repository
     * @param repositoryId - ID of the repository
     * @returns Promise with operation result
     */
    async deleteRepository(repositoryId: string): Promise<void> {
        return this.delete<void>(`/git/repositories/${repositoryId}`);
    }

    /**
     * Get branches for a repository
     * @param repositoryId - ID of the repository
     * @param filter - Optional filter string (e.g., "heads/feature")
     * @returns Promise with branches
     */
    async getBranches(repositoryId: string, filter?: string): Promise<{ value: Branch[] }> {
        const queryParams: Record<string, string> = {};
        
        if (filter) {
            queryParams.filter = filter;
        }
        
        return this.get<{ value: Branch[] }>(`/git/repositories/${repositoryId}/refs`, queryParams);
    }

    /**
     * Create or update Git references (branches/tags)
     * @param repositoryId - ID of the repository
     * @param refUpdates - Reference updates
     * @returns Promise with updated references
     */
    async updateRefs(
        repositoryId: string,
        refUpdates: GitRefUpdate[]
    ): Promise<{ value: Branch[] }> {
        return this.post<{ value: Branch[] }>(`/git/repositories/${repositoryId}/refs`, refUpdates);
    }

    /**
     * Delete a Git reference (branch/tag)
     * @param repositoryId - ID of the repository
     * @param name - Name of the reference to delete
     * @param oldObjectId - Old object ID for the reference
     * @returns Promise with operation result
     */
    async deleteRef(
        repositoryId: string,
        name: string,
        oldObjectId: string
    ): Promise<void> {
        const refUpdates = [{
            name,
            oldObjectId,
            newObjectId: '0000000000000000000000000000000000000000'
        }];
        
        await this.post<{ value: Branch[] }>(`/git/repositories/${repositoryId}/refs`, refUpdates);
    }

    /**
     * Get commits for a repository
     * @param repositoryId - ID of the repository
     * @param searchCriteria - Optional search criteria
     * @param top - Optional number of commits to return
     * @returns Promise with commits
     */
    async getCommits(
        repositoryId: string, 
        searchCriteria?: CommitSearchCriteria,
        top?: number
    ): Promise<{ value: Commit[] }> {
        const queryParams: Record<string, string> = {};
        
        if (searchCriteria) {
            queryParams.searchCriteria = JSON.stringify(searchCriteria);
        }
        
        if (top) {
            queryParams.$top = top.toString();
        }
        
        return this.get<{ value: Commit[] }>(`/git/repositories/${repositoryId}/commits`, queryParams);
    }

    /**
     * Get commits in batch mode
     * @param repositoryId - ID of the repository
     * @param searchCriteria - Commit search criteria
     * @returns Promise with commits
     */
    async getCommitsBatch(
        repositoryId: string,
        searchCriteria: CommitSearchCriteria
    ): Promise<{ value: Commit[] }> {
        return this.post<{ value: Commit[] }>(
            `/git/repositories/${repositoryId}/commitsBatch`,
            { searchCriteria }
        );
    }

    /**
     * Get a specific commit
     * @param repositoryId - ID of the repository
     * @param commitId - ID of the commit
     * @returns Promise with commit details
     */
    async getCommit(repositoryId: string, commitId: string): Promise<Commit> {
        return this.get<Commit>(`/git/repositories/${repositoryId}/commits/${commitId}`);
    }

    /**
     * Get changes for a specific commit
     * @param repositoryId - ID of the repository
     * @param commitId - ID of the commit
     * @returns Promise with commit changes
     */
    async getCommitChanges(repositoryId: string, commitId: string): Promise<GitCommitChanges> {
        return this.get<GitCommitChanges>(`/git/repositories/${repositoryId}/commits/${commitId}/changes`);
    }

    /**
     * Get items (files/folders) in a repository
     * @param repositoryId - ID of the repository
     * @param path - Optional path to get items from (defaults to root)
     * @param recursionLevel - Optional recursion level ("none", "oneLevel", "full")
     * @param version - Optional version (commit ID, branch name)
     * @returns Promise with items
     */
    async getItems(
        repositoryId: string, 
        path?: string, 
        recursionLevel?: string,
        version?: string
    ): Promise<{ value: GitItem[] }> {
        const queryParams: Record<string, string> = {};
        
        if (path) {
            queryParams.path = path;
        }
        
        if (recursionLevel) {
            queryParams.recursionLevel = recursionLevel;
        }
        
        if (version) {
            queryParams['versionDescriptor.version'] = version;
        }
        
        return this.get<{ value: GitItem[] }>(`/git/repositories/${repositoryId}/items`, queryParams);
    }

    /**
     * Get content of a specific file
     * @param repositoryId - ID of the repository
     * @param path - Path to the file
     * @param version - Optional version (commit ID, branch name)
     * @returns Promise with file content
     */
    async getFileContent(repositoryId: string, path: string, version?: string): Promise<string> {
        const queryParams: Record<string, string> = {
            path: path,
            includeContent: 'true'
        };
        
        if (version) {
            queryParams['versionDescriptor.version'] = version;
        }
        
        const response = await this.get<GitItem>(`/git/repositories/${repositoryId}/items`, queryParams);
        return response.content || '';
    }

    /**
     * Compare two branches/commits and get the diff
     * @param repositoryId - ID of the repository
     * @param baseVersion - Base version (commit ID, branch name)
     * @param targetVersion - Target version (commit ID, branch name)
     * @returns Promise with diff details
     */
    async getDiff(
        repositoryId: string,
        baseVersion: string,
        targetVersion: string
    ): Promise<GitDiff> {
        const queryParams = {
            'baseVersionType': 'commit',
            'baseVersion': baseVersion,
            'targetVersionType': 'commit',
            'targetVersion': targetVersion
        };
        
        return this.get<GitDiff>(`/git/repositories/${repositoryId}/diffs/commits`, queryParams);
    }

    /**
     * Create a pull request
     * @param repositoryId - ID of the repository
     * @param options - Pull request creation options
     * @returns Promise with created pull request details
     */
    async createPullRequest(
        repositoryId: string,
        options: GitPullRequestCreateOptions
    ): Promise<GitPullRequest> {
        return this.post<GitPullRequest>(`/git/repositories/${repositoryId}/pullrequests`, options);
    }

    /**
     * Get a specific pull request
     * @param repositoryId - ID of the repository
     * @param pullRequestId - ID of the pull request
     * @returns Promise with pull request details
     */
    async getPullRequest(repositoryId: string, pullRequestId: number): Promise<GitPullRequest> {
        return this.get<GitPullRequest>(`/git/repositories/${repositoryId}/pullrequests/${pullRequestId}`);
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
    async getPullRequests(
        repositoryId: string,
        status?: string,
        creatorId?: string,
        reviewerId?: string,
        sourceRefName?: string,
        targetRefName?: string,
        top?: number
    ): Promise<{ value: GitPullRequest[] }> {
        const queryParams: Record<string, string> = {};
        
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
        
        return this.get<{ value: GitPullRequest[] }>(`/git/repositories/${repositoryId}/pullrequests`, queryParams);
    }

    /**
     * Get pull requests for a project
     * @param project - Project name
     * @param status - Optional status filter (active, abandoned, completed)
     * @param top - Optional number of results to return
     * @returns Promise with pull requests
     */
    async getPullRequestsByProject(
        project?: string,
        status?: string,
        top?: number
    ): Promise<{ value: GitPullRequest[] }> {
        const queryParams: Record<string, string> = {};
        
        if (status) {
            queryParams.status = status;
        }
        
        if (top) {
            queryParams.$top = top.toString();
        }
        
        const path = project ? `/git/pullrequests` : `/git/pullrequests`;
        return this.get<{ value: GitPullRequest[] }>(path, queryParams);
    }

    /**
     * Update a pull request
     * @param repositoryId - ID of the repository
     * @param pullRequestId - ID of the pull request
     * @param options - Pull request update options
     * @returns Promise with updated pull request details
     */
    async updatePullRequest(
        repositoryId: string,
        pullRequestId: number,
        options: GitPullRequestUpdateOptions
    ): Promise<GitPullRequest> {
        return this.patch<GitPullRequest>(`/git/repositories/${repositoryId}/pullrequests/${pullRequestId}`, options);
    }

    /**
     * Get pull request iterations
     * @param repositoryId - ID of the repository
     * @param pullRequestId - ID of the pull request
     * @returns Promise with pull request iterations
     */
    async getPullRequestIterations(
        repositoryId: string,
        pullRequestId: number
    ): Promise<GitPullRequestIteration[]> {
        return this.get<GitPullRequestIteration[]>(
            `/git/repositories/${repositoryId}/pullRequests/${pullRequestId}/iterations`
        );
    }

    /**
     * Get pull request iteration changes
     * @param repositoryId - ID of the repository
     * @param pullRequestId - ID of the pull request
     * @param iterationId - ID of the iteration
     * @returns Promise with pull request iteration changes
     */
    async getPullRequestIterationChanges(
        repositoryId: string,
        pullRequestId: number,
        iterationId: number
    ): Promise<GitPullRequestIterationChanges> {
        return this.get<GitPullRequestIterationChanges>(
            `/git/repositories/${repositoryId}/pullRequests/${pullRequestId}/iterations/${iterationId}/changes`
        );
    }

    /**
     * Get pull request reviewers
     * @param repositoryId - ID of the repository
     * @param pullRequestId - ID of the pull request
     * @returns Promise with pull request reviewers
     */
    async getPullRequestReviewers(
        repositoryId: string,
        pullRequestId: number
    ): Promise<{ value: Array<{ id: string; displayName: string; vote: number }> }> {
        return this.get<{ value: Array<{ id: string; displayName: string; vote: number }> }>(
            `/git/repositories/${repositoryId}/pullRequests/${pullRequestId}/reviewers`
        );
    }

    /**
     * Add a reviewer to a pull request
     * @param repositoryId - ID of the repository
     * @param pullRequestId - ID of the pull request
     * @param reviewerId - ID of the reviewer
     * @param isRequired - Optional flag indicating if the reviewer is required
     * @returns Promise with reviewer details
     */
    async addPullRequestReviewer(
        repositoryId: string,
        pullRequestId: number,
        reviewerId: string,
        isRequired: boolean = false
    ): Promise<{ id: string; displayName: string; vote: number }> {
        return this.put<{ id: string; displayName: string; vote: number }>(
            `/git/repositories/${repositoryId}/pullRequests/${pullRequestId}/reviewers/${reviewerId}`,
            { isRequired }
        );
    }

    /**
     * Create a status for a commit
     * @param repositoryId - ID of the repository
     * @param commitId - ID of the commit
     * @param status - Status to create
     * @returns Promise with created status
     */
    async createCommitStatus(
        repositoryId: string,
        commitId: string,
        status: GitStatus
    ): Promise<GitStatus> {
        return this.post<GitStatus>(
            `/git/repositories/${repositoryId}/commits/${commitId}/statuses`,
            status
        );
    }

    /**
     * Get statuses for a commit
     * @param repositoryId - ID of the repository
     * @param commitId - ID of the commit
     * @returns Promise with commit statuses
     */
    async getCommitStatuses(
        repositoryId: string,
        commitId: string
    ): Promise<{ value: GitStatus[] }> {
        return this.get<{ value: GitStatus[] }>(
            `/git/repositories/${repositoryId}/commits/${commitId}/statuses`
        );
    }

    /**
     * Create a comment thread in a pull request
     * @param repositoryId - ID of the repository
     * @param pullRequestId - ID of the pull request
     * @param thread - Comment thread to create
     * @returns Promise with created comment thread
     */
    async createPullRequestThread(
        repositoryId: string,
        pullRequestId: number,
        thread: GitPullRequestCommentThread
    ): Promise<GitPullRequestCommentThread> {
        return this.post<GitPullRequestCommentThread>(
            `/git/repositories/${repositoryId}/pullRequests/${pullRequestId}/threads`,
            thread
        );
    }

    /**
     * Get comment threads for a pull request
     * @param repositoryId - ID of the repository
     * @param pullRequestId - ID of the pull request
     * @returns Promise with pull request comment threads
     */
    async getPullRequestThreads(
        repositoryId: string,
        pullRequestId: number
    ): Promise<{ value: GitPullRequestCommentThread[] }> {
        return this.get<{ value: GitPullRequestCommentThread[] }>(
            `/git/repositories/${repositoryId}/pullRequests/${pullRequestId}/threads`
        );
    }

    /**
     * Get item content from repository
     * @param repositoryId - ID of the repository
     * @param path - Path of the file
     * @param includeContent - Whether to include content
     * @param versionDescriptor - Version descriptor
     * @returns Promise with file content as stream
     */
    async getItemContent(
        repositoryId: string,
        path: string,
        project?: string,
        scopePath?: string,
        recursionLevel?: string,
        includeContentMetadata?: boolean,
        latestProcessedChange?: boolean,
        includeContent?: boolean,
        versionDescriptor?: {
            version?: string,
            versionOptions?: number,
            versionType?: number
        }
    ): Promise<NodeJS.ReadableStream> {
        const queryParams: Record<string, string> = {
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
        return response.body as unknown as NodeJS.ReadableStream;
    }

    /**
     * Build URL with query parameters
     * Override from parent class to make it accessible here
     * @param path - API path
     * @param queryParams - Query parameters
     * @returns Complete URL
     */
    protected buildUrl(path: string, queryParams: Record<string, string> = {}): string {
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
    protected async delete<T>(path: string, queryParams: Record<string, string> = {}): Promise<T> {
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
                return {} as T;
            }
            
            return await response.json() as T;
        });
    }
}
