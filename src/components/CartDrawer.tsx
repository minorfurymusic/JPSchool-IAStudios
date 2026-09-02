import React, { useState } from 'react';
import { ShoppingCart, X, Trash2, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { PlanItem } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlan: PlanItem;
  onSelectPlan: (plan: PlanItem) => void;
  allPlans: PlanItem[];
  onCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  selectedPlan,
  onSelectPlan,
  allPlans,
  onCheckout,
}) => {
  const [coupon, setCoupon] = useState('');
  const [discountApplied, setDiscountApplied] = useState(false);

  if (!isOpen) return null;

  // Extrai um valor numérico do preço cadastrado pelo admin (texto livre).
  // Retorna null quando o preço não é numérico (ex: "Sob Consulta") — nesse caso
  // não há desconto/cálculo para aplicar, só exibimos o texto como está.
  const parsePrice = (price: string): number | null => {
    const cleaned = price.replace(/[^\d,.-]/g, '').replace(',', '.');
    const value = parseFloat(cleaned);
    return Number.isFinite(value) ? value : null;
  };

  const numericPrice = parsePrice(selectedPlan.price);
  const finalPriceLabel =
    numericPrice === null
      ? selectedPlan.price
      : (discountApplied ? (numericPrice * 0.9) : numericPrice).toFixed(2).replace('.', ',');

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (numericPrice === null) {
      alert('Este plano tem preço sob consulta e não aceita cupom de desconto automático.');
      return;
    }
    if (coupon.trim().toUpperCase() === 'PROFESSOR10') {
      setDiscountApplied(true);
    } else {
      alert('Cupom inválido. Experimente usar "PROFESSOR10" para 10% de desconto.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col justify-between border-l border-slate-200 animate-in slide-in-from-right duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2 text-[#1877F2]">
            <ShoppingCart className="w-5 h-5" />
            <h3 className="font-extrabold text-base text-[#2D3748]">Carrinho de Compras</h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          
          {/* Plan Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">Selecione o Plano Desejado:</label>
            <div className="grid grid-cols-2 gap-2">
              {allPlans.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => onSelectPlan(plan)}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    selectedPlan.id === plan.id
                      ? 'border-[#1877F2] bg-blue-50/80 font-bold text-[#1877F2] shadow-xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <p className="text-xs font-bold">{plan.name}</p>
                  <p className="text-[11px] text-slate-500 font-semibold mt-0.5">R$ {plan.price}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Cart Item Card */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-[#1877F2] uppercase">
                  Item no Carrinho
                </span>
                <h4 className="font-extrabold text-base text-[#2D3748] mt-1">{selectedPlan.name}</h4>
                <p className="text-xs text-slate-500 font-medium">{selectedPlan.subtitle}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
              <span className="text-xs text-slate-500 font-semibold">Valor do Plano:</span>
              <div className="text-right">
                {discountApplied && (
                  <span className="text-xs text-slate-400 line-through mr-1.5">
                    R$ {selectedPlan.price}
                  </span>
                )}
                <span className="text-lg font-extrabold text-[#1877F2]">
                  {numericPrice === null ? finalPriceLabel : `R$ ${finalPriceLabel}`}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500">{selectedPlan.installments}</p>
          </div>

          {/* Included Features Summary */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-700">Recursos inclusos no plano:</p>
            <div className="space-y-1.5 text-xs text-slate-600 bg-white p-3.5 rounded-xl border border-slate-200">
              {selectedPlan.features.slice(0, 4).map((f, i) => (
                <div key={i} className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Coupon Form */}
          <form onSubmit={handleApplyCoupon} className="space-y-2 pt-2">
            <label className="block text-xs font-bold text-slate-700">Cupom de Desconto</label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
                placeholder="Ex: PROFESSOR10"
                className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 outline-none uppercase"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all"
              >
                Aplicar
              </button>
            </div>
            {discountApplied && (
              <p className="text-[11px] text-emerald-600 font-bold">✓ Cupom PROFESSOR10 aplicado com 10% OFF!</p>
            )}
          </form>

        </div>

        {/* Footer Checkout CTA */}
        <div className="p-5 border-t border-slate-200 bg-slate-50 space-y-3">
          <div className="flex justify-between items-center text-sm font-bold text-[#2D3748]">
            <span>Total:</span>
            <span className="text-xl font-extrabold text-[#1877F2]">
              {numericPrice === null ? finalPriceLabel : `R$ ${finalPriceLabel}`}
            </span>
          </div>

          <button
            onClick={() => {
              onClose();
              onCheckout();
            }}
            className="w-full py-4 bg-[#1877F2] hover:bg-blue-600 text-white font-bold rounded-2xl text-xs transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center space-x-2"
          >
            <span>Avançar para Checkout</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="flex items-center justify-center space-x-1.5 text-[10px] text-slate-500 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Compra 100% segura • Liberação imediata</span>
          </div>
        </div>

      </div>
    </div>
  );
};
