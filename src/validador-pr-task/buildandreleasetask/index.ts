/**
 * Ponto de entrada principal da task
 * Esta implementação segue os princípios da Arquitetura Limpa (Clean Architecture)
 * 
 * A estrutura do código está organizada em camadas:
 * - Entidades: Objetos de negócio (CodeIssue, AnalysisReport)
 * - Casos de Uso: Implementam a lógica de negócio (AnalyzeCodeUseCase, ReportPullRequestIssuesUseCase)
 * - Interfaces: Definem contratos para adaptadores (IRepository, ICodeAnalyzer, IFileService, ILogService)
 * - Adaptadores: Implementam as interfaces para acessar recursos externos (AzureDevOpsRepository, OpenAICodeAnalyzer)
 * - Controladores: Coordenam os casos de uso (TaskController)
 * - Configuração: Gerencia dependências e configurações (ConfigService)
 */
import * as tl from 'azure-pipelines-task-lib/task';
import { ConfigService } from './config/ConfigService';
import { TaskController } from './controllers/TaskController';
 * - Entidades: Objetos de negócio (CodeIssue, AnalysisReport)
 * - Casos de Uso: Implementam a lógica de negócio (AnalyzeCodeUseCase, ReportPullRequestIssuesUseCase)
 * - Interfaces: Definem contratos para adaptadores (IRepository, ICodeAnalyzer, IFileService, ILogService)
 * - Adaptadores: Implementam as interfaces para acessar recursos externos (AzureDevOpsRepository, OpenAICodeAnalyzer)
 * - Controladores: Coordenam os casos de uso (TaskController)
 * - Configuração: Gerencia dependências e configurações (ConfigService)
 */

import * as tl from 'azure-pipelines-task-lib/task';
import { ConfigService } from './config/ConfigService';
import { TaskController } from './controllers/TaskController';

/**
 * Função principal que inicializa e executa a task
 */
async function run(): Promise<void> {
    try {
        // Inicializar serviço de configuração
        const configService = new ConfigService();
        
        // Inicializar o controlador com as dependências necessárias
        const controller = new TaskController(configService);
        
        // Executar a task
        await controller.execute();
    } catch (err: any) {
        console.error(`Erro fatal durante inicialização da task: ${err.message}`);
        console.error(err.stack);
        tl.setResult(tl.TaskResult.Failed, err.message);
    }
}

/**
 * Encontra arquivos em um diretório usando padrões glob
 * @param rootPath Diretório raiz para busca
 * @param excludePatterns Padrões glob para exclusão
 * @returns Array com caminhos completos dos arquivos encontrados
 */
function findFiles(rootPath: string, excludePatterns: string[]): string[] {
    try {
        // Usar azure-pipelines-task-lib para buscar arquivos com glob patterns
        const includePattern = '**/*.*';
        
        // Adicionar /** ao final dos padrões de exclusão, se necessário
        const normalizedExcludePatterns = excludePatterns.map(pattern => {
            // Se o padrão já termina com *, não adicionar /**
            if (pattern.endsWith('*')) {
                return pattern;
            }
            // Se o padrão é um diretório (termina com /), adicionar **
            if (pattern.endsWith('/')) {
                return `${pattern}**`;
            }
            // Caso contrário, não modificar
            return pattern;
        });
        
        console.log(`Buscando arquivos: ${includePattern}`);
        console.log(`Excluindo padrões: ${normalizedExcludePatterns.join(', ')}`);        // Buscar arquivos baseados nos padrões
        const matchedFiles = tl.findMatch(
            rootPath, 
            [includePattern], 
            { 
                followSpecifiedSymbolicLink: true,
                followSymbolicLinks: true,
                allowBrokenSymbolicLinks: false
            }
        );
          // Filtrar diretórios e arquivos excluídos
        const files = matchedFiles.filter(file => {
            try {
                // Verificar se é um arquivo
                if (!fs.statSync(file).isFile()) {
                    return false;
                }
                
                // Verificar se o arquivo deve ser excluído pelos padrões
                if (normalizedExcludePatterns.length > 0) {
                    const relativePath = path.relative(rootPath, file).replace(/\\/g, '/');
                    for (const pattern of normalizedExcludePatterns) {
                        if (tl.match([relativePath], pattern).length > 0) {
                            console.log(`Excluindo arquivo por padrão: ${file} (padrão: ${pattern})`);
                            return false;
                        }
                    }
                }
                
                return true;
            } catch (error) {
                return false;
            }
        });
        
        console.log(`Encontrados ${files.length} arquivos após aplicar filtros.`);
        return files;
    } catch (error: any) {
        console.warn(`Erro ao buscar arquivos: ${error.message}`);
        return [];
    }
}

