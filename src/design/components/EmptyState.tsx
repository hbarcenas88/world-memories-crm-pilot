import { Inbox } from 'lucide-react';

export function EmptyState({ title, body }: { title: string; body: string }) {
  return <section className="empty-state" aria-live="polite"><Inbox aria-hidden="true" /><h2>{title}</h2><p>{body}</p></section>;
}
