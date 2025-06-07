"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AzureDevOpsApiClient = void 0;
/**
 * Base client for Azure DevOps REST API calls
 */
class AzureDevOpsApiClient {
    apiVersion;
    baseUrl;
    organization;
    project;
    personalAccessToken;
    maxRetries = 3;
    /**
     * Constructor for AzureDevOpsApiClient
     * @param organization - Azure DevOps organization name
     * @param project - Azure DevOps project name
     * @param personalAccessToken - Personal Access Token for authentication
     * @param apiVersion - API version (default: '7.2')
     * @param maxRetries - Maximum number of retry attempts (default: 3)
     */ constructor(organization, project, personalAccessToken, apiVersion = '7.1', maxRetries = 3) {
        this.apiVersion = apiVersion;
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
    getAuthHeader() {
        const token = Buffer.from(`:${this.personalAccessToken}`).toString('base64');
        return `Basic ${token}`;
    }
    /**
     * Execute a request with retry logic
     * @param request - Function that executes the request
     * @returns Promise with response
     */
    async executeWithRetry(request) {
        let retryCount = 0;
        let lastError = null;
        while (retryCount < this.maxRetries) {
            try {
                return await request();
            }
            catch (error) {
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
    async get(path, queryParams = {}) {
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
            return await response.json();
        });
    }
    /**
     * Make a POST request to the Azure DevOps API with retry
     * @param path - API path (without base URL)
     * @param body - Request body
     * @param queryParams - Optional query parameters
     * @returns Promise with response data
     */
    async post(path, body, queryParams = {}) {
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
            return await response.json();
        });
    }
    /**
     * Make a PATCH request to the Azure DevOps API with retry
     * @param path - API path (without base URL)
     * @param body - Request body
     * @param queryParams - Optional query parameters
     * @returns Promise with response data
     */
    async patch(path, body, queryParams = {}) {
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
            return await response.json();
        });
    }
    /**
     * Make a PUT request to the Azure DevOps API with retry
     * @param path - API path (without base URL)
     * @param body - Request body
     * @param queryParams - Optional query parameters
     * @returns Promise with response data
     */
    async put(path, body, queryParams = {}) {
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
            return await response.json();
        });
    }
    /**
     * Make a DELETE request to the Azure DevOps API with retry
     * @param path - API path (without base URL)
     * @param queryParams - Optional query parameters
     * @returns Promise with response data
     */
    async delete(path, queryParams = {}) {
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
                return {};
            }
            return await response.json();
        });
    }
    /**
     * Build URL with query parameters
     * @param path - API path
     * @param queryParams - Query parameters
     * @returns Complete URL
     */
    buildUrl(path, queryParams = {}) {
        // Add API version to query params
        const allParams = { 'api-version': this.apiVersion, ...queryParams };
        // Build query string
        const queryString = Object.entries(allParams)
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
            .join('&');
        return `${this.baseUrl}${path}?${queryString}`;
    }
}
exports.AzureDevOpsApiClient = AzureDevOpsApiClient;
