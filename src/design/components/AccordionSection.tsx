import { ChevronDown } from 'lucide-react';
import { useId, useState, type ReactNode } from 'react';

type AccordionSectionProps = Readonly<{
  children: ReactNode;
  defaultOpen?: boolean;
  summary?: ReactNode;
  title: ReactNode;
}>;

/** Collapses long record sections without unmounting drafts inside them. */
export function AccordionSection({ children, defaultOpen = true, summary, title }: AccordionSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentId = useId();
  const summaryId = useId();
  return <section className="accordion-section">
    <h3>
      <button aria-controls={contentId} aria-describedby={summary ? summaryId : undefined} aria-expanded={isOpen} className="accordion-trigger" onClick={() => setIsOpen((current) => !current)} type="button">
        <span className="accordion-title">{title}</span>
        {summary && <span aria-hidden="true" className="accordion-summary" id={summaryId}>{summary}</span>}
        <ChevronDown aria-hidden="true" className="accordion-indicator" size={18} />
      </button>
    </h3>
    <div hidden={!isOpen} id={contentId}>{children}</div>
  </section>;
}
