import type { LocaleCode, CareerDataset, Entry, Project, Resume, Outcome, PublicLink } from './model.ts';
export const DEFAULT_LOCALE = 'en';

export const SUPPORTED_LOCALES = Object.freeze([
  Object.freeze({ code: 'en', ogLocale: 'en_US', routePrefix: '', shortLabel: 'EN', languageName: 'English' }),
  Object.freeze({ code: 'pt-BR', ogLocale: 'pt_BR', routePrefix: 'pt-br', shortLabel: 'PT', languageName: 'Português' })
] as const);

const COPY = {
  en: {
    portfolioTitle: 'Software Engineering Portfolio',
    engineeringAreas: 'Engineering areas',
    technologies: 'Technologies',
    topics: 'Topics',
    projectAreas: 'Project areas',
    active: 'Active',
    relatedAchievement: 'Related achievement',
    significance: 'Significance',
    recordType: 'Record type',
    activityTypes: 'Activity types',
    results: 'Results',
    keyWork: 'Key work',
    fullProject: 'Full project',
    selectedOutcomes: 'Selected outcomes',
    outcomeCount: (count: number) => `${count} ${count === 1 ? 'outcome' : 'outcomes'}`,
    yearCount: (count: number) => `${count}+ years`,
    roleCount: (count: number) => `${count} ${count === 1 ? 'role' : 'roles'}`,
    experience: 'Experience',
    relatedProjects: 'Related projects',
    background: 'Background',
    coreSkills: 'Core skills',
    education: 'Education',
    primaryNavigation: 'Primary navigation',
    languageNavigation: 'Language',
    navigation: { experience: 'Experience', projects: 'Projects', about: 'About' },
    skipToContent: 'Skip to content',
    homeLabel: (name: string) => `${name} home`,
    reviewBannerLabel: 'Private review preview',
    reviewBannerTitle: 'Draft portfolio preview',
    reviewBannerText: 'Not published. These records still require your explicit approval.',
    publicJson: 'Public JSON',
    previewJson: 'Preview JSON',
    updated: 'Updated',
    rssTitle: (name: string) => `${name} engineering portfolio`,
    jsonTitle: (name: string) => `${name} portfolio data`,
    homeEyebrowFallback: 'Senior software engineer',
    homeTitle: 'I build complex web products from interface to infrastructure.',
    selectedWork: 'Selected work',
    homeSummaryFallback: 'Senior full-stack engineering across products, platforms, and developer systems.',
    viewSelectedWork: 'Explore selected work',
    viewAllProjects: 'View all projects',
    viewTimeline: 'View timeline',
    selectedWorkIntro: 'Products and platforms where architecture, product thinking, and hands-on delivery meet.',
    projects: 'Projects',
    selectedCount: (count: number) => `${count} selected`,
    noFeaturedProjects: 'No featured projects yet.',
    chronologicalRecord: 'Chronological record',
    timeline: 'Timeline',
    timelineIntro: 'Meaningful activity and workstream progression, organized chronologically. Commits and tickets remain private supporting evidence.',
    timelineFilters: 'Timeline filters',
    searchRecord: 'Search the record',
    searchPlaceholder: 'Architecture, authentication, Node.js…',
    filterByType: 'Filter by type',
    filterBySignificance: 'Filter by significance',
    filterByActivityType: 'Filter by activity type',
    all: 'All',
    entryCount: (count: number) => `${count} ${count === 1 ? 'entry' : 'entries'}`,
    noFilterResults: 'No entries match the current filters.',
    timelineDescription: (name: string) => `A chronological record of ${name}'s engineering activity, workstream progression, milestones, and outcomes.`,
    engineeringCoverage: 'Engineering coverage',
    areas: 'Areas',
    areasIntro: 'Browse the record by the kind of engineering problem involved, rather than by job title or repository.',
    recordCount: (count: number) => `${count} ${count === 1 ? 'record' : 'records'}`,
    areasDescription: (name: string) => `Engineering areas represented in ${name}'s career ledger.`,
    breadcrumb: 'Breadcrumb',
    engineeringArea: 'Engineering area',
    entries: 'Entries',
    noAreaEntries: 'No published entries in this area yet.',
    productsAndPlatforms: 'Products and platforms',
    projectsIntro: 'Coherent bodies of work that connect multiple engineering workstreams over time.',
    noPublicProjects: 'No public projects yet.',
    projectsDescription: (name: string) => `Products, platforms, tools, and research projects built by ${name}.`,
    aboutProject: 'About the project',
    relatedRecord: 'Related record',
    status: 'Status',
    context: 'Context',
    contributions: 'Contributions',
    outcomes: 'Outcomes',
    candidateNote: 'Candidate note',
    publicationNote: 'Publication note',
    candidateNoteText: 'This candidate has been sanitized for review but is not public. Raw evidence remains private, and publication still requires owner approval.',
    publicationNoteText: 'This record was selected and sanitized before publication. Raw repository evidence and confidential project details remain private.',
    aboutEyebrow: 'About',
    aboutTitle: 'Full-stack engineering with product depth.',
    aboutIntro: 'I work across frontend, backend, architecture, and delivery to turn complex requirements into products people can use and teams can extend.',
    basedIn: 'Based in',
    coreFocus: 'Core focus',
    howIContribute: 'How I contribute',
    strengthsTitle: 'From product questions to durable systems.',
    strengthsIntro: 'My strongest work sits at the intersection of product judgment, technical architecture, and hands-on implementation.',
    aboutCtaTitle: 'See the systems behind the experience.',
    aboutCtaText: 'Explore selected products and the chronological record of the engineering work behind them.',
    aboutDescription: (name: string) => `About ${name}, a senior full-stack engineer working across products, platforms, and delivery systems.`,
    notFoundTitle: 'This record does not exist.',
    notFoundText: 'The page may have moved, or the entry may never have been published.',
    returnHighlights: 'Return to highlights',
    notFound: 'Not found',
    notFoundDescription: 'The requested Career Ledger page was not found.',
    statuses: { active: 'Active', completed: 'Completed', archived: 'Archived', paused: 'Paused' },
    significances: { activity: 'Activity', notable: 'Notable', milestone: 'Milestone', achievement: 'Achievement' },
    activityTypeLabels: {
      build: 'Build',
      design: 'Design',
      architecture: 'Architecture',
      implementation: 'Implementation',
      investigation: 'Investigation',
      research: 'Research',
      migration: 'Migration',
      optimization: 'Optimization',
      performance: 'Performance',
      testing: 'Testing',
      reliability: 'Reliability',
      security: 'Security',
      accessibility: 'Accessibility',
      infrastructure: 'Infrastructure',
      automation: 'Automation',
      integration: 'Integration',
      maintenance: 'Maintenance',
      refactoring: 'Refactoring',
      leadership: 'Leadership',
      mentoring: 'Mentoring',
      planning: 'Planning',
      release: 'Release',
      product: 'Product',
      'developer-experience': 'Developer experience',
      documentation: 'Documentation',
      observability: 'Observability'
    },
    projectKinds: {
      application: 'Application',
      'open-source': 'Open source',
      platform: 'Platform',
      product: 'Product',
      research: 'Research',
      tool: 'Tool'
    }
  },
  'pt-BR': {
    portfolioTitle: 'Portfólio de Engenharia de Software',
    engineeringAreas: 'Áreas de engenharia',
    technologies: 'Tecnologias',
    topics: 'Tópicos',
    projectAreas: 'Áreas do projeto',
    active: 'Ativo',
    relatedAchievement: 'Realização relacionada',
    significance: 'Significância',
    recordType: 'Tipo de registro',
    activityTypes: 'Tipos de atividade',
    results: 'Resultados',
    keyWork: 'Principais contribuições',
    fullProject: 'Ver projeto completo',
    selectedOutcomes: 'Resultados selecionados',
    outcomeCount: (count: number) => `${count} ${count === 1 ? 'resultado' : 'resultados'}`,
    yearCount: (count: number) => `${count}+ anos`,
    roleCount: (count: number) => `${count} ${count === 1 ? 'experiência' : 'experiências'}`,
    experience: 'Experiência',
    relatedProjects: 'Projetos relacionados',
    background: 'Formação e competências',
    coreSkills: 'Competências principais',
    education: 'Formação acadêmica',
    primaryNavigation: 'Navegação principal',
    languageNavigation: 'Idioma',
    navigation: { experience: 'Experiência', projects: 'Projetos', about: 'Sobre' },
    skipToContent: 'Ir para o conteúdo',
    homeLabel: (name: string) => `Início — ${name}`,
    reviewBannerLabel: 'Prévia privada para revisão',
    reviewBannerTitle: 'Prévia do portfólio',
    reviewBannerText: 'Ainda não publicado. Estes registros aguardam sua aprovação explícita.',
    publicJson: 'JSON público',
    previewJson: 'JSON da prévia',
    updated: 'Atualizado em',
    rssTitle: (name: string) => `Portfólio de engenharia de ${name}`,
    jsonTitle: (name: string) => `Dados do portfólio de ${name}`,
    homeEyebrowFallback: 'Engenheiro de software sênior',
    homeTitle: 'Construo produtos web complexos, da interface à infraestrutura.',
    selectedWork: 'Trabalhos selecionados',
    homeSummaryFallback: 'Engenharia full-stack sênior aplicada a produtos, plataformas e sistemas para desenvolvedores.',
    viewSelectedWork: 'Ver trabalhos selecionados',
    viewAllProjects: 'Ver todos os projetos',
    viewTimeline: 'Ver linha do tempo',
    selectedWorkIntro: 'Produtos e plataformas onde arquitetura, visão de produto e implementação prática se encontram.',
    projects: 'Projetos',
    selectedCount: (count: number) => `${count} em destaque`,
    noFeaturedProjects: 'Nenhum projeto em destaque ainda.',
    chronologicalRecord: 'Registro cronológico',
    timeline: 'Linha do tempo',
    timelineIntro: 'Atividades relevantes e a evolução de frentes de trabalho, organizadas cronologicamente. Commits e tickets permanecem como evidências privadas.',
    timelineFilters: 'Filtros da linha do tempo',
    searchRecord: 'Buscar no histórico',
    searchPlaceholder: 'Arquitetura, autenticação, Node.js…',
    filterByType: 'Filtrar por tipo',
    filterBySignificance: 'Filtrar por significância',
    filterByActivityType: 'Filtrar por tipo de atividade',
    all: 'Todos',
    entryCount: (count: number) => `${count} ${count === 1 ? 'registro' : 'registros'}`,
    noFilterResults: 'Nenhum registro corresponde aos filtros atuais.',
    timelineDescription: (name: string) => `Registro cronológico das atividades, frentes de trabalho, marcos e resultados de engenharia de ${name}.`,
    engineeringCoverage: 'Atuação em engenharia',
    areas: 'Áreas',
    areasIntro: 'Explore o histórico pelo tipo de problema de engenharia, não pelo cargo ou repositório.',
    recordCount: (count: number) => `${count} ${count === 1 ? 'registro' : 'registros'}`,
    areasDescription: (name: string) => `Áreas de engenharia presentes no portfólio de ${name}.`,
    breadcrumb: 'Navegação estrutural',
    engineeringArea: 'Área de engenharia',
    entries: 'Registros',
    noAreaEntries: 'Ainda não há registros publicados nesta área.',
    productsAndPlatforms: 'Produtos e plataformas',
    projectsIntro: 'Projetos que reúnem diferentes frentes de trabalho de engenharia ao longo do tempo.',
    noPublicProjects: 'Ainda não há projetos públicos.',
    projectsDescription: (name: string) => `Produtos, plataformas, ferramentas e pesquisas desenvolvidos por ${name}.`,
    aboutProject: 'Sobre o projeto',
    relatedRecord: 'Registro relacionado',
    status: 'Status',
    context: 'Contexto',
    contributions: 'Contribuições',
    outcomes: 'Resultados',
    candidateNote: 'Nota da prévia',
    publicationNote: 'Nota de publicação',
    candidateNoteText: 'Este candidato foi preparado para revisão, mas ainda não está público. As evidências brutas permanecem privadas e a publicação exige aprovação do proprietário.',
    publicationNoteText: 'Este registro foi selecionado e revisado antes da publicação. Evidências brutas dos repositórios e detalhes confidenciais permanecem privados.',
    aboutEyebrow: 'Sobre',
    aboutTitle: 'Engenharia full-stack com profundidade de produto.',
    aboutIntro: 'Atuo entre frontend, backend, arquitetura e entrega para transformar requisitos complexos em produtos que as pessoas conseguem usar e as equipes conseguem evoluir.',
    basedIn: 'Localização',
    coreFocus: 'Focos principais',
    howIContribute: 'Como eu contribuo',
    strengthsTitle: 'De questões de produto a sistemas duradouros.',
    strengthsIntro: 'Meu trabalho mais forte está na interseção entre visão de produto, arquitetura técnica e implementação prática.',
    aboutCtaTitle: 'Veja os sistemas por trás da experiência.',
    aboutCtaText: 'Explore os produtos selecionados e o registro cronológico do trabalho de engenharia por trás deles.',
    aboutDescription: (name: string) => `Sobre ${name}, engenheiro full-stack sênior com atuação em produtos, plataformas e sistemas de entrega.`,
    notFoundTitle: 'Este registro não existe.',
    notFoundText: 'A página pode ter mudado ou o registro ainda não foi publicado.',
    returnHighlights: 'Voltar aos destaques',
    notFound: 'Página não encontrada',
    notFoundDescription: 'A página solicitada não foi encontrada.',
    statuses: { active: 'Ativo', completed: 'Concluído', archived: 'Arquivado', paused: 'Pausado' },
    significances: { activity: 'Atividade', notable: 'Destaque', milestone: 'Marco', achievement: 'Conquista' },
    activityTypeLabels: {
      build: 'Construção',
      design: 'Design',
      architecture: 'Arquitetura',
      implementation: 'Implementação',
      investigation: 'Investigação',
      research: 'Pesquisa',
      migration: 'Migração',
      optimization: 'Otimização',
      performance: 'Desempenho',
      testing: 'Testes',
      reliability: 'Confiabilidade',
      security: 'Segurança',
      accessibility: 'Acessibilidade',
      infrastructure: 'Infraestrutura',
      automation: 'Automação',
      integration: 'Integração',
      maintenance: 'Manutenção',
      refactoring: 'Refatoração',
      leadership: 'Liderança',
      mentoring: 'Mentoria',
      planning: 'Planejamento',
      release: 'Lançamento',
      product: 'Produto',
      'developer-experience': 'Experiência de desenvolvimento',
      documentation: 'Documentação',
      observability: 'Observabilidade'
    },
    projectKinds: {
      application: 'Aplicação',
      'open-source': 'Código aberto',
      platform: 'Plataforma',
      product: 'Produto',
      research: 'Pesquisa',
      tool: 'Ferramenta'
    }
  }
};

