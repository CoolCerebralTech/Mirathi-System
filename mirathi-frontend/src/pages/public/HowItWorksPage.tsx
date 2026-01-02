// FILE: src/pages/public/HowItWorksPage.tsx
// CONTEXT: Visualizing the "Event-Driven" Architecture for the user.

import { 
  FileText, 
  Users, 
  Search, 
  Scale} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useNavigate } from 'react-router-dom';

export function HowItWorksPage() {
  const navigate = useNavigate();

  const steps = [
    {
      id: 1,
      title: "The Digital Intake",
      desc: "We start by creating a 'Digital Twin' of the estate. You answer simple questions about the Deceased, and our system determines if the case is Testate (Will) or Intestate (No Will).",
      icon: FileText,
      color: "bg-blue-50 text-blue-700"
    },
    {
      id: 2,
      title: "Family Graph Verification",
      desc: "You invite potential beneficiaries via SMS. Mirathi maps the family tree according to Section 29 (Dependants) and Section 40 (Polygamous Houses) of the Law of Succession Act.",
      icon: Users,
      color: "bg-purple-50 text-purple-700"
    },
    {
      id: 3,
      title: "Asset Discovery & Validation",
      desc: "Upload Title Deeds, Logbooks, and Bank Statements. Our team and OCR technology verify the documents against public records to create a solvency report.",
      icon: Search,
      color: "bg-[#C8A165]/10 text-[#C8A165]"
    },
    {
      id: 4,
      title: "Automated Court Filing",
      desc: "Once the 'Readiness Score' hits 100%, Mirathi generates the P&A 80 (Petition) and P&A 5 (Affidavit) forms instantly, ready for the High Court registry.",
      icon: Scale,
      color: "bg-[#0F3D3E]/10 text-[#0F3D3E]"
    }
  ];

  return (
    <div className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-base font-semibold leading-7 text-[#C8A165]">The Mirathi Process</h2>
          <p className="mt-2 font-serif text-4xl font-bold tracking-tight text-[#0F3D3E] sm:text-5xl">
            From Chaos to Compliance in 4 Steps
          </p>
          <p className="mt-6 text-lg leading-8 text-neutral-600">
            We replace the confusion of the probate process with a linear, guided roadmap.
          </p>
        </div>

        {/* Vertical Timeline */}
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
          <div className="relative pl-8 sm:pl-32">
            
            {/* The Line */}
            <div className="absolute left-8 top-0 bottom-0 w-px bg-neutral-200 sm:left-32" />

            <div className="space-y-16">
              {steps.map((step) => (
                <div key={step.id} className="relative flex flex-col gap-6 sm:flex-row sm:gap-10">
                  
                  {/* Icon Marker */}
                  <div className={`absolute left-0 sm:left-auto sm:-ml-16 flex h-12 w-12 items-center justify-center rounded-full border-4 border-white shadow-sm z-10 ${step.color}`}>
                    <step.icon className="h-6 w-6" />
                  </div>

                  {/* Content */}
                  <div className="rounded-2xl border border-neutral-100 bg-neutral-50 p-8 hover:shadow-lg transition-shadow ml-12 sm:ml-0 w-full">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0F3D3E] text-xs font-bold text-white">
                        {step.id}
                      </span>
                      <h3 className="font-serif text-xl font-bold text-[#0F3D3E]">{step.title}</h3>
                    </div>
                    <p className="text-neutral-600 leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-20 text-center">
          <Button 
            size="lg" 
            onClick={() => navigate('/register')}
            className="bg-[#0F3D3E] hover:bg-[#0F3D3E]/90"
          >
            Start Your Roadmap
          </Button>
        </div>
      </div>
    </div>
  );
}