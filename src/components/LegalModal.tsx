import React from 'react';
import { X, ShieldCheck, FileText } from 'lucide-react';

interface LegalModalProps {
  type: 'privacy' | 'terms' | null;
  onClose: () => void;
  companyName?: string;
  contactEmail?: string;
}

export const LegalModal: React.FC<LegalModalProps> = ({
  type,
  onClose,
  companyName = 'JPSchool IA',
  contactEmail = 'contato@jpschool.ia',
}) => {
  if (!type) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative border border-slate-200 my-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {type === 'privacy' ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-[#1877F2]">
              <ShieldCheck className="w-6 h-6" />
              <h2 className="text-xl font-bold text-[#2D3748]">Política de Privacidade</h2>
            </div>

            <div className="text-xs text-slate-600 space-y-3 leading-relaxed max-h-[60vh] overflow-y-auto pr-2">
              <p>
                A sua privacidade é fundamental para o <strong>{companyName}</strong>. Esta política descreve como coletamos, usamos e protegemos as informações dos usuários na nossa plataforma.
              </p>

              <h3 className="font-bold text-slate-800 text-sm">1. Coleta de Informações</h3>
              <p>
                Coletamos apenas as informações estritamente necessárias para a prestação do serviço, incluindo nome, e-mail e dados necessários para a liberação do acesso à área de estudos.
              </p>

              <h3 className="font-bold text-slate-800 text-sm">2. Uso das Informações</h3>
              <p>
                Os dados cadastrais são utilizados exclusivamente para autenticação, personalização da experiência de estudo no Tutor de IA e envio de comunicações institucionais da plataforma.
              </p>

              <h3 className="font-bold text-slate-800 text-sm">3. Segurança dos Dados</h3>
              <p>
                Adotamos medidas técnicas e administrativas aptas a proteger os dados pessoais de acessos não autorizados e de situações acidentais ou ilícitas. Não comercializamos dados de usuários com terceiros.
              </p>

              <h3 className="font-bold text-slate-800 text-sm">4. Seus Direitos</h3>
              <p>
                Você possui o direito de solicitar a confirmação, acesso, correção ou eliminação dos seus dados pessoais a qualquer momento através do e-mail <strong>{contactEmail}</strong>.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-[#1877F2]">
              <FileText className="w-6 h-6" />
              <h2 className="text-xl font-bold text-[#2D3748]">Termos de Uso</h2>
            </div>

            <div className="text-xs text-slate-600 space-y-3 leading-relaxed max-h-[60vh] overflow-y-auto pr-2">
              <p>
                Bem-vindo ao <strong>{companyName}</strong>. Ao acessar nossa plataforma, você concorda em cumprir estes Termos de Uso.
              </p>

              <h3 className="font-bold text-slate-800 text-sm">1. Objeto da Plataforma</h3>
              <p>
                O {companyName} é uma ferramenta tecnológica educacional que auxilia candidatos na preparação para concursos e processos seletivos através de inteligência artificial e recursos de aprendizagem.
              </p>

              <h3 className="font-bold text-slate-800 text-sm">2. Acesso e Licença de Uso</h3>
              <p>
                O acesso à plataforma é pessoal, intransferível e temporário conforme o plano contratado. É proibido o compartilhamento de credenciais de acesso ou reprodução não autorizada dos conteúdos produzidos.
              </p>

              <h3 className="font-bold text-slate-800 text-sm">3. Responsabilidades</h3>
              <p>
                O usuário é responsável pela exatidão dos dados informados e pelo uso adequado das funcionalidades fornecidas.
              </p>

              <h3 className="font-bold text-slate-800 text-sm">4. Contato e Suporte</h3>
              <p>
                Para suporte técnico, dúvidas de utilização ou solicitações financeiras, entre em contato através do e-mail de atendimento: <strong>{contactEmail}</strong>.
              </p>
            </div>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-[#1877F2] hover:bg-blue-600 text-white font-bold rounded-xl text-xs transition-all shadow-sm"
          >
            Entendido
          </button>
        </div>

      </div>
    </div>
  );
};
