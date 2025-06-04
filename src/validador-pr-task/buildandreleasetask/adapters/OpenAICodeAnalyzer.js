"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAICodeAnalyzer = void 0;
const openai_1 = require("openai");
const openai_2 = require("openai");
const fs = __importStar(require("fs"));
const CodeIssue_1 = require("../entities/CodeIssue");
/**
 * Implementação de ICodeAnalyzer usando OpenAI/Azure OpenAI
 * Esta classe gerencia a análise de código usando modelos de IA
 */
class OpenAICodeAnalyzer {
    openai;
    logger;
    usingDefaultPrompt = true;
    _azureConfig;
    /**
     * Construtor para a classe OpenAICodeAnalyzer
     * @param apiKey Chave de API (OpenAI ou Azure OpenAI)
     * @param logger Serviço de log
     * @param azureConfig Configurações para Azure OpenAI (opcional)
     */
    constructor(apiKey, logger, azureConfig) {
        this.logger = logger;
        // Configurar cliente OpenAI ou Azure OpenAI
        if (azureConfig) {
            this.openai = new openai_2.AzureOpenAI({
                apiKey: apiKey,
                endpoint: azureConfig.endpoint,
                apiVersion: azureConfig.apiVersion,
                deployment: azureConfig.deploymentName
            });
            this._azureConfig = azureConfig;
            this.logger.info('Utilizando AzureOpenAI.');
        }
        else {
            this.openai = new openai_1.OpenAI({
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
    async analyzeFiles(files, additionalPrompts) {
        const issues = [];
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
            }
            catch (fileError) {
                this.logger.error(`Erro ao processar arquivo ${file}: ${fileError.message}`);
                issues.push(new CodeIssue_1.CodeIssue(file, 0, `Erro ao processar arquivo: ${fileError.message}`, 'high'));
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
    async analyzeWithRetry(file, content, additionalPrompts) {
        const maxRetries = 3;
        let retryCount = 0;
        const fileIssues = [];
        while (retryCount < maxRetries) {
            try {
                // Construir o conteúdo do prompt do sistema
                let systemContent = "Você é um especialista em revisão de código. Analise o código a seguir e identifique problemas de segurança, performance, boas práticas e manutenibilidade. Formate a saída em JSON com os campos 'line', 'message' e 'severity' (high, medium, low).";
                // Adicionar prompts adicionais, se existirem
                if (additionalPrompts && additionalPrompts.length > 0) {
                    const validPrompts = additionalPrompts.filter(prompt => prompt && prompt.trim() !== '');
                    if (validPrompts.length > 0) {
                        this.usingDefaultPrompt = false;
                        systemContent = validPrompts.map(p => `- ${p.trim()}`).join('\n');
                        this.logger.log(`Adicionando ${validPrompts.length} prompts adicionais à análise de ${file}`);
                    }
                }
                // Só loga o conteúdo do arquivo se o debug do pipeline estiver ativado
                if (process.env.SYSTEM_DEBUG === 'true') {
                    this.logger.log(`Analisando arquivo: ${file} com prompt: ${systemContent}`);
                    this.logger.log(`Conteúdo do arquivo (truncado): ${content.substring(0, 10000)}...`);
                }
                // Enviar para análise
                const response = await this.openai.chat.completions.create({
                    model: this._azureConfig ? this._azureConfig.deploymentName : 'gpt-4o',
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
                // Só loga o conteúdo do arquivo se o debug do pipeline estiver ativado
                if (process.env.SYSTEM_DEBUG === 'true') {
                    console.log(response.choices[0]?.message?.content);
                }
                // Processar a resposta
                if (response.choices[0]?.message?.content) {
                    if (this.usingDefaultPrompt) {
                        try {
                            // Resposta no formato textual
                            const analysisResults = response.choices[0].message.content;
                            // Criar um issue com o conteúdo textual
                            const issue = new CodeIssue_1.CodeIssue(file, 1, analysisResults, 'medium', 'markdown');
                            fileIssues.push(issue);
                            return fileIssues;
                        }
                        catch (textError) {
                            this.logger.warn(`Falha ao processar resposta como texto: ${textError.message}`);
                            fileIssues.push(new CodeIssue_1.CodeIssue(file, 1, `Não foi possível analisar este arquivo em formato textual. ${textError.message}`, 'medium'));
                            return fileIssues;
                        }
                    }
                    else {
                        // Extrair resultados do formato JSON
                        try {
                            let analysisContent = response.choices[0].message.content;
                            // Remove Markdown code block formatting if present
                            if (analysisContent.includes('```json')) {
                                analysisContent = analysisContent.replace(/```json\n?/, '').replace(/\n?```$/, '');
                            }
                            else if (analysisContent.includes('```')) {
                                analysisContent = analysisContent.replace(/```\n?/, '').replace(/\n?```$/, '');
                            }
                            const analysisResults = JSON.parse(analysisContent);
                            if (Array.isArray(analysisResults)) {
                                // Adicionar cada problema encontrado
                                analysisResults.forEach(result => {
                                    const issue = new CodeIssue_1.CodeIssue(file, result.line || 0, result.message || 'Problema identificado (sem detalhes)', result.severity || 'medium');
                                    fileIssues.push(issue);
                                });
                                this.logger.log(`Encontrados ${fileIssues.length} problemas no arquivo ${file}`);
                                // Se chegamos aqui, a análise foi bem-sucedida, podemos retornar
                                return fileIssues;
                            }
                            else {
                                throw new Error('Resultado da análise não é um array.');
                            }
                        }
                        catch (parseError) {
                            // Se falhar ao processar como JSON, tentar extrair informações do texto
                            const error = parseError;
                            this.logger.warn(`Falha ao processar resposta como JSON: ${error.message}`);
                            fileIssues.push(new CodeIssue_1.CodeIssue(file, 1, `Não foi possível analisar este arquivo em formato estruturado. ${error.message}`, 'medium'));
                            // Continuar com retry neste caso
                        }
                    }
                }
                // Se chegamos aqui sem um return anterior, algo deu errado no processamento da resposta
                throw new Error('Erro ao processar resposta do OpenAI');
            }
            catch (apiError) {
                retryCount++;
                // Implementar backoff exponencial
                const delay = Math.pow(2, retryCount) * 1000;
                this.logger.warn(`Tentativa ${retryCount}/${maxRetries} falhou. Tentando novamente em ${delay}ms. Erro: ${apiError.message}`);
                // Esperar antes de tentar novamente
                await new Promise(resolve => setTimeout(resolve, delay));
                // Na última tentativa, adicionar um problema genérico
                if (retryCount >= maxRetries) {
                    fileIssues.push(new CodeIssue_1.CodeIssue(file, 0, `Não foi possível analisar este arquivo após ${maxRetries} tentativas.`, 'high'));
                }
            }
        }
        return fileIssues;
    }
}
exports.OpenAICodeAnalyzer = OpenAICodeAnalyzer;
