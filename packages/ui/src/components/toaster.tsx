/* eslint-disable @typescript-eslint/no-explicit-any -- Reason: React 19 compatibility; Toast components cast to any for JSX type compatibility */
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from './toast';
import { useToast } from '../hooks/use-toast';

export function Toaster() {
  const { toasts } = useToast();

  // Cast components to 'any' to fix React 19 type compatibility issues
  const Provider = ToastProvider as any;
  const ToastCompat = Toast as any;
  const TitleCompat = ToastTitle as any;
  const DescCompat = ToastDescription as any;
  const CloseCompat = ToastClose as any;
  const ViewportCompat = ToastViewport as any;

  return (
    <Provider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <ToastCompat key={id} {...props}>
            <div className="grid gap-1">
              {title ? <TitleCompat>{title as any}</TitleCompat> : null}
              {description ? <DescCompat>{description as any}</DescCompat> : null}
            </div>
            {action ? (action as any) : null}
            <CloseCompat />
          </ToastCompat>
        );
      })}
      <ViewportCompat />
    </Provider>
  );
}
