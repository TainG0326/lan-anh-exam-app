import { STUDENT_LOGO_SRC } from '../constants/branding';

interface LogoProps {
  className?: string;
}

export default function Logo({ className = 'w-12 h-12' }: LogoProps) {
  return (
    <img
      src={STUDENT_LOGO_SRC}
      alt="Lan Anh English"
      className={className}
      style={{ objectFit: 'contain' }}
    />
  );
}
