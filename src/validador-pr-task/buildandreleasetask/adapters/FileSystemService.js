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
exports.FileSystemService = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const tl = __importStar(require("azure-pipelines-task-lib/task"));
/**
 * Implementação de IFileService usando API do sistema de arquivos
 */
class FileSystemService {
    logger;
    /**
     * Construtor para a classe FileSystemService
     * @param logger Serviço de log
     */
    constructor(logger) {
        this.logger = logger;
    }
    /**
     * Encontra arquivos em um diretório usando padrões glob
     * @param rootPath Diretório raiz para busca
     * @param excludePatterns Padrões glob para exclusão
     * @returns Promise com array de caminhos completos dos arquivos encontrados
     */
    async findFiles(rootPath, excludePatterns) {
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
            const matchedFiles = tl.findMatch(rootPath, [includePattern], {
                followSpecifiedSymbolicLink: true,
                followSymbolicLinks: true,
                allowBrokenSymbolicLinks: false
            });
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
                }
                catch (error) {
                    return false;
                }
            });
            this.logger.log(`Encontrados ${files.length} arquivos após aplicar filtros.`);
            return files;
        }
        catch (error) {
            this.logger.warn(`Erro ao buscar arquivos: ${error.message}`);
            return [];
        }
    }
    /**
     * Verifica se um arquivo existe
     * @param filePath Caminho do arquivo
     * @returns Promise que resolve para true se o arquivo existe, false caso contrário
     */
    async fileExists(filePath) {
        try {
            return fs.existsSync(filePath);
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Lê o conteúdo de um arquivo
     * @param filePath Caminho do arquivo
     * @returns Promise com o conteúdo do arquivo como string
     */
    async readFile(filePath) {
        return fs.readFileSync(filePath, 'utf8');
    }
    /**
     * Escreve conteúdo em um arquivo, criando o diretório pai se necessário
     * @param filePath Caminho do arquivo
     * @param content Conteúdo a ser escrito
     * @returns Promise que resolve quando a operação for concluída
     */
    async writeFile(filePath, content) {
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
    async readAdditionalPromptFile(repositoryPath) {
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
        }
        catch (error) {
            this.logger.warn(`Erro ao ler arquivo de prompt adicional: ${error.message}`);
            return null;
        }
    }
}
exports.FileSystemService = FileSystemService;
