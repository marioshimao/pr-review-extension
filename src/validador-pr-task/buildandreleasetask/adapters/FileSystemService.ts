import * as fs from 'fs';
import * as path from 'path';
import * as tl from 'azure-pipelines-task-lib/task';
import { IFileService } from '../interfaces/IFileService';
import { ILogService } from '../interfaces/ILogService';

/**
 * Implementação de IFileService usando API do sistema de arquivos
 */
export class FileSystemService implements IFileService {
    private logger: ILogService;
    
    /**
     * Construtor para a classe FileSystemService
     * @param logger Serviço de log
     */
    constructor(logger: ILogService) {
        this.logger = logger;
    }

    /**
     * Encontra arquivos em um diretório usando padrões glob
     * @param rootPath Diretório raiz para busca
     * @param excludePatterns Padrões glob para exclusão
     * @returns Promise com array de caminhos completos dos arquivos encontrados
     */
    public async findFiles(rootPath: string, excludePatterns: string[]): Promise<string[]> {
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
            
            this.logger.log(`Buscando arquivos: ${includePattern}`);
            this.logger.log(`Excluindo padrões: ${normalizedExcludePatterns.join(', ')}`);
            
            // Buscar arquivos baseados nos padrões
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
                                this.logger.log(`Excluindo arquivo por padrão: ${file} (padrão: ${pattern})`);
                                return false;
                            }
                        }
                    }
                    
                    return true;
                } catch (error) {
                    return false;
                }
            });
            
            this.logger.log(`Encontrados ${files.length} arquivos após aplicar filtros.`);
            return files;
        } catch (error: any) {
            this.logger.warn(`Erro ao buscar arquivos: ${error.message}`);
            return [];
        }
    }
    
    /**
     * Verifica se um arquivo existe
     * @param filePath Caminho do arquivo
     * @returns Promise que resolve para true se o arquivo existe, false caso contrário
     */
    public async fileExists(filePath: string): Promise<boolean> {
        try {
            return fs.existsSync(filePath);
        } catch (error) {
            return false;
        }
    }
    
    /**
     * Lê o conteúdo de um arquivo
     * @param filePath Caminho do arquivo
     * @returns Promise com o conteúdo do arquivo como string
     */
    public async readFile(filePath: string): Promise<string> {
        return fs.readFileSync(filePath, 'utf8');
    }
    
    /**
     * Escreve conteúdo em um arquivo, criando o diretório pai se necessário
     * @param filePath Caminho do arquivo
     * @param content Conteúdo a ser escrito
     * @returns Promise que resolve quando a operação for concluída
     */
    public async writeFile(filePath: string, content: string): Promise<void> {
        const folder = path.dirname(filePath);
        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder, { recursive: true });
        }
        fs.writeFileSync(filePath, content);
    }
    
    /**
     * Lê o arquivo de prompt adicional para revisão de PR
     * @param repositoryPath Caminho base do repositório
     * @returns Promise com o conteúdo do arquivo como string ou null se o arquivo não existir
     */    
    public async readAdditionalPromptFile(repositoryPath: string): Promise<string | null> {
        try {
            const promptFilePath = path.join(repositoryPath, '.agl', 'pr-review.prompt.md');
            
            if (!fs.existsSync(promptFilePath)) {
                this.logger.log(`Arquivo de prompt adicional não encontrado em: ${promptFilePath}`);
                return null;
            }
            
            this.logger.log(`Lendo arquivo de prompt adicional de: ${promptFilePath}`);
            const content = fs.readFileSync(promptFilePath, 'utf8');
            
            if (!content || content.trim() === '') {
                this.logger.warn('Arquivo de prompt adicional está vazio');
                return null;
            }
            
            return content;
        } catch (error: any) {
            this.logger.warn(`Erro ao ler arquivo de prompt adicional: ${error.message}`);
            return null;
        }
    }
}
