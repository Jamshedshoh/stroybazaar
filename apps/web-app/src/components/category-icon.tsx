import {
  Box,
  Droplet,
  Grid3x3,
  Hammer,
  Layers,
  Package,
  Square,
  TreePine,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";

// Category icons are stored by name in the database.
const ICONS: Record<string, LucideIcon> = {
  layers: Layers,
  grid: Grid3x3,
  box: Box,
  square: Square,
  droplet: Droplet,
  tool: Wrench,
  zap: Zap,
  trello: TreePine,
  tree: TreePine,
  hammer: Hammer,
};

export function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? Package;
  return <Icon className={className} aria-hidden />;
}
