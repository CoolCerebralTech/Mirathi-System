import { calculatePasswordStrength } from '../../../types/auth.types';

interface Props {
  password: string;
}

export function PasswordStrengthIndicator({ password }: Props) {
  if (!password) return null;

  const strength = calculatePasswordStrength(password);
  
  // Mapping strength string to percentage and color
  let width = 0;
  let color = 'bg-neutral-200';
  let label = '';

  switch (strength) {
    case 'weak':
      width = 25;
      color = 'bg-red-500';
      label = 'Weak';
      break;
    case 'medium':
      width = 50;
      color = 'bg-yellow-500';
      label = 'Fair';
      break;
    case 'strong':
      width = 75;
      color = 'bg-emerald-500';
      label = 'Good';
      break;
    case 'very-strong':
      width = 100;
      color = 'bg-[#0F3D3E]'; // Brand color for best
      label = 'Excellent';
      break;
  }

  return (
    <div className="space-y-1 pt-1">
      <div className="h-1 w-full overflow-hidden rounded-full bg-neutral-100">
        <div 
          className={`h-full transition-all duration-500 ease-out ${color}`} 
          style={{ width: `${width}%` }} 
        />
      </div>
      <p className="text-right text-[10px] font-medium text-neutral-500 uppercase tracking-wide">
        Strength: <span className="text-neutral-700">{label}</span>
      </p>
    </div>
  );
}