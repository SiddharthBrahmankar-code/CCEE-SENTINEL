import { Toaster } from 'sonner';

export const ToastProvider = () => {
  return (
    <Toaster
      position="top-right"
      expand={false}
      richColors
      theme="dark"
      toastOptions={{
        style: {
          background: '#0a0a0a',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: '#fff',
          fontFamily: 'inherit',
        },
        className: 'font-mono text-sm',
      }}
    />
  );
};
