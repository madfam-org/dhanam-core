'use client';

interface ComingSoonOverlayProps {
  category: string;
  provider: string;
  children?: React.ReactNode;
}

export function ComingSoonOverlay({ category, provider, children }: ComingSoonOverlayProps) {
  return (
    <div className="relative">
      {children}
      <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[2px] rounded-lg">
        <div className="text-center px-4">
          <span className="inline-block rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            Coming Soon
          </span>
          <p className="mt-2 text-sm text-muted-foreground capitalize">
            {category.replace('_', ' ')} via {provider}
          </p>
        </div>
      </div>
    </div>
  );
}
