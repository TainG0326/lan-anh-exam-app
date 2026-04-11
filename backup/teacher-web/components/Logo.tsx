import React from 'react';
import { TEACHER_LOGO_SRC } from '../constants/branding';

const Logo: React.FC<{ className?: string }> = ({ className = 'w-12 h-12' }) => {
  return (
    <img
      src={TEACHER_LOGO_SRC}
      alt=""
      className={`${className} object-contain select-none`}
      draggable={false}
    />
  );
};

export default Logo;
