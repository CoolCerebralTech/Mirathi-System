// FILE: src/pages/public/LegalPage.tsx
// CONTEXT: Generic wrapper for text-heavy legal content.

import { useLocation } from 'react-router-dom';

export function LegalPage() {
  const location = useLocation();
  
  // Simple logic to determine content based on URL
  const isPrivacy = location.pathname.includes('privacy');
  const title = isPrivacy ? 'Privacy Policy' : 'Terms of Service';
  const lastUpdated = 'January 1, 2026';

  return (
    <div className="bg-white px-6 py-32 lg:px-8">
      <div className="mx-auto max-w-3xl text-base leading-7 text-neutral-700">
        <p className="text-base font-semibold leading-7 text-[#C8A165]">Legal</p>
        <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight text-[#0F3D3E] sm:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-neutral-500">Last updated: {lastUpdated}</p>
        
        <div className="mt-10 max-w-2xl space-y-8">
          <p>
            Welcome to Mirathi. By accessing or using our platform, you agree to be bound by these terms. 
            Mirathi is a technology platform designed to assist with Estate Planning and Succession Administration 
            under the Laws of Kenya.
          </p>

          <h2 className="mt-16 text-2xl font-bold tracking-tight text-gray-900">1. Nature of Services</h2>
          <p className="mt-6">
            Mirathi provides automated forms and data organization tools. <strong>We are not a law firm</strong> and 
            do not provide legal advice. The content on Mirathi is for informational purposes only.
          </p>

          <h2 className="mt-16 text-2xl font-bold tracking-tight text-gray-900">2. Data Privacy & Security</h2>
          <p className="mt-6">
            We take your data seriously. All sensitive documents (Death Certificates, Title Deeds) are encrypted using 
            AES-256 standards. We comply with the Kenya Data Protection Act, 2019. We do not sell your data to third parties.
          </p>

          <h2 className="mt-16 text-2xl font-bold tracking-tight text-gray-900">3. User Responsibilities</h2>
          <p className="mt-6">
            You represent that all information provided to the Family Service and Estate Service is accurate 
            and truthful. Providing false information in succession matters is a criminal offense under the Penal Code.
          </p>

          <div className="mt-10 rounded-md bg-neutral-50 p-4 border border-neutral-200">
            <p className="text-sm font-medium text-neutral-900">
              Need full legal details?
            </p>
            <p className="mt-1 text-sm text-neutral-500">
              Please contact our legal compliance team at <a href="mailto:legal@mirathi.com" className="text-[#0F3D3E] underline">legal@mirathi.com</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}