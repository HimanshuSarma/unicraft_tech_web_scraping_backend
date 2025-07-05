export declare function extractCompanyDetails(rawText: string, companies: string[]): Array<{
    [company: string]: {
        techStack: string[];
        contactInfo: {
            phones: string[];
            emails: string[];
        };
    };
}>;
