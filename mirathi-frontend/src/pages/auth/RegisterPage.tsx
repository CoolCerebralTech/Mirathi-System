import { RegisterForm } from '../../features/auth/components/RegisterForm';

export function RegisterPage() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <RegisterForm />
      </div>
    </div>
  );
}