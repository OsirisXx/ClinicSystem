import { toast as hotToast } from 'react-hot-toast';

interface ToastOptions {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

export function toast({ title, description, variant = 'default' }: ToastOptions) {
  hotToast[variant === 'destructive' ? 'error' : 'success'](
    <div className="flex flex-col gap-1">
      {title && <p className="font-semibold">{title}</p>}
      {description && <p className="text-sm">{description}</p>}
    </div>
  );
} 