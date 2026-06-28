import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function ResetPasswordLink({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      className={className}
      onClick={() => navigate('/reset-password')}
    >
      {children ?? 'Forgot password?'}
    </button>
  );
}


