export interface Template {
    name: string;
    title: string;
    description: string;
    category: string;
    industry: string;
    thumbnail: string;
    video?: string;
    services: string[];
    languages: string[];
    frameworks: string[];
    tags: string[];
    authors: Author[];
    version: string;
    lastCommitDate: string;
    repoUrl: string;
}

export interface Author {
    name: string;
    githubHandle: string;
}

export interface Resource {
    name: string;
    description: string;
    url: string;
    icon: string;
}

export interface TemplatesConfig {
    templates: Template[];
}

export enum SortOrder {
    nameAsc = 'name-asc',
    nameDesc = 'name-desc',
    dateNewest = 'date-newest',
    dateOldest = 'date-oldest'
}
