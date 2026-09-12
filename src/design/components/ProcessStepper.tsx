type ProcessStep = Readonly<{ id: string; label: string }>;

export function ProcessStepper({ ariaLabel = 'Progreso del proceso', steps, currentId }: Readonly<{ ariaLabel?: string; steps: readonly ProcessStep[]; currentId: string }>) {
  const currentIndex = Math.max(0, steps.findIndex((step) => step.id === currentId));
  return <ol aria-label={ariaLabel} className="process-stepper">
    {steps.map((step, index) => <li aria-current={step.id === currentId ? 'step' : undefined} className={index < currentIndex ? 'process-step process-step--complete' : index === currentIndex ? 'process-step process-step--current' : 'process-step'} key={step.id}>
      <span aria-hidden="true">{index + 1}</span><strong>{step.label}</strong>
    </li>)}
  </ol>;
}
