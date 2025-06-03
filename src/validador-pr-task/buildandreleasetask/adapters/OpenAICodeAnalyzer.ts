import { OpenAI } from 'openai';
import { AzureOpenAI } from 'openai';
import * as fs from 'fs';
import { ICodeAnalyzer } from '../interfaces/ICodeAnalyzer';
import { CodeIssue } from '../entities/CodeIssue';
import { ILogService } from '../interfaces/ILogService';

/**
 * Implementação de ICodeAnalyzer usando OpenAI/Azure OpenAI
 * Esta classe gerencia a análise de código usando modelos de IA
 */
export class OpenAICodeAnalyzer implements ICodeAnalyzer {
    private openai: OpenAI | AzureOpenAI;
    private logger: ILogService;
    
    /**
     * Construtor para a classe OpenAICodeAnalyzer
     * @param apiKey Chave de API (OpenAI ou Azure OpenAI)
     * @param logger Serviço de log
     * @param azureConfig Configurações para Azure OpenAI (opcional)
     */
    constructor(
        apiKey: string,
        logger: ILogService,
        azureConfig?: {
            endpoint: string;
            apiVersion: string;
            deploymentName: string;
        }
    ) {
        this.logger = logger;
        
        // Configurar cliente OpenAI ou Azure OpenAI
        if (azureConfig) {
            this.openai = new AzureOpenAI({
                apiKey: apiKey,
                endpoint: azureConfig.endpoint,
                apiVersion: azureConfig.apiVersion,
                deployment: azureConfig.deploymentName
            });
            this.logger.info('Utilizando AzureOpenAI.');
        } else {
            this.openai = new OpenAI({
                apiKey: apiKey
            });
        }
        
        this.logger.info('Cliente OpenAI configurado.');
    }
    
    /**
     * Analisa arquivos de código fonte e identifica problemas
     * @param files Lista de caminhos de arquivo para analisar
     * @param additionalPrompts Prompts adicionais para customizar a análise
     * @returns Promise com array de problemas encontrados
     */
    public async analyzeFiles(files: string[], additionalPrompts?: string[]): Promise<CodeIssue[]> {
        const issues: CodeIssue[] = [];
        
        this.logger.info('Iniciando análise de código com OpenAI...');
        
        // Processar cada arquivo
        for (const file of files) {
            try {
                // Verificar se o arquivo existe
                if (!fs.existsSync(file)) {
                    this.logger.warn(`Arquivo não encontrado: ${file}`);
                    continue;
                }

                // Ler o conteúdo do arquivo
                const fileContent = fs.readFileSync(file, 'utf8');
                
                // Limitar o tamanho do arquivo para evitar exceder tokens
                const truncatedContent = fileContent.length > 10000 
                    ? fileContent.substring(0, 10000) + "... (conteúdo truncado)"
                    : fileContent;

                this.logger.log(`Analisando arquivo: ${file}`);

                // Implementar retry com exponential backoff
                const fileIssues = await this.analyzeWithRetry(file, truncatedContent, additionalPrompts);
                issues.push(...fileIssues);
                
            } catch (fileError: any) {
                this.logger.error(`Erro ao processar arquivo ${file}: ${fileError.message}`);
                issues.push(new CodeIssue(
                    file,
                    0,
                    `Erro ao processar arquivo: ${fileError.message}`,
                    'high'
                ));
            }
        }
        
        this.logger.info(`Análise concluída. Encontrados ${issues.length} problemas.`);
        return issues;
    }
    
