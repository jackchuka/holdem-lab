import { useEffect } from 'react';

export function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 4000);
    return () => clearTimeout(timer);
  }, [message, onDone]);
  return (
    <div className="toast" role="status">
      {message}
    </div>
  );
}
