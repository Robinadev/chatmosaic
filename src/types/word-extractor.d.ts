declare module "word-extractor" {
  interface ExtractedWordDocument {
    getBody(): string;
  }

  class WordExtractor {
    extract(source: Buffer | Uint8Array): Promise<ExtractedWordDocument>;
  }

  export = WordExtractor;
}
