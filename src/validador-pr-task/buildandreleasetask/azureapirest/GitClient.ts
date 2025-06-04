import { AzureDevOpsApiClient } from './AzureDevOpsApiClient';

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
     * Get commits for a repository
     * @param repositoryId - ID of the repository
     * @param branch - Optional branch name
     * @param top - Optional number of commits to return
     * @returns Promise with commits
     */
    async getCommits(repositoryId: string, branch?: string, top?: number): Promise<{ value: Commit[] }> {
        const queryParams: Record<string, string> = {};
        
        if (branch) {
            queryParams.searchCriteria = JSON.stringify({ itemVersion: { version: branch } });
        }
        
        if (top) {
            queryParams.$top = top.toString();
        }
        
        return this.get<{ value: Commit[] }>(`/git/repositories/${repositoryId}/commits`, queryParams);
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
}
