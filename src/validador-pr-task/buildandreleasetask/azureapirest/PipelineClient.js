"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PipelineClient = void 0;
const AzureDevOpsApiClient_1 = require("./AzureDevOpsApiClient");
/**
 * A client for interacting with Azure DevOps Build and Release REST APIs
 */
class PipelineClient extends AzureDevOpsApiClient_1.AzureDevOpsApiClient {
    /**
     * Get build definitions
     * @param name - Optional name filter
     * @returns Promise with build definitions
     */
    async getBuildDefinitions(name) {
        const queryParams = {};
        if (name) {
            queryParams.name = name;
        }
        return this.get('/build/definitions', queryParams);
    }
    /**
     * Get a specific build definition
     * @param definitionId - ID of the build definition
     * @returns Promise with build definition
     */
    async getBuildDefinition(definitionId) {
        return this.get(`/build/definitions/${definitionId}`);
    }
    /**
     * Queue a new build
     * @param definitionId - ID of the build definition
     * @param sourceBranch - Optional source branch
     * @param parameters - Optional build parameters
     * @returns Promise with queued build
     */
    async queueBuild(definitionId, sourceBranch, parameters) {
        const body = {
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
        return this.post('/build/builds', body);
    }
    /**
     * Get builds
     * @param definitionId - Optional definition ID filter
     * @param branchName - Optional branch name filter
     * @param top - Optional maximum number of builds to return
     * @returns Promise with builds
     */
    async getBuilds(definitionId, branchName, top) {
        const queryParams = {};
        if (definitionId) {
            queryParams.definitions = definitionId.toString();
        }
        if (branchName) {
            queryParams.branchName = branchName;
        }
        if (top) {
            queryParams.$top = top.toString();
        }
        return this.get('/build/builds', queryParams);
    }
    /**
     * Get a specific build
     * @param buildId - ID of the build
     * @returns Promise with build details
     */
    async getBuild(buildId) {
        return this.get(`/build/builds/${buildId}`);
    }
    /**
     * Get build logs
     * @param buildId - ID of the build
     * @returns Promise with log URLs
     */
    async getBuildLogs(buildId) {
        return this.get(`/build/builds/${buildId}/logs`);
    }
    /**
     * Get specific build log content
     * @param buildId - ID of the build
     * @param logId - ID of the log
     * @returns Promise with log content
     */
    async getBuildLogContent(buildId, logId) {
        return this.get(`/build/builds/${buildId}/logs/${logId}`);
    }
    /**
     * Get release definitions
     * @param name - Optional name filter
     * @returns Promise with release definitions
     */
    async getReleaseDefinitions(name) {
        const queryParams = {};
        if (name) {
            queryParams.searchText = name;
        }
        return this.get('/release/definitions', queryParams);
    }
    /**
     * Get a specific release definition
     * @param definitionId - ID of the release definition
     * @returns Promise with release definition
     */
    async getReleaseDefinition(definitionId) {
        return this.get(`/release/definitions/${definitionId}`);
    }
    /**
     * Create a new release
     * @param definitionId - ID of the release definition
     * @param description - Optional description
     * @param artifacts - Optional artifacts
     * @returns Promise with created release
     */
    async createRelease(definitionId, description, artifacts) {
        const body = {
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
        return this.post('/release/releases', body);
    }
    /**
     * Get releases
     * @param definitionId - Optional definition ID filter
     * @param top - Optional maximum number of releases to return
     * @returns Promise with releases
     */
    async getReleases(definitionId, top) {
        const queryParams = {};
        if (definitionId) {
            queryParams.definitionId = definitionId.toString();
        }
        if (top) {
            queryParams.$top = top.toString();
        }
        return this.get('/release/releases', queryParams);
    }
    /**
     * Get a specific release
     * @param releaseId - ID of the release
     * @returns Promise with release details
     */
    async getRelease(releaseId) {
        return this.get(`/release/releases/${releaseId}`);
    }
}
exports.PipelineClient = PipelineClient;
