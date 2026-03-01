type FormMessageProps = {
  message?: string | null;
};

export function FormMessage({ message }: FormMessageProps) {
  if (!message) {
    return null;
  }

  return <div className="message error">{message}</div>;
}
