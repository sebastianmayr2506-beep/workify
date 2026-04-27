import { ExternalLink } from "lucide-react";

interface Props {
  aworkUrl: string | null;
  extraLinks: { label: string; url: string }[];
}

export function CustomerLinks({ aworkUrl, extraLinks }: Props) {
  return (
    <div className="space-y-3">
      {aworkUrl && (
        <a
          href={aworkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-lg border p-3 hover:bg-muted/50 transition-colors text-sm"
        >
          <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="font-medium">Awork</span>
          <span className="text-muted-foreground truncate">{aworkUrl}</span>
        </a>
      )}
      {extraLinks.map((link, i) => (
        <a
          key={i}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-lg border p-3 hover:bg-muted/50 transition-colors text-sm"
        >
          <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="font-medium">{link.label}</span>
          <span className="text-muted-foreground truncate">{link.url}</span>
        </a>
      ))}
    </div>
  );
}
