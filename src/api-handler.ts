import { IApiConfig, IApiRequest } from "./types";


export class ApiHandler {
    private config: IApiConfig;

    constructor(config: IApiConfig) {
        this.config = config;
    }

    async generateResponse(request: IApiRequest): Promise<ReadableStream> {
        try {
            const requestBody = {
                prompt: request.prompt,
                model: this.config.model,
            };

            const response = await fetch(`${this.config.baseUrl}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'text/event-stream'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.statusText} (${response.status})`);
            }
 
            return response.body as ReadableStream;
        } catch (error) {
            console.error('API request error details:', error);
            throw error;
        }
    }
}