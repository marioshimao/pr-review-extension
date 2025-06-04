import { AzureDevOpsApiClient } from './AzureDevOpsApiClient';

/**
 * Interface for work item field
 */
export interface WorkItemField {
    op: string; // "add", "remove", "replace", "test", "move", "copy"
    path: string; // "/field/System.Title", "/field/System.Description", etc.
    value: string | number | object; // Value to set
}

/**
 * Interface for work item
 */
export interface WorkItem {
    id: number;
    rev: number;
    fields: {
        'System.Id': number;
        'System.Title': string;
        'System.State'?: string;
        'System.AssignedTo'?: {
            displayName: string;
            url: string;
            id: string;
            uniqueName: string;
        };
        'System.CreatedBy': {
            displayName: string;
            url: string;
            id: string;
            uniqueName: string;
        };
        'System.CreatedDate': string;
        'System.ChangedDate': string;
        'System.WorkItemType': string;
        [key: string]: any; // Allow any other fields
    };
    url: string;
    relations?: Array<{
        rel: string;
        url: string;
        attributes: {
            name?: string;
            [key: string]: any;
        };
    }>;
}

/**
 * Interface for query result entry
 */
export interface QueryResultWorkItem {
    id: number;
    url: string;
}

/**
 * Interface for work item query result
 */
export interface WorkItemQueryResult {
    queryType: string;
    queryResultType: string;
    asOf: string;
    workItems: QueryResultWorkItem[];
    columns?: Array<{
        referenceName: string;
        name: string;
        url: string;
    }>;
}

/**
 * A client for interacting with Azure DevOps Work Items REST API
 */
export class WorkItemClient extends AzureDevOpsApiClient {
    /**
     * Get work item by ID
     * @param workItemId - ID of the work item
     * @param fields - Optional array of fields to include
     * @returns Promise with work item details
     */
    async getWorkItem(workItemId: number, fields?: string[]): Promise<WorkItem> {
        const queryParams: Record<string, string> = {};
        
        if (fields && fields.length > 0) {
            queryParams.fields = fields.join(',');
        }
        
        return this.get<WorkItem>(`/wit/workitems/${workItemId}`, queryParams);
    }

    /**
     * Create a new work item
     * @param workItemType - Type of work item (Bug, Task, User Story, etc.)
     * @param fields - Array of fields to set
     * @returns Promise with created work item
     */
    async createWorkItem(workItemType: string, fields: WorkItemField[]): Promise<WorkItem> {
        const path = `/wit/workitems/$${workItemType}`;
        return this.post<WorkItem>(path, fields, { 'validateOnly': 'false' });
    }

    /**
     * Update an existing work item
     * @param workItemId - ID of the work item
     * @param fields - Array of fields to update
     * @returns Promise with updated work item
     */
    async updateWorkItem(workItemId: number, fields: WorkItemField[]): Promise<WorkItem> {
        return this.patch<WorkItem>(`/wit/workitems/${workItemId}`, fields);
    }

    /**
     * Delete a work item
     * @param workItemId - ID of the work item
     * @param destroy - If true, permanently delete; if false, move to recycle bin
     * @returns Promise with operation result
     */
    async deleteWorkItem(workItemId: number, destroy: boolean = false): Promise<void> {
        const queryParams: Record<string, string> = {
            'destroy': destroy.toString()
        };
        
        // Using void since delete doesn't return content
        await this.get<void>(`/wit/workitems/${workItemId}`, queryParams);
    }

    /**
     * Run a work item query
     * @param query - WIQL query string
     * @returns Promise with query results
     */
    async runQuery(query: string): Promise<WorkItemQueryResult> {
        const body = {
            query: query
        };
        
        return this.post<WorkItemQueryResult>('/wit/wiql', body);
    }

    /**
     * Get work items by IDs
     * @param workItemIds - Array of work item IDs
     * @param fields - Optional fields to include
     * @returns Promise with work items
     */
    async getWorkItems(workItemIds: number[], fields?: string[]): Promise<{ value: WorkItem[] }> {
        if (!workItemIds.length) {
            return { value: [] };
        }
        
        const queryParams: Record<string, string> = {
            'ids': workItemIds.join(',')
        };
        
        if (fields && fields.length > 0) {
            queryParams.fields = fields.join(',');
        }
        
        return this.get<{ value: WorkItem[] }>('/wit/workitems', queryParams);
    }

    /**
     * Add a comment to a work item
     * @param workItemId - ID of the work item
     * @param comment - Comment text
     * @returns Promise with updated work item
     */
    async addComment(workItemId: number, comment: string): Promise<WorkItem> {
        const fields: WorkItemField[] = [
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
    async createRelationship(
        sourceWorkItemId: number,
        targetWorkItemId: number,
        relationshipType: string
    ): Promise<WorkItem> {
        const fields: WorkItemField[] = [
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
