import { ArrowUpRight } from 'lucide-react';
import { portfolioExamples, type PortfolioExample } from '@/lib/portfolioExamples';

const previewCopy: Record<PortfolioExample['preview'], { brand: string; heading: string; label: string }> = {
  analytics: { brand: 'NOVA ANALYTICS', heading: 'Performance Dashboard', label: 'Business overview' },
  commerce: { brand: 'FRESH MARKET', heading: 'Store management', label: 'Products & orders' },
  clinic: { brand: 'CARE CLINIC', heading: 'Patient queue', label: 'Today\'s appointments' },
  ordering: { brand: 'TABLE ORDER', heading: 'Menu & ordering', label: 'Choose your meal' },
  village: { brand: 'DESA DIGITAL', heading: 'Citizen services', label: 'Community portal' },
  learning: { brand: 'MATH PLAY', heading: 'Learning dashboard', label: 'Let\'s learn together' },
};

type PortfolioDemoPreviewProps = {
  project: PortfolioExample;
};

export function PortfolioDemoPreview({ project }: PortfolioDemoPreviewProps) {
  const copy = previewCopy[project.preview];

  return (
    <div className={`portfolio-demo-preview preview-${project.preview}`} aria-hidden="true">
      <div className="preview-scene">
        <span className="preview-decor decor-one" />
        <span className="preview-decor decor-two" />
        <div className="preview-window">
          <div className="preview-window-bar">
            <span />
            <span />
            <span />
            <b>{copy.brand}</b>
            <i><ArrowUpRight size={12} /></i>
          </div>
          <div className="preview-window-content">
            <span className="preview-mini-label">{copy.label}</span>
            <strong>{copy.heading}</strong>
            {project.preview === 'analytics' && (
              <>
                <div className="preview-stat-row"><i /><i /><i /></div>
                <div className="preview-chart"><span /><span /><span /><span /><span /><span /><span /></div>
              </>
            )}
            {project.preview === 'commerce' && (
              <>
                <div className="preview-sale-banner">FRESH PICKS <b>WEEKLY DEALS</b></div>
                <div className="preview-product-row"><i /><i /><i /></div>
              </>
            )}
            {project.preview === 'clinic' && (
              <>
                <div className="preview-queue-number">A-014 <small>Now serving</small></div>
                <div className="preview-queue-lines"><i /><i /><i /></div>
              </>
            )}
            {project.preview === 'ordering' && (
              <>
                <div className="preview-food-row"><i /><i /><i /></div>
                <div className="preview-order-button">VIEW MENU <b>→</b></div>
              </>
            )}
            {project.preview === 'village' && (
              <>
                <div className="preview-stat-row village-stats"><i /><i /><i /><i /></div>
                <div className="preview-queue-lines"><i /><i /><i /></div>
              </>
            )}
            {project.preview === 'learning' && (
              <>
                <div className="preview-learning-title">LET'S PRACTICE!</div>
                <div className="preview-learning-row"><i>＋</i><i>÷</i><i>×</i><i>−</i></div>
              </>
            )}
          </div>
        </div>
        <span className="preview-index">{String(Number(portfolioExamplesIndex(project.id))).padStart(2, '0')}</span>
        <span className="preview-concept-badge">DEMO CONCEPT</span>
      </div>
    </div>
  );
}

function portfolioExamplesIndex(id: string) {
  return portfolioExamples.findIndex((project) => project.id === id) + 1;
}
