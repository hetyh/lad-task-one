declare function pdfCreate(sitesWordsArray: {
    siteName: string;
    wordsTop: string[];
}[]): Promise<string>;
export default pdfCreate;