// Função para analisar arquivos com OpenAI
async function analyzeFiles(files: string[], additionalPrompts?: string[]): Promise<{file: string, line: number, message: string}[]> {
    const issues: {file: string, line: number, message: string}[] = [];
    
    try {
        // Configurar cliente OpenAI
        const openai = process.env.OPENAI_API_KEY 
            ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) 
            : new AzureOpenAI({
                apiKey: process.env.AZURE_OPENAI_API_KEY,
                endpoint: process.env.AZURE_OPENAI_ENDPOINT,
                apiVersion: process.env.AZURE_OPENAI_API_VERSION,
            });

        console.log('Cliente OpenAI configurado. Analisando arquivos...');

        // Processar cada arquivo
        for (const file of files) {
            try {
                // Verificar se o arquivo existe
                if (!fs.existsSync(file)) {
                    console.warn(`Arquivo não encontrado: ${file}`);
                    continue;
                }

                // Ler o conteúdo do arquivo
                const fileContent = fs.readFileSync(file, 'utf8');
                
                // Limitar o tamanho do arquivo para evitar exceder tokens
                const truncatedContent = fileContent.length > 10000 
                    ? fileContent.substring(0, 10000) + "... (conteúdo truncado)"
                    : fileContent;

                console.log(`Analisando arquivo: ${file}`);

                // Implementar retry com exponential backoff
                const maxRetries = 3;
                let retryCount = 0;
                let success = false;

                while (!success && retryCount < maxRetries) {
                    try {                        // Construir o conteúdo do prompt do sistema
                        let systemContent = "Você é um especialista em revisão de código. Analise o código a seguir e identifique problemas de segurança, performance, boas práticas e manutenibilidade. Formate a saída em JSON com os campos 'line', 'message' e 'severity' (high, medium, low).";
                        
                        // Adicionar prompts adicionais, se existirem
                        if (additionalPrompts && additionalPrompts.length > 0) {
                            const validPrompts = additionalPrompts.filter(prompt => prompt && prompt.trim() !== '');
                            if (validPrompts.length > 0) {
                                systemContent += "\n\nConsiderações adicionais:\n" + validPrompts.map(p => `- ${p.trim()}`).join('\n');
                                console.log(`Adicionando ${validPrompts.length} prompts adicionais à análise de ${file}`);
                            }
                        }

                        // Enviar para análise
                        const response = await openai.chat.completions.create({
                            model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "gpt-4",
                            messages: [
                                { 
                                    role: "system", 
                                    content: systemContent
                                },
                                { 
                                    role: "user", 
                                    content: `Arquivo: ${file}\n\nConteúdo:\n${truncatedContent}` 
                                }
                            ],
                            temperature: 0.1,
                            max_tokens: 1500,
                        });

                        // Processar a resposta
                        if (response.choices[0]?.message?.content) {
                            // Extrair resultados do formato JSON
                            try {
                                const analysisContent = response.choices[0].message.content;
                                const analysisResults = JSON.parse(analysisContent);
                                
                                if (Array.isArray(analysisResults)) {
                                    // Adicionar cada problema encontrado à lista de issues
                                    analysisResults.forEach(issue => {
                                        issues.push({
                                            file: file,
                                            line: issue.line || 0,
                                            message: `[${issue.severity || 'info'}] ${issue.message}`
                                        });
                                    });
                                }
                            } catch (error: unknown) {
                                // Se falhar ao processar como JSON, tentar extrair informações do texto
                                const parseError = error as Error;
                                console.warn(`Falha ao processar resposta como JSON: ${parseError.message}`);
                                issues.push({
                                    file: file,
                                    line: 1,
                                    message: `Não foi possível analisar este arquivo em formato estruturado. Resultado raw: ${response.choices[0]?.message?.content?.substring(0, 200) || ''}...`
                                });
                            }
                        }
                        
                        success = true;
                    } catch (apiError: any) {
                        retryCount++;
                        
                        // Implementar backoff exponencial
                        const delay = Math.pow(2, retryCount) * 1000;
                        console.warn(`Tentativa ${retryCount}/${maxRetries} falhou. Tentando novamente em ${delay}ms. Erro: ${apiError.message}`);
                        
                        // Esperar antes de tentar novamente
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }
                }

                if (!success) {
                    issues.push({
                        file: file,
                        line: 0,
                        message: `Não foi possível analisar este arquivo após ${maxRetries} tentativas.`
                    });
                }
            } catch (fileError: any) {
                console.error(`Erro ao processar arquivo ${file}: ${fileError.message}`);
                issues.push({
                    file: file,
                    line: 0,
                    message: `Erro ao processar arquivo: ${fileError.message}`
                });
            }
        }
    } catch (error: any) {
        console.error(`Erro na análise de código: ${error.message}`);
        issues.push({
            file: "global",
            line: 0,
            message: `Erro global na análise: ${error.message}`
        });
    }
    
    return issues;
}