export function localeDefinition(locale: string = DEFAULT_LOCALE) {
  return SUPPORTED_LOCALES.find((item) => item.code === locale) ?? SUPPORTED_LOCALES[0];
}

type BaseCopy = typeof COPY.en;
export type SiteCopy = Omit<BaseCopy, 'statuses' | 'projectKinds' | 'significances' | 'activityTypeLabels'> & {
  statuses: Record<string, string>; projectKinds: Record<string, string>;
  significances: Record<string, string>; activityTypeLabels: Record<string, string>;
};
export function messagesFor(locale: string = DEFAULT_LOCALE): SiteCopy {
  return locale === 'pt-BR' ? COPY['pt-BR'] : COPY.en;
}

function localizationOf<T>(value: { localizations?: { 'pt-BR'?: T } }, locale: string): T | null {
  return locale === 'pt-BR' ? value.localizations?.['pt-BR'] ?? null : null;
}

function withoutLocalizations<T extends { localizations?: unknown }>(value: T): Omit<T, 'localizations'> {
  if (!value || typeof value !== 'object') return value;
  const { localizations, ...rest } = value;
  return rest;
}

function localizeOutcomes(outcomes: Outcome[], translated: string[] = []) {
  return outcomes.map((outcome, index) => ({
    ...outcome,
    text: translated[index] ?? outcome.text
  }));
}

