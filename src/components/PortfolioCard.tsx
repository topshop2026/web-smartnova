import { ArrowUpRight, ExternalLink } from 'lucide-react';
import type { PortfolioExample } from '@/lib/portfolioExamples';
import type { PortfolioProject } from '@/lib/supabase';
import { PortfolioDemoPreview } from '@/components/PortfolioDemoPreview';
import { getSafeExternalUrl } from '@/lib/business';
import { portfolioExamples } from '@/lib/portfolioExamples';

type PortfolioCardProps = {
  project: PortfolioProject | PortfolioExample;
  index: number;
};

function isExample(project: PortfolioProject | PortfolioExample): project is PortfolioExample {
  return 'preview' in project;
}

export function PortfolioCard({ project, index }: PortfolioCardProps) {
  const example = isExample(project);
  const concept = example || project.is_concept;
  const category = example ? project.category : project.role;
  const demoUrl = getSafeExternalUrl(example ? project.demoUrl : project.demo_url);
  const preview = example ? project : concept ? portfolioExamples.find((item) => item.id === project.id) : undefined;
  const visual = preview ? (
    <PortfolioDemoPreview project={preview} />
  ) : !example && project.image_url ? (
    <img className="portfolio-project-image" src={project.image_url} alt={`Pratinjau ${project.title}`} loading="lazy" />
  ) : (
    <div className="portfolio-project-fallback"><span>{String(index + 1).padStart(2, '0')}</span><strong>{project.title}</strong></div>
  );

  return (
    <article className={`portfolio-card${concept ? ' is-concept-card' : ''}`}>
      {demoUrl ? <a className="portfolio-card-visual-link" href={demoUrl} target="_blank" rel="noopener noreferrer" aria-label={`Buka demo ${project.title} di tab baru`}>{visual}</a> : visual}
      <div className="portfolio-card-body">
        <span>{concept ? 'DEMO KONSEP · ' : ''}{category}</span>
        <h2>{demoUrl ? <a className="portfolio-title-link" href={demoUrl} target="_blank" rel="noopener noreferrer">{project.title}</a> : project.title}</h2>
        <p>{project.summary}</p>
        {!example && !!project.technologies.length && <small>{project.technologies.join(' · ')}</small>}
        {!example && !!project.outcomes.length && <ul>{project.outcomes.map((outcome) => <li key={outcome}>{outcome}</li>)}</ul>}
        {demoUrl ? (
          <a className="portfolio-demo-link" href={demoUrl} target="_blank" rel="noopener noreferrer">
            Lihat website <ExternalLink size={13} />
          </a>
        ) : (
          <span className="portfolio-demo-pending" aria-label="Tautan demo belum ditambahkan">
            URL demo akan ditambahkan <ArrowUpRight size={13} />
          </span>
        )}
      </div>
    </article>
  );
}