    /**
     * Analisa um arquivo com retry e backoff exponencial
     * @param file Caminho do arquivo
     * @param content Conteúdo do arquivo
     * @param additionalPrompts Prompts adicionais
     * @returns Promise com problemas encontrados no arquivo
     */
    private async analyzeWithRetry(
        file: string,
        content: string,
        additionalPrompts?: string[]
    ): Promise<CodeIssue[]> {
        const maxRetries = 3;
        let retryCount = 0;
        const fileIssues: CodeIssue[] = [];

        while (retryCount < maxRetries) {
            try {
                // Construir o conteúdo do prompt do sistema
                let systemContent = "Você é um especialista em revisão de código. Analise o código a seguir e identifique problemas de segurança, performance, boas práticas e manutenibilidade. Formate a saída em JSON com os campos 'line', 'message' e 'severity' (high, medium, low).";
                
                // Adicionar prompts adicionais, se existirem
                if (additionalPrompts && additionalPrompts.length > 0) {
                    const validPrompts = additionalPrompts.filter(prompt => prompt && prompt.trim() !== '');
                    if (validPrompts.length > 0) {
                        systemContent += "\n\nConsiderações adicionais:\n" + validPrompts.map(p => `- ${p.trim()}`).join('\n');
                        this.logger.log(`Adicionando ${validPrompts.length} prompts adicionais à análise de ${file}`);
                    }
                }

                // Enviar para análise
                const response = await this.openai.chat.completions.create({
                    model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "gpt-4",
                    messages: [
                        { 
                            role: "system", 
                            content: systemContent
                        },
                        { 
                            role: "user", 
                            content: `Arquivo: ${file}\n\nConteúdo:\n${content}` 
                        }
                    ],
                    temperature: 0.1,
                    max_tokens: 1500,
                });
 
                // Processar a resposta
                if (response.choices[0]?.message?.content) {
                    // Extrair resultados do formato JSON
                    try {
                        let analysisContent = response.choices[0].message.content;
                        
                        // Remove Markdown code block formatting if present
                        if (analysisContent.includes('```json')) {
                            analysisContent = analysisContent.replace(/```json\n?/, '').replace(/\n?```$/, '');
                        } else if (analysisContent.includes('```')) {
                            analysisContent = analysisContent.replace(/```\n?/, '').replace(/\n?```$/, '');
                        }
                        const analysisResults = JSON.parse(analysisContent);
                        
                        if (Array.isArray(analysisResults)) {
                            // Adicionar cada problema encontrado
                            analysisResults.forEach(result => {
                                const issue = new CodeIssue(
                                    file,
                                    result.line || 0,
                                    result.message || 'Problema identificado (sem detalhes)',
                                    (result.severity as 'high' | 'medium' | 'low') || 'medium'
                                );
                                fileIssues.push(issue);
                            });
                            
                            this.logger.log(`Encontrados ${fileIssues.length} problemas no arquivo ${file}`);
                            
                            // Se chegamos aqui, a análise foi bem-sucedida, podemos retornar
                            return fileIssues;
                        } else {
                            throw new Error('Resultado da análise não é um array.');
                        }
                    } catch (parseError: unknown) {
                        // Se falhar ao processar como JSON, tentar extrair informações do texto
                        const error = parseError as Error;
                        this.logger.warn(`Falha ao processar resposta como JSON: ${error.message}`);
                        fileIssues.push(new CodeIssue(
                            file,
                            1,
                            `Não foi possível analisar este arquivo em formato estruturado. ${error.message}`,
                            'medium'
                        ));
                        
                        // Continuar com retry neste caso
                    }
                }
                
                // Se chegamos aqui sem um return anterior, algo deu errado no processamento da resposta
                throw new Error('Erro ao processar resposta do OpenAI');
                
            } catch (apiError: any) {
                retryCount++;
                
                // Implementar backoff exponencial
                const delay = Math.pow(2, retryCount) * 1000;
                this.logger.warn(`Tentativa ${retryCount}/${maxRetries} falhou. Tentando novamente em ${delay}ms. Erro: ${apiError.message}`);
                
                // Esperar antes de tentar novamente
                await new Promise(resolve => setTimeout(resolve, delay));
                
                // Na última tentativa, adicionar um problema genérico
                if (retryCount >= maxRetries) {
                    fileIssues.push(new CodeIssue(
                        file,
                        0,
                        `Não foi possível analisar este arquivo após ${maxRetries} tentativas.`,
                        'high'
                    ));
                }
            }
        }

        return fileIssues;
    }
}
