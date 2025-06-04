import { AzureDevOpsApiClient } from './AzureDevOpsApiClient';

/**
 * Interface for build definition
 */
export interface BuildDefinition {
    id: number;
    name: string;
    url: string;
    revision: number;
    type: string;
    quality: string;
    queue: {
        id: number;
        name: string;
    };
    process: {
        type: number;
        yamlFilename?: string;
        phases?: any[];
    };
    repository: {
        id: string;
        type: string;
        name: string;
        url: string;
        defaultBranch: string;
    };
}

/**
 * Interface for a build
 */
export interface Build {
    id: number;
    buildNumber: string;
    status: string;
    result: string;
    queueTime: string;
    startTime: string;
    finishTime: string;
    url: string;
    definition: {
        id: number;
        name: string;
        url: string;
    };
    buildNumberRevision: number;
    project: {
        id: string;
        name: string;
        url: string;
    };
    uri: string;
    sourceBranch: string;
    sourceVersion: string;
    priority: string;
    reason: string;
    requestedFor: {
        displayName: string;
        url: string;
        id: string;
        uniqueName: string;
    };
    requestedBy: {
        displayName: string;
        url: string;
        id: string;
        uniqueName: string;
    };
}

/**
 * Interface for release definition
 */
export interface ReleaseDefinition {
    id: number;
    name: string;
    url: string;
    _links: {
        web: {
            href: string;
        };
    };
    environments: Array<{
        id: number;
        name: string;
        rank: number;
        owner: {
            displayName: string;
            url: string;
            id: string;
            uniqueName: string;
        };
        definitionEnvironmentType: string;
    }>;
}

/**
 * Interface for release
 */
export interface Release {
    id: number;
    name: string;
    status: string;
    createdOn: string;
    createdBy: {
        displayName: string;
        url: string;
        id: string;
        uniqueName: string;
    };
    environments: Array<{
        id: number;
        name: string;
        status: string;
        releaseId: number;
        deploySteps: Array<{
            id: number;
            deploymentId: number;
            status: string;
            operationStatus: string;
        }>;
    }>;
    artifacts: Array<{
        sourceId: string;
        type: string;
        alias: string;
        definitionReference: {
            definition: {
                id: string;
                name: string;
            };
            project: {
                id: string;
                name: string;
            };
        };
    }>;
}

/**
 * A client for interacting with Azure DevOps Build and Release REST APIs
 */
export class PipelineClient extends AzureDevOpsApiClient {
    /**
     * Get build definitions
     * @param name - Optional name filter
     * @returns Promise with build definitions
     */
    async getBuildDefinitions(name?: string): Promise<{ value: BuildDefinition[] }> {
        const queryParams: Record<string, string> = {};
        
        if (name) {
            queryParams.name = name;
        }
        
        return this.get<{ value: BuildDefinition[] }>('/build/definitions', queryParams);
    }

    /**
     * Get a specific build definition
     * @param definitionId - ID of the build definition
     * @returns Promise with build definition
     */
    async getBuildDefinition(definitionId: number): Promise<BuildDefinition> {
        return this.get<BuildDefinition>(`/build/definitions/${definitionId}`);
    }

    /**
     * Queue a new build
     * @param definitionId - ID of the build definition
     * @param sourceBranch - Optional source branch
     * @param parameters - Optional build parameters
     * @returns Promise with queued build
     */
    async queueBuild(
        definitionId: number, 
        sourceBranch?: string,
        parameters?: Record<string, string>
    ): Promise<Build> {
        const body: any = {
            definition: {
                id: definitionId
            }
        };
        
        if (sourceBranch) {
            body.sourceBranch = sourceBranch;
        }
        
        if (parameters) {
            body.parameters = JSON.stringify(parameters);
        }
        
        return this.post<Build>('/build/builds', body);
    }

    /**
     * Get builds
     * @param definitionId - Optional definition ID filter
     * @param branchName - Optional branch name filter
     * @param top - Optional maximum number of builds to return
     * @returns Promise with builds
     */
    async getBuilds(
        definitionId?: number,
        branchName?: string,
        top?: number
    ): Promise<{ value: Build[] }> {
        const queryParams: Record<string, string> = {};
        
        if (definitionId) {
            queryParams.definitions = definitionId.toString();
        }
        
        if (branchName) {
            queryParams.branchName = branchName;
        }
        
        if (top) {
            queryParams.$top = top.toString();
        }
        
        return this.get<{ value: Build[] }>('/build/builds', queryParams);
    }

    /**
     * Get a specific build
     * @param buildId - ID of the build
     * @returns Promise with build details
     */
    async getBuild(buildId: number): Promise<Build> {
        return this.get<Build>(`/build/builds/${buildId}`);
    }

    /**
     * Get build logs
     * @param buildId - ID of the build
     * @returns Promise with log URLs
     */
    async getBuildLogs(buildId: number): Promise<{ value: Array<{ id: number, url: string }> }> {
        return this.get<{ value: Array<{ id: number, url: string }> }>(`/build/builds/${buildId}/logs`);
    }

    /**
     * Get specific build log content
     * @param buildId - ID of the build
     * @param logId - ID of the log
     * @returns Promise with log content
     */
    async getBuildLogContent(buildId: number, logId: number): Promise<string> {
        return this.get<string>(`/build/builds/${buildId}/logs/${logId}`);
    }

    /**
     * Get release definitions
     * @param name - Optional name filter
     * @returns Promise with release definitions
     */
    async getReleaseDefinitions(name?: string): Promise<{ value: ReleaseDefinition[] }> {
        const queryParams: Record<string, string> = {};
        
        if (name) {
            queryParams.searchText = name;
        }
        
        return this.get<{ value: ReleaseDefinition[] }>('/release/definitions', queryParams);
    }

    /**
     * Get a specific release definition
     * @param definitionId - ID of the release definition
     * @returns Promise with release definition
     */
    async getReleaseDefinition(definitionId: number): Promise<ReleaseDefinition> {
        return this.get<ReleaseDefinition>(`/release/definitions/${definitionId}`);
    }

    /**
     * Create a new release
     * @param definitionId - ID of the release definition
     * @param description - Optional description
     * @param artifacts - Optional artifacts
     * @returns Promise with created release
     */
    async createRelease(
        definitionId: number,
        description?: string,
        artifacts?: Array<{ alias: string, instanceId: string }>
    ): Promise<Release> {
        const body: any = {
            definitionId,
            isDraft: false,
            reason: "manual"
        };
        
        if (description) {
            body.description = description;
        }
        
        if (artifacts && artifacts.length > 0) {
            body.artifacts = artifacts;
        }
        
        return this.post<Release>('/release/releases', body);
    }

    /**
     * Get releases
     * @param definitionId - Optional definition ID filter
     * @param top - Optional maximum number of releases to return
     * @returns Promise with releases
     */
    async getReleases(
        definitionId?: number,
        top?: number
    ): Promise<{ value: Release[] }> {
        const queryParams: Record<string, string> = {};
        
        if (definitionId) {
            queryParams.definitionId = definitionId.toString();
        }
        
        if (top) {
            queryParams.$top = top.toString();
        }
        
        return this.get<{ value: Release[] }>('/release/releases', queryParams);
    }

    /**
     * Get a specific release
     * @param releaseId - ID of the release
     * @returns Promise with release details
     */
    async getRelease(releaseId: number): Promise<Release> {
        return this.get<Release>(`/release/releases/${releaseId}`);
    }
}