function localizeLinks(links: PublicLink[], translated: string[] = []) {
  return links.map((link, index) => ({ ...link, label: translated[index] ?? link.label }));
}

function localizeEntry(entry: Entry, locale: LocaleCode, areaLabels: Map<string, string>): Entry {
  const base = withoutLocalizations(entry);
  const translated = localizationOf(entry, locale);
  return {
    ...base,
    ...(translated ? {
      title: translated.title,
      summary: translated.summary,
      context: translated.context ?? base.context,
      contributions: translated.contributions,
      outcomes: localizeOutcomes(base.outcomes, translated.outcomes),
      links: localizeLinks(base.links, translated.links),
      period: { ...base.period, label: translated.periodLabel }
    } : {}),
    areas: base.areas.map((label) => areaLabels.get(label) ?? label)
  };
}

function localizeProject(project: Project, locale: LocaleCode, areaLabels: Map<string, string>): Project {
  const base = withoutLocalizations(project);
  const translated = localizationOf(project, locale);
  const presentation = base.presentation && translated?.previewAlt
    ? { ...base.presentation, preview: { ...base.presentation.preview, alt: translated.previewAlt } }
    : base.presentation;
  return {
    ...base,
    ...(translated ? {
      name: translated.name,
      summary: translated.summary,
      description: translated.description,
      links: localizeLinks(base.links, translated.links)
    } : {}),
    areas: base.areas.map((label) => areaLabels.get(label) ?? label),
    ...(presentation ? { presentation } : {})
  };
}

