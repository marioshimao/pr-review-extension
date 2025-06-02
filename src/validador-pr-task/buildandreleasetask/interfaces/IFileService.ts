/**
 * Interface para operações de manipulação de arquivos do sistema
 * Esta interface abstrai o acesso ao sistema de arquivos para permitir testabilidade
 */
export interface IFileService {
    /**
     * Encontra arquivos em um diretório usando padrões glob
     * @param rootPath Diretório raiz para busca
     * @param excludePatterns Padrões glob para exclusão
     * @returns Promise com array de caminhos completos dos arquivos encontrados
     */
    findFiles(rootPath: string, excludePatterns: string[]): Promise<string[]>;
    
    /**
     * Verifica se um arquivo existe
     * @param filePath Caminho do arquivo
     * @returns Promise que resolve para true se o arquivo existe, false caso contrário
     */
    fileExists(filePath: string): Promise<boolean>;
    
    /**
     * Lê o conteúdo de um arquivo
     * @param filePath Caminho do arquivo
     * @returns Promise com o conteúdo do arquivo como string
     */
    readFile(filePath: string): Promise<string>;
    
    /**
     * Escreve conteúdo em um arquivo, criando o diretório pai se necessário
     * @param filePath Caminho do arquivo
     * @param content Conteúdo a ser escrito
     * @returns Promise que resolve quando a operação for concluída
     */
    writeFile(filePath: string, content: string): Promise<void>;
}
