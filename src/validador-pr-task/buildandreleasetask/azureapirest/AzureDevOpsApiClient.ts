/**
 * Base client for Azure DevOps REST API calls
 */
export class AzureDevOpsApiClient {
    private baseUrl: string;
    private organization: string;
    private project: string;
    private personalAccessToken: string;

    /**
     * Constructor for AzureDevOpsApiClient
     * @param organization - Azure DevOps organization name
     * @param project - Azure DevOps project name
     * @param personalAccessToken - Personal Access Token for authentication
     * @param apiVersion - API version (default: '7.2')
     */
    constructor(
        organization: string,
        project: string,
        personalAccessToken: string,
        private apiVersion: string = '7.2'
    ) {
        this.organization = organization;
        this.project = project;
        this.personalAccessToken = personalAccessToken;
        this.baseUrl = `https://dev.azure.com/${organization}/${project}/_apis`;
    }

    /**
     * Get authorization header for API requests
     * @returns Authorization header value
     */
    protected getAuthHeader(): string {
        const token = Buffer.from(`:${this.personalAccessToken}`).toString('base64');
        return `Basic ${token}`;
    }

    /**
     * Make a GET request to the Azure DevOps API
     * @param path - API path (without base URL)
     * @param queryParams - Optional query parameters
     * @returns Promise with response data
     */
    protected async get<T>(path: string, queryParams: Record<string, string> = {}): Promise<T> {
        const url = this.buildUrl(path, queryParams);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': this.getAuthHeader(),
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}: ${await response.text()}`);
        }

        return await response.json() as T;
    }

    /**
     * Make a POST request to the Azure DevOps API
     * @param path - API path (without base URL)
     * @param body - Request body
     * @param queryParams - Optional query parameters
     * @returns Promise with response data
     */
    protected async post<T>(path: string, body: any, queryParams: Record<string, string> = {}): Promise<T> {
        const url = this.buildUrl(path, queryParams);
        
        const response = await fetch(url, {
            method: 'POST',
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

        return await response.json() as T;
    }

    /**
     * Make a PATCH request to the Azure DevOps API
     * @param path - API path (without base URL)
     * @param body - Request body
     * @param queryParams - Optional query parameters
     * @returns Promise with response data
     */
    protected async patch<T>(path: string, body: any, queryParams: Record<string, string> = {}): Promise<T> {
        const url = this.buildUrl(path, queryParams);
        
        const response = await fetch(url, {
            method: 'PATCH',
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

        return await response.json() as T;
    }

    /**
     * Build URL with query parameters
     * @param path - API path
     * @param queryParams - Query parameters
     * @returns Complete URL
     */
    private buildUrl(path: string, queryParams: Record<string, string> = {}): string {
        // Add API version to query params
        const allParams = { 'api-version': this.apiVersion, ...queryParams };
        
        // Build query string
        const queryString = Object.entries(allParams)
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
            .join('&');
        
        return `${this.baseUrl}${path}?${queryString}`;
    }
}
