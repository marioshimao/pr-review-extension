/**
 * Base client for Azure DevOps REST API calls
 */
export class AzureDevOpsApiClient {
    protected baseUrl: string;
    private organization: string;
    private project: string;
    private personalAccessToken: string;
    private maxRetries: number = 3;

    /**
     * Constructor for AzureDevOpsApiClient
     * @param organization - Azure DevOps organization name
     * @param project - Azure DevOps project name
     * @param personalAccessToken - Personal Access Token for authentication
     * @param apiVersion - API version (default: '7.2')
     * @param maxRetries - Maximum number of retry attempts (default: 3)
     */    constructor(
        organization: string,
        project: string,
        personalAccessToken: string,
        protected apiVersion: string = '7.1',
        maxRetries: number = 3
    ) {
        this.organization = organization;
        this.project = project;
        this.personalAccessToken = personalAccessToken;
        this.baseUrl = `https://dev.azure.com/${organization}/${project}/_apis`;
        this.maxRetries = maxRetries;
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
     * Execute a request with retry logic
     * @param request - Function that executes the request
     * @returns Promise with response
     */
    protected async executeWithRetry<T>(request: () => Promise<T>): Promise<T> {
        let retryCount = 0;
        let lastError: Error | null = null;

        while (retryCount < this.maxRetries) {
            try {
                return await request();
            } catch (error: any) {
                lastError = error;
                retryCount++;
                
                if (retryCount >= this.maxRetries) {
                    break;
                }
                
                // Calculate backoff with exponential delay
                const delayMs = Math.pow(2, retryCount) * 1000;
                console.log(`Request failed (attempt ${retryCount}/${this.maxRetries}). Retrying in ${delayMs}ms...`);
                
                // Wait before retrying
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }
        
        throw lastError || new Error(`Request failed after ${this.maxRetries} attempts`);
    }

    /**
     * Make a GET request to the Azure DevOps API with retry
     * @param path - API path (without base URL)
     * @param queryParams - Optional query parameters
     * @returns Promise with response data
     */
    protected async get<T>(path: string, queryParams: Record<string, string> = {}): Promise<T> {
        return this.executeWithRetry(async () => {
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
        });
    }

    /**
     * Make a POST request to the Azure DevOps API with retry
     * @param path - API path (without base URL)
     * @param body - Request body
     * @param queryParams - Optional query parameters
     * @returns Promise with response data
     */
    protected async post<T>(path: string, body: any, queryParams: Record<string, string> = {}): Promise<T> {
        return this.executeWithRetry(async () => {
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
        });
    }

    /**
     * Make a PATCH request to the Azure DevOps API with retry
     * @param path - API path (without base URL)
     * @param body - Request body
     * @param queryParams - Optional query parameters
     * @returns Promise with response data
     */
    protected async patch<T>(path: string, body: any, queryParams: Record<string, string> = {}): Promise<T> {
        return this.executeWithRetry(async () => {
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
        });
    }

    /**
     * Make a PUT request to the Azure DevOps API with retry
     * @param path - API path (without base URL)
     * @param body - Request body
     * @param queryParams - Optional query parameters
     * @returns Promise with response data
     */
    protected async put<T>(path: string, body: any, queryParams: Record<string, string> = {}): Promise<T> {
        return this.executeWithRetry(async () => {
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
    
            return await response.json() as T;
        });
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

    /**
     * Build URL with query parameters
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
}
