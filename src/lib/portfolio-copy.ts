import type { LocaleCode } from './build-context';

const copy = {
  en: {
    layers: ['Interface', 'Product', 'Systems', 'Infrastructure'],
    layerDescriptions: [
      'Interaction, accessibility, and visual systems.',
      'Journeys, constraints, and useful product behavior.',
      'Services, data paths, boundaries, and reliability.',
      'Delivery, automation, environments, and operations.'
    ],
    scrollPrompt: 'Scroll through the system',
    workKicker: 'Selected systems',
    workTitle: 'Products shaped across layers.',
    landscapeKicker: 'Engineering landscape',
    landscapeTitle: 'One practice. Connected disciplines.',
    landscapeDescription: 'From user-facing interfaces to delivery systems: the disciplines connected across these projects.',
    landscapeList: 'Engineering landscape relationships',
    mixTitle: 'Recorded activity mix',
    mixNote: 'Distribution of meaningful ledger records—not time, effort, ownership, or lines of code.',
    mixSample: (count: number) => `Sample: ${count} recorded activities. Each activity has equal total weight, shared across its domains.`,
    domainLabels: {
      frontend: 'Frontend', backend: 'Backend', devops: 'DevOps', infrastructure: 'Infrastructure',
      data: 'Data', 'ai-ml': 'AI / ML', mobile: 'Mobile', desktop: 'Desktop', embedded: 'Embedded',
      'quality-engineering': 'Quality engineering', security: 'Security',
      'developer-experience': 'Developer experience', 'product-design': 'Product design', other: 'Other'
    },
    experienceKicker: 'Experience',
    experienceTitle: 'Products, platforms, and the work between.',
    principlesKicker: 'Working principles',
    principlesTitle: 'How the engineering decisions are made.',
    toolboxKicker: 'Toolbox',
    toolboxTitle: 'Tools in service of the product.',
    noExperience: 'Experience records are being prepared for review.',
    inspectProject: 'Open project',
    previewLabel: 'Project visual preview',
    diagramLabel: 'Abstract system diagram',
    sectionNavigation: 'Page sections',
    sections: ['Intro', 'Work', 'Landscape', 'Experience', 'About'],
    architectureLabel: 'Architecture layers from interface to infrastructure',
    details: 'Technical detail',
    allProjects: 'All projects'
  },
  'pt-BR': {
    layers: ['Interface', 'Produto', 'Sistemas', 'Infraestrutura'],
    layerDescriptions: [
      'Interação, acessibilidade e sistemas visuais.',
      'Jornadas, restrições e comportamento útil de produto.',
      'Serviços, caminhos de dados, limites e confiabilidade.',
      'Entrega, automação, ambientes e operações.'
    ],
    scrollPrompt: 'Percorra as camadas do sistema',
    workKicker: 'Sistemas selecionados',
    workTitle: 'Produtos construídos entre diferentes camadas.',
    landscapeKicker: 'Panorama de engenharia',
    landscapeTitle: 'Uma prática. Disciplinas conectadas.',
    landscapeDescription: 'Das interfaces aos sistemas de entrega: as disciplinas conectadas ao longo destes projetos.',
    landscapeList: 'Relações do panorama de engenharia',
    mixTitle: 'Distribuição das atividades registradas',
    mixNote: 'Distribuição dos registros relevantes — não representa tempo, esforço, autoria ou linhas de código.',
    mixSample: (count: number) => `Amostra: ${count} atividades registradas. Cada atividade tem peso total igual, dividido entre seus domínios.`,
    domainLabels: {
      frontend: 'Frontend', backend: 'Backend', devops: 'DevOps', infrastructure: 'Infraestrutura',
      data: 'Dados', 'ai-ml': 'IA / ML', mobile: 'Mobile', desktop: 'Desktop', embedded: 'Embarcados',
      'quality-engineering': 'Engenharia de qualidade', security: 'Segurança',
      'developer-experience': 'Experiência de desenvolvimento', 'product-design': 'Design de produto', other: 'Outros'
    },
    experienceKicker: 'Experiência',
    experienceTitle: 'Produtos, plataformas e o trabalho entre eles.',
    principlesKicker: 'Princípios de trabalho',
    principlesTitle: 'Como as decisões de engenharia são tomadas.',
    toolboxKicker: 'Ferramentas',
    toolboxTitle: 'Ferramentas a serviço do produto.',
    noExperience: 'Os registros de experiência estão sendo preparados para revisão.',
    inspectProject: 'Abrir projeto',
    previewLabel: 'Prévia visual do projeto',
    diagramLabel: 'Diagrama abstrato de sistema',
    sectionNavigation: 'Seções da página',
    sections: ['Introdução', 'Trabalhos', 'Panorama', 'Experiência', 'Sobre'],
    architectureLabel: 'Camadas de arquitetura da interface à infraestrutura',
    details: 'Detalhe técnico',
    allProjects: 'Todos os projetos'
  }
} as const;

export function portfolioCopy(locale: LocaleCode) {
  return copy[locale];
}
