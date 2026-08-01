import React, { useState } from 'react';
import { Mail, ShieldCheck, FileText } from 'lucide-react';
import { LegalModal } from '../LegalModal';

interface FooterProps {
  companyName?: string;
  contactEmail?: string;
  onOpenAdmin?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  companyName = 'JPSchool',
  contactEmail = 'contato@jpschool.ia',
  onOpenAdmin,
}) => {
  const [legalModalType, setLegalModalType] = useState<'privacy' | 'terms' | null>(null);

  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 py-10 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-800">
          
          {/* Brand & Info */}
          <div className="space-y-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start space-x-2">
              <span className="font-extrabold text-lg tracking-tight text-white">{companyName}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                Tecnologia & IA
              </span>
            </div>
            <p className="text-slate-400 text-xs max-w-md">
              Plataforma de inteligência artificial e recursos de alta performance para concursos públicos e seleções.
            </p>
          </div>

          {/* Contact Email & Legal Links */}
          <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-6 text-slate-400">
            <a
              href={`mailto:${contactEmail}`}
              className="flex items-center space-x-1.5 hover:text-white transition-colors bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-700/60"
            >
              <Mail className="w-3.5 h-3.5 text-blue-400" />
              <span>{contactEmail}</span>
            </a>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => setLegalModalType('privacy')}
                className="hover:text-white transition-colors underline-offset-4 hover:underline flex items-center space-x-1"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                <span>Política de Privacidade</span>
              </button>

              <span>•</span>

              <button
                onClick={() => setLegalModalType('terms')}
                className="hover:text-white transition-colors underline-offset-4 hover:underline flex items-center space-x-1"
              >
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>Termos de Uso</span>
              </button>
            </div>
          </div>

        </div>

        {/* Copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} <strong>{companyName}</strong>. Todos os direitos reservados.</p>
          <div className="flex items-center space-x-3">
            <p>Tecnologia educacional simples, acessível e sem complicações.</p>
            {onOpenAdmin && (
              <button
                onClick={onOpenAdmin}
                className="text-slate-600 hover:text-slate-400 text-[10px] transition-colors hover:underline"
                title="Acesso exclusivo TI / Admin"
              >
                [TI]
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Modal for Privacy / Terms */}
      <LegalModal
        type={legalModalType}
        onClose={() => setLegalModalType(null)}
        companyName={companyName}
        contactEmail={contactEmail}
      />
    </footer>
  );
};
