// Shared record contracts mirror schemas/. Runtime validators remain authoritative.
// External JSON must enter through the named parsers, never a type assertion at a consumer.

export type ProfileRecord = {
  $schema?: string;
  schemaVersion: 1;
  name: string;
  headline: string;
  location: string;
  intro: string;
  bio: Array<string>;
  links: Array<{
    label: string;
    href: string;
  }>;
  principles: Array<{
    title: string;
    description: string;
  }>;
  localizations?: LocalizationsProfile;
  updatedAt: string;
};

export type EntryRecord = {
  $schema?: string;
  schemaVersion: 1;
  recordType: "entry";
  id: string;
  slug: string;
  title: string;
  kind: "architecture" | "improvement" | "investigation" | "launch" | "leadership" | "learning" | "project" | "reliability" | "research";
  significance?: "activity" | "notable" | "milestone" | "achievement";
  activityTypes?: Array<"build" | "design" | "architecture" | "implementation" | "investigation" | "research" | "migration" | "optimization" | "performance" | "testing" | "reliability" | "security" | "accessibility" | "infrastructure" | "automation" | "integration" | "maintenance" | "refactoring" | "leadership" | "mentoring" | "planning" | "release" | "product" | "developer-experience" | "documentation" | "observability">;
  status: "active" | "completed" | "archived";
  period: {
    start: string;
    end: string | null;
    label: string;
  };
  summary: string;
  context?: string;
  contributions: Array<string>;
  outcomes: Array<{
    text: string;
    evidenceLevel: "observed" | "measured" | "self-reported" | "public";
  }>;
  areas: Array<string>;
  technologies: Array<string>;
  featured: boolean;
  publication: {
    status: "candidate" | "approved";
    sanitized: boolean;
    reviewedAt: string | null;
    approvedBy: string | null;
  };
  links: Array<{
    label: string;
    href: string;
  }>;
  localizations?: LocalizationsEntry;
};

export type ProjectRecord = {
  $schema?: string;
  schemaVersion: 1;
  recordType: "project";
  id: string;
  slug: string;
  name: string;
  kind: "application" | "open-source" | "platform" | "product" | "research" | "tool";
  status: "active" | "completed" | "archived" | "paused";
  workContext?: "professional" | "independent";
  ownership?: "end-to-end" | "shared";
  summary: string;
  description: string;
  areas: Array<string>;
  technologies: Array<string>;
  relatedEntries: Array<string>;
  featured: boolean;
  presentation?: PresentationPresentation;
  activityMix?: PresentationActivityMix;
  publication: {
    status: "candidate" | "approved";
    sanitized: boolean;
    reviewedAt: string | null;
    approvedBy: string | null;
  };
  links: Array<{
    label: string;
    href: string;
  }>;
  localizations?: LocalizationsProject;
};

export type ResumeRecord = {
  $schema?: string;
  schemaVersion: 1;
  recordType: "resume";
  id: "resume";
  slug: "resume";
  experienceStart: string;
  summary: string;
  highlights: Array<ResumeRecordOutcome>;
  skills: Array<string>;
  activityMix?: PresentationActivityMix;
  experiences: Array<ResumeRecordExperience>;
  education: Array<ResumeRecordEducation>;
  recommendations?: RecommendationRecord[];
  contact?: ContactRecord;
  publication: ResumeRecordPublication;
  localizations?: LocalizationsResume;
};

export type ResumeRecordPeriod = {
  start: string;
  end: string | null;
  label: string;
};

export interface RecommendationRecord {
  id: string;
  name: string;
  relationship: string;
  quote: string;
  profileUrl: string;
  sourceUrl: string;
  portrait?: {
    src: string;
    width: number;
    height: number;
    approval: { approvedBy: 'owner'; reviewedAt: string };
  };
}

export interface ContactRecord {
  email?: string;
  phone?: string;
  whatsapp?: boolean;
  links: Array<{ label: string; href: string }>;
}

export type LocalizedRecommendation = Pick<RecommendationRecord, 'id' | 'quote' | 'relationship'>;

export type ResumeRecordOutcome = {
  text: string;
  evidenceLevel: "observed" | "measured" | "self-reported" | "public";
};

