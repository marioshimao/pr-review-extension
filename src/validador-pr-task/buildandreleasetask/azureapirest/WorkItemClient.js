"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkItemClient = void 0;
const AzureDevOpsApiClient_1 = require("./AzureDevOpsApiClient");
/**
 * A client for interacting with Azure DevOps Work Items REST API
 */
class WorkItemClient extends AzureDevOpsApiClient_1.AzureDevOpsApiClient {
    /**
     * Get work item by ID
     * @param workItemId - ID of the work item
     * @param fields - Optional array of fields to include
     * @returns Promise with work item details
     */
    async getWorkItem(workItemId, fields) {
        const queryParams = {};
        if (fields && fields.length > 0) {
            queryParams.fields = fields.join(',');
        }
        return this.get(`/wit/workitems/${workItemId}`, queryParams);
    }
    /**
     * Create a new work item
     * @param workItemType - Type of work item (Bug, Task, User Story, etc.)
     * @param fields - Array of fields to set
     * @returns Promise with created work item
     */
    async createWorkItem(workItemType, fields) {
        const path = `/wit/workitems/$${workItemType}`;
        return this.post(path, fields, { 'validateOnly': 'false' });
    }
    /**
     * Update an existing work item
     * @param workItemId - ID of the work item
     * @param fields - Array of fields to update
     * @returns Promise with updated work item
     */
    async updateWorkItem(workItemId, fields) {
        return this.patch(`/wit/workitems/${workItemId}`, fields);
    }
    /**
     * Delete a work item
     * @param workItemId - ID of the work item
     * @param destroy - If true, permanently delete; if false, move to recycle bin
     * @returns Promise with operation result
     */
    async deleteWorkItem(workItemId, destroy = false) {
        const queryParams = {
            'destroy': destroy.toString()
        };
        // Using void since delete doesn't return content
        await this.get(`/wit/workitems/${workItemId}`, queryParams);
    }
    /**
     * Run a work item query
     * @param query - WIQL query string
     * @returns Promise with query results
     */
    async runQuery(query) {
        const body = {
            query: query
        };
        return this.post('/wit/wiql', body);
    }
    /**
     * Get work items by IDs
     * @param workItemIds - Array of work item IDs
     * @param fields - Optional fields to include
     * @returns Promise with work items
     */
    async getWorkItems(workItemIds, fields) {
        if (!workItemIds.length) {
            return { value: [] };
        }
        const queryParams = {
            'ids': workItemIds.join(',')
        };
        if (fields && fields.length > 0) {
            queryParams.fields = fields.join(',');
        }
        return this.get('/wit/workitems', queryParams);
    }
    /**
     * Add a comment to a work item
     * @param workItemId - ID of the work item
     * @param comment - Comment text
     * @returns Promise with updated work item
     */
    async addComment(workItemId, comment) {
        const fields = [
            {
                op: "add",
                path: "/fields/System.History",
                value: comment
            }
        ];
        return this.updateWorkItem(workItemId, fields);
    }
    /**
     * Create a relationship between work items
     * @param sourceWorkItemId - Source work item ID
     * @param targetWorkItemId - Target work item ID
     * @param relationshipType - Type of relationship ("Child", "Parent", "Related", etc.)
     * @returns Promise with updated work item
     */
    async createRelationship(sourceWorkItemId, targetWorkItemId, relationshipType) {
        const fields = [
            {
                op: "add",
                path: "/relations/-",
                value: {
                    rel: relationshipType,
                    url: `https://dev.azure.com/{organization}/{project}/_apis/wit/workItems/${targetWorkItemId}`,
                    attributes: {
                        comment: "Linked by API"
                    }
                }
            }
        ];
        return this.updateWorkItem(sourceWorkItemId, fields);
    }
}
exports.WorkItemClient = WorkItemClient;
