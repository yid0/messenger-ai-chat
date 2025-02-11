export type EnvType = 'development' | 'production';
export interface IApiConfig {
    baseUrl: string;
    apiKey: string;
    model: string;
    environment: EnvType
}

export interface IApiRequest {
    prompt: string;
    model?: string; 
    maxTokens?: number;
    temperature?: number;
}