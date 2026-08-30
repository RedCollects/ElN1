import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  Clock,
  ExternalLink,
  Eye,
  Globe,
  Image as ImageIcon,
  Lock,
  LogOut,
  Mail,
  MessageCircle,
  Moon,
  Phone,
  Store,
  Sun,
  Upload,
  X,
  type LucideProps,
} from "lucide-react";

/**
 * Única familia de iconos de la marca (Lucide). Stroke 2.2 en la interfaz y 3
 * en indicadores pequeños (≤ 12px); terminales cuadradas. No mezclar con
 * emojis ni otras familias.
 */
const ICONS = {
  "arrow-down": ArrowDown,
  "arrow-up": ArrowUp,
  check: Check,
  "chevron-down": ChevronDown,
  clock: Clock,
  "external-link": ExternalLink,
  eye: Eye,
  globe: Globe,
  image: ImageIcon,
  lock: Lock,
  "log-out": LogOut,
  mail: Mail,
  "message-circle": MessageCircle,
  moon: Moon,
  phone: Phone,
  store: Store,
  sun: Sun,
  upload: Upload,
  x: X,
} as const;

export type IconName = keyof typeof ICONS;

type IconProps = Omit<LucideProps, "size" | "strokeWidth"> & {
  name: IconName;
  /** 12 (indicador), 16, 18 (por defecto) o 20. */
  size?: 12 | 16 | 18 | 20 | 24;
};

export function Icon({ name, size = 18, ...props }: IconProps) {
  const Component = ICONS[name];
  return (
    <Component
      size={size}
      strokeWidth={size <= 12 ? 3 : 2.2}
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden={props["aria-label"] ? undefined : true}
      {...props}
    />
  );
}
