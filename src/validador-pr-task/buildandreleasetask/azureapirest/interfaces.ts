/**
 * Interface for Git version control change type
 */
export enum VersionControlChangeType {
    None = 0,
    Add = 1,
    Edit = 2,
    Delete = 3,
    Rename = 4,
    Undelete = 5,
    Branch = 6,
    Merge = 7,
    Lock = 8,
    Rollback = 9,
    SourceRename = 10,
    TargetRename = 11,
    Property = 12,
    All = 15
}

/**
 * Interface for Git version options
 */
export enum GitVersionOptions {
    None = 0,
    FirstParent = 1,
    PreviousChange = 2,
    All = 3
}

/**
 * Interface for Git version type
 */
export enum GitVersionType {
    Branch = 0,
    Tag = 1,
    Commit = 2,
    Index = 3
}

/**
 * Interface for Git status state
 */
export enum GitStatusState {
    NotSet = 0,
    Pending = 1,
    Succeeded = 2,
    Failed = 3,
    Error = 4,
    NotApplicable = 5
}

/**
 * Interface for comment thread status
 */
export enum CommentThreadStatus {
    Unknown = 0,
    Active = 1,
    Fixed = 2,
    WontFix = 3,
    Closed = 4,
    ByDesign = 5,
    Pending = 6
}

/**
 * Interface for comment type
 */
export enum CommentType {
    Unknown = 0,
    Text = 1,
    CodeChange = 2,
    System = 3
}

/**
 * Interface for pull request iteration
 */
export interface GitPullRequestIteration {
    id?: number;
    description?: string;
    author?: {
        id: string;
        displayName?: string;
    };
    createdDate?: Date;
    updatedDate?: Date;
    sourceRefCommit?: {
        commitId: string;
    };
    targetRefCommit?: {
        commitId: string;
    };
}

/**
 * Interface for pull request iteration changes
 */
export interface GitPullRequestIterationChanges {
    changeEntries?: GitPullRequestChange[];
}

/**
 * Interface for pull request change
 */
export interface GitPullRequestChange {
    changeType: VersionControlChangeType;
    item?: {
        objectId?: string;
        originalObjectId?: string;
        gitObjectType?: string;
        commitId?: string;
        path?: string;
        isFolder?: boolean;
        url?: string;
    };
}

/**
 * Interface for identity ref with vote
 */
export interface IdentityRefWithVote {
    id: string;
    displayName?: string;
    vote: number;
}

/**
 * Interface for pull request comment thread
 */
export interface GitPullRequestCommentThread {
    comments?: {
        content: string;
        commentType?: CommentType;
    }[];
    status?: CommentThreadStatus;
    threadContext?: {
        filePath?: string;
        leftFileEnd?: {
            line: number;
            offset: number;
        };
        leftFileStart?: {
            line: number;
            offset: number;
        };
        rightFileEnd?: {
            line: number;
            offset: number;
        };
        rightFileStart?: {
            line: number;
            offset: number;
        };
    };
}

/**
 * Interface for pull request status
 */
export interface GitPullRequestStatus {
    state: GitStatusState;
    description?: string;
    context?: {
        name: string;
        genre?: string;
    };
}