export type ResumeRecordExperience = {
  id: string;
  organization: string;
  role: string;
  engagement: "full-time" | "contract" | "independent";
  location: string;
  domain: string;
  period: ResumeRecordPeriod;
  summary: string;
  contributions: Array<string>;
  outcomes: Array<ResumeRecordOutcome>;
  technologies: Array<string>;
  relatedProjects: Array<string>;
};

export type ResumeRecordEducation = {
  id: string;
  credential: string;
  institution: string;
  period: ResumeRecordPeriod;
};

export type ResumeRecordPublication = {
  status: "candidate" | "approved";
  sanitized: boolean;
  reviewedAt: string | null;
  approvedBy: string | null;
};

export type TaxonomyRecord = {
  $schema?: string;
  schemaVersion: 1;
  areas: Array<{
    slug: string;
    label: string;
    description: string;
    order: number;
  }>;
  kinds: Array<{
    value: string;
    label: string;
    description: string;
  }>;
  localizations?: LocalizationsTaxonomy;
};

export type PrivateActivity = {
  $schema?: string;
  schemaVersion: 1;
  recordType: "activity";
  id: string;
  projectId: string;
  workstreamId: string | null;
  title: string;
  summary: string;
  occurredAt: string;
  types: Array<"build" | "design" | "architecture" | "implementation" | "investigation" | "research" | "migration" | "optimization" | "performance" | "testing" | "reliability" | "security" | "accessibility" | "infrastructure" | "automation" | "integration" | "maintenance" | "refactoring" | "leadership" | "mentoring" | "planning" | "release" | "product" | "developer-experience" | "documentation" | "observability">;
  domains: Array<"frontend" | "backend" | "devops" | "infrastructure" | "data" | "ai-ml" | "mobile" | "desktop" | "embedded" | "quality-engineering" | "security" | "developer-experience" | "product-design" | "other">;
  significance: "activity" | "notable" | "milestone" | "achievement";
  progression: "started" | "continued" | "expanded" | "completed" | "revisited";
  attribution: {
    scope: "implemented" | "contributed" | "designed" | "led" | "owned" | "investigated";
    confidence: "low" | "medium" | "high";
    notes: string;
  };
  evidence: Array<{
    id: string;
    type: "scan" | "commit" | "file" | "diff" | "pull-request" | "branch" | "test" | "configuration" | "architecture" | "document" | "dependency" | "release" | "deployment" | "issue" | "user-context" | "manual-note" | "public-source";
    reference: string;
    supports: string;
    provenance: "observed" | "provided" | "derived" | "inferred" | "unverified";
  }>;
  outcomes: Array<{
    text: string;
    status: "needs-confirmation" | "confirmed" | "rejected";
    evidenceLevel: "unknown" | "observed" | "measured" | "self-reported" | "public";
    notes: string;
  }>;
  areas: Array<string>;
  technologies: Array<string>;
  sensitivity: {
    level: "low" | "medium" | "high";
    blockedTerms: Array<string>;
    notes: string;
  };
  sourceScans: Array<string>;
  updatedAt: string;
};

export type PrivateWorkstream = {
  $schema?: string;
  schemaVersion: 1;
  recordType: "workstream";
  id: string;
  projectId: string;
  title: string;
  summary: string;
  context: {
    internal: string;
    public: string | null;
  };
  period: {
    start: string;
    end: string | null;
    label: string;
  };
  status: "detected" | "active" | "completed" | "ready-for-sanitization" | "archived";
  attribution: {
    scope: "implemented" | "contributed" | "designed" | "led" | "owned" | "investigated";
    confidence: "low" | "medium" | "high";
    notes: string;
  };
  activityIds: Array<string>;
  contributions: Array<string>;
  potentialOutcomes: Array<{
    text: string;
    status: "needs-confirmation" | "confirmed" | "rejected";
    evidenceLevel: "unknown" | "observed" | "measured" | "self-reported" | "public";
    notes: string;
  }>;
  milestones: Array<{
    id: string;
    date: string;
    title: string;
    summary: string;
    activityIds: Array<string>;
    evidenceRefs: Array<string>;
    provenance: "observed" | "provided" | "derived";
  }>;
  achievements: Array<{
    id: string;
    date: string;
    statement: string;
    evidenceLevel: "observed" | "measured" | "self-reported" | "public";
    activityIds: Array<string>;
    evidenceRefs: Array<string>;
    provenance: "observed" | "provided" | "derived";
  }>;
  narrativeSignals: Array<{
    label: string;
    strength: "emerging" | "supported";
    activityIds: Array<string>;
  }>;
  enrichmentQuestions: Array<{
    question: string;
    reason: "impact" | "ownership" | "scale" | "adoption" | "public-safety" | "accuracy" | "resume-strength";
    status: "open" | "answered" | "dismissed";
  }>;
  areas: Array<string>;
  technologies: Array<string>;
  sensitivity: {
    level: "low" | "medium" | "high";
    blockedTerms: Array<string>;
    notes: string;
  };
  sourceScans: Array<string>;
  updatedAt: string;
};