function localizeResume(resume: Resume | null, locale: LocaleCode): Resume | null {
  if (!resume) return null;
  const base = withoutLocalizations(resume);
  const translated = localizationOf(resume, locale);
  if (!translated) return base;

  const experiences = new Map(translated.experiences.map((item) => [item.id, item]));
  const education = new Map(translated.education.map((item) => [item.id, item]));
  return {
    ...base,
    summary: translated.summary,
    highlights: localizeOutcomes(base.highlights, translated.highlights),
    skills: translated.skills,
    experiences: base.experiences.map((experience) => {
      const localized = experiences.get(experience.id);
      if (!localized) return experience;
      return {
        ...experience,
        role: localized.role,
        location: localized.location,
        domain: localized.domain,
        period: { ...experience.period, label: localized.periodLabel },
        summary: localized.summary,
        contributions: localized.contributions,
        outcomes: localizeOutcomes(experience.outcomes, localized.outcomes)
      };
    }),
    education: base.education.map((item) => {
      const localized = education.get(item.id);
      return localized ? {
        ...item,
        credential: localized.credential,
        institution: localized.institution,
        period: { ...item.period, label: localized.periodLabel }
      } : item;
    })
  };
}

export function localizeCareerDataset(data: CareerDataset, locale: string = DEFAULT_LOCALE): CareerDataset {
  const definition = localeDefinition(locale);
  const profileBase = withoutLocalizations(data.profile);
  const profileTranslation = localizationOf(data.profile, definition.code);
  const taxonomyBase = withoutLocalizations(data.taxonomy);
  const taxonomyTranslation = localizationOf(data.taxonomy, definition.code);
  const translatedAreas = new Map((taxonomyTranslation?.areas ?? []).map((item) => [item.slug, item]));
  const translatedKinds = new Map((taxonomyTranslation?.kinds ?? []).map((item) => [item.value, item]));
  const areaLabels = new Map<string, string>();

  const areas = taxonomyBase.areas.map((area) => {
    const translated = translatedAreas.get(area.slug);
    const localized = translated ? { ...area, label: translated.label, description: translated.description } : area;
    areaLabels.set(area.label, localized.label);
    return localized;
  });

  const localized = {
    ...data,
    locale: definition.code,
    availableLocales: SUPPORTED_LOCALES.map((item) => item.code),
    profile: profileTranslation ? {
      ...profileBase,
      headline: profileTranslation.headline,
      location: profileTranslation.location,
      intro: profileTranslation.intro,
      bio: profileTranslation.bio,
      principles: profileTranslation.principles,
      links: localizeLinks(profileBase.links, profileTranslation.links)
    } : profileBase,
    taxonomy: {
      ...taxonomyBase,
      areas,
      kinds: taxonomyBase.kinds.map((kind) => {
        const translated = translatedKinds.get(kind.value);
        return translated ? { ...kind, label: translated.label, description: translated.description } : kind;
      })
    },
    resume: localizeResume(data.resume, definition.code),
    entries: data.entries.map((entry) => localizeEntry(entry, definition.code, areaLabels)),
    projects: data.projects.map((project) => localizeProject(project, definition.code, areaLabels))
  };

  return localized;
}