/**
 * Inicializa e configura o acesso ao repositório do Azure DevOps
 * @returns RepositoryAzureDevops configurado ou null em caso de erro
 */
async function initializeRepository(): Promise<RepositoryAzureDevops | null> {
    try {
        // Recuperar informações do ambiente para configuração do repositório
        const organization = tl.getVariable('System.TeamFoundationCollectionUri')?.split('/').pop() || '';
        const project = tl.getVariable('System.TeamProject') || '';
        const repositoryId = tl.getVariable('Build.Repository.ID') || '';
        
        // O token de acesso precisa ter permissão para usar a API do Azure DevOps
        const accessToken = tl.getVariable('System.AccessToken') || tl.getInput('azure_devops_token', false) || '';
        
        // Verificar se o PR ID está disponível (usado em builds de PR)
        const pullRequestIdString = tl.getVariable('System.PullRequest.PullRequestId');
        const pullRequestId = pullRequestIdString ? parseInt(pullRequestIdString, 10) : undefined;
        
        // Verificar se temos todas as informações necessárias
        if (!organization || !project || !repositoryId || !accessToken) {
            console.warn('Informações insuficientes para configurar o acesso ao repositório:');
            console.warn(`Organization: ${organization ? 'OK' : 'Faltando'}`);
            console.warn(`Project: ${project ? 'OK' : 'Faltando'}`);
            console.warn(`Repository ID: ${repositoryId ? 'OK' : 'Faltando'}`);
            console.warn(`Access Token: ${accessToken ? 'OK' : 'Faltando'}`);
            return null;
        }
        
        console.log('Configurando acesso ao repositório Azure DevOps...');
        console.log(`Organization: ${organization}`);
        console.log(`Project: ${project}`);
        console.log(`Repository ID: ${repositoryId}`);
        console.log(`Pull Request ID: ${pullRequestId || 'N/A'}`);
        
        // Inicializar o repositório
        const repo = new RepositoryAzureDevops(
            organization,
            project,
            repositoryId,
            accessToken,
            pullRequestId
        );
        
        // Conectar à API
        await repo.initialize();
        console.log('Repositório Azure DevOps inicializado com sucesso!');
        
        return repo;
    } catch (error: any) {
        console.error(`Erro ao inicializar repositório: ${error.message}`);
        return null;
    }
}

run();