export type PrivateInitiative = {
  $schema?: string;
  schemaVersion: 1;
  id: string;
  projectId: string;
  title: string;
  period: {
    start: string;
    end: string | null;
    label: string;
  };
  status: "detected" | "active" | "completed" | "ready-for-sanitization" | "archived";
  attribution: {
    scope: "implemented" | "contributed" | "designed" | "led" | "owned" | "investigated";
    confidence: "low" | "medium" | "high";
    notes: string;
  };
  evidence: Array<{
    type: "commit" | "file" | "test" | "document" | "manual-note" | "public-source";
    reference: string;
    supports: string;
  }>;
  contributions: Array<string>;
  potentialOutcomes: Array<{
    text: string;
    status: "needs-confirmation" | "confirmed" | "rejected";
    evidenceLevel: "unknown" | "observed" | "measured" | "self-reported" | "public";
    notes: string;
  }>;
  areas: Array<string>;
  technologies: Array<string>;
  sensitivity: {
    level: "low" | "medium" | "high";
    blockedTerms: Array<string>;
    notes: string;
  };
  sourceScans: Array<string>;
  updatedAt: string;
};

export type LocalConfig = {
  $schema?: string;
  schemaVersion: 1;
  owner: {
    name: string;
    gitIdentities: Array<{
      name: string;
      emails: Array<string>;
    }>;
  };
  projects: Array<{
    id: string;
    label: string;
    path: string;
    kind: "work" | "personal" | "open-source" | "research";
    visibility: "private" | "public-source";
    contextFile: string;
    scan: {
      since: string;
      maxCommits: number;
      includeUncommitted: boolean;
    };
  }>;
  privacy: {
    blockedTerms: Array<string>;
    blockedPatterns: Array<string>;
  };
};

export type LocalizationsTranslatedTextList = Array<string>;

export type LocalizationsLocalizedPrinciple = {
  title: string;
  description: string;
};

export type LocalizationsProfile = {
  "pt-BR"?: {
    headline: string;
    location: string;
    intro: string;
    bio: LocalizationsTranslatedTextList;
    links: LocalizationsTranslatedTextList;
    principles: Array<LocalizationsLocalizedPrinciple>;
  };
};

export type LocalizationsEntry = {
  "pt-BR"?: {
    title: string;
    periodLabel: string;
    summary: string;
    context?: string;
    contributions: LocalizationsTranslatedTextList;
    outcomes: LocalizationsTranslatedTextList;
    links: LocalizationsTranslatedTextList;
  };
};

export type LocalizationsProject = {
  "pt-BR"?: {
    name: string;
    summary: string;
    description: string;
    previewAlt?: string;
    gallery?: Array<{ alt: string; caption: string }>;
    links: LocalizationsTranslatedTextList;
  };
};

export type LocalizationsLocalizedExperience = {
  id: string;
  role: string;
  location: string;
  domain: string;
  periodLabel: string;
  summary: string;
  contributions: LocalizationsTranslatedTextList;
  outcomes: LocalizationsTranslatedTextList;
};

export type LocalizationsLocalizedEducation = {
  id: string;
  credential: string;
  institution: string;
  periodLabel: string;
};

export type LocalizationsResume = {
  "pt-BR"?: {
    summary: string;
    highlights: LocalizationsTranslatedTextList;
    skills: LocalizationsTranslatedTextList;
    experiences: Array<LocalizationsLocalizedExperience>;
    education: Array<LocalizationsLocalizedEducation>;
    recommendations?: LocalizedRecommendation[];
  };
};

export type LocalizationsLocalizedArea = {
  slug: string;
  label: string;
  description: string;
};

export type LocalizationsLocalizedKind = {
  value: string;
  label: string;
  description: string;
};

export type LocalizationsTaxonomy = {
  "pt-BR"?: {
    areas: Array<LocalizationsLocalizedArea>;
    kinds: Array<LocalizationsLocalizedKind>;
  };
};

export type PresentationPresentation = { preview: ProjectVisual; gallery?: ProjectGalleryImage[] };

export type PresentationActivityMix = {
  items: Array<{
    domain: "frontend" | "backend" | "devops" | "infrastructure" | "data" | "ai-ml" | "mobile" | "desktop" | "embedded" | "quality-engineering" | "security" | "developer-experience" | "product-design" | "other";
    percentage: number;
  }>;
} & (
  | { basis: "recorded-activities"; activityCount: number }
  | { basis: "owner-estimate"; activityCount?: never }
);

export type LocaleCode = 'en' | 'pt-BR';
export type Period = EntryRecord['period'];
export type Outcome = EntryRecord['outcomes'][number];
export type PublicLink = EntryRecord['links'][number];
export type Publication = EntryRecord['publication'];
export type ActivityDomain = PrivateActivity['domains'][number];
export type ActivityMix = PresentationActivityMix;
export type ProjectVisual = { kind: 'diagram'; alt: string } | {
  kind: 'image'; src: string; alt: string; width: number; height: number;
  approval: { approvedBy: 'owner'; reviewedAt: string };
};
export type Project = ProjectRecord;
export type ProjectGalleryImage = Extract<ProjectVisual, { kind: 'image' }> & {
  caption: string;
  source: ReviewImage['source'];
};
// Local review media is deliberately not part of ProjectRecord or its public schema.
export interface ReviewImage {
  src: string;
  alt: string;
  caption: string;
  width: number;
  height: number;
  source: { kind: 'web'; url: string | null; capturedAt: string }
    | { kind: 'owner-provided'; providedAt: string }
    | { kind: 'local-capture'; capturedAt: string }
    | { kind: 'project-asset'; collectedAt: string };
  localizations?: { 'pt-BR': { alt: string; caption: string } };
}
export interface ReviewAsset { src: string; bytes: Uint8Array; }
export type Profile = ProfileRecord;
export type Entry = EntryRecord & { significance: NonNullable<EntryRecord['significance']>; activityTypes: string[] };
export type Experience = ResumeRecord['experiences'][number];
export type Resume = Omit<ResumeRecord, 'recommendations'> & {
  experienceYears: number | null;
  recommendations?: Array<RecommendationRecord & { translated?: true }>;
};
export type PublicRecord = EntryRecord | ProjectRecord | ResumeRecord;
export type ConfiguredProject = LocalConfig['projects'][number];
export interface FileRecord<T> { file: string; value: T; }
export interface PublicContent {
  profile: ProfileRecord;
  taxonomy: TaxonomyRecord;
  resume: ResumeRecord | null;
  entries: FileRecord<EntryRecord>[];
  projects: FileRecord<ProjectRecord>[];
}
export type DatasetInput = Omit<PublicContent, 'entries' | 'projects'> & {
  entries: Array<FileRecord<EntryRecord> | EntryRecord>;
  projects: Array<FileRecord<ProjectRecord> | ProjectRecord>;
};
export type DatasetArea = TaxonomyRecord['areas'][number] & {
  count: number; entryCount: number; projectCount: number; entryIds: string[]; projectIds: string[];
};
export interface CareerDataset {
  schemaVersion: number;
  preview?: true;
  reviewMedia?: Record<string, ReviewImage[]>;
  reviewPortraits?: Record<string, ReviewImage>;
  updatedAt: string;
  profile: Profile;
  resume: Resume | null;
  entries: Entry[];
  projects: Project[];
  activityMix?: ActivityMix;
  locale?: LocaleCode;
  availableLocales?: LocaleCode[];
  technologies: Array<{ label: string; count: number }>;
  stats: { entries: number; projects: number; activeAreas: number; featuredEntries: number;
    activeProjects: number; years: number; experienceYears: number | null; experiences: number };
  taxonomy: Omit<TaxonomyRecord, 'schemaVersion' | '$schema' | 'areas' | 'kinds'> & {
    areas: DatasetArea[]; kinds: Array<TaxonomyRecord['kinds'][number] & { count: number }>;
  };
}
