import React, { useState } from 'react';
import { AnotacaoItem } from '../../types';
import { X, Search, FileText, Trash2, Download, BookOpen, Calendar, Tag } from 'lucide-react';

interface NotesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notes: AnotacaoItem[];
  onDeleteNote: (id: number) => void;
}

export const NotesDrawer: React.FC<NotesDrawerProps> = ({
  isOpen,
  onClose,
  notes,
  onDeleteNote,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredNotes = notes.filter(
    (n) =>
      n.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.materia.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.conteudoResumido.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex justify-end">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col justify-between border-l border-slate-200 animate-slideLeft">
        
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-[#1877F2]" />
            <div>
              <h2 className="font-bold text-sm text-[#2D3748]">Minhas Anotações de Estudo</h2>
              <p className="text-[10px] text-slate-500">Repositório Pessoal ({notes.length} salvas)</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar anotações por assunto, matéria ou título..."
              className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* List of Saved Notes */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {filteredNotes.length > 0 ? (
            filteredNotes.map((note) => (
              <div
                key={note.id}
                className="bg-slate-50 hover:bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2 transition-all group"
              >
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-bold bg-blue-100 text-[#1877F2] px-2 py-0.5 rounded-md">
                    {note.materia}
                  </span>
                  <div className="flex items-center space-x-1">
                    <span className="text-[10px] text-slate-400 flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{note.data}</span>
                    </span>
                    <button
                      onClick={() => onDeleteNote(note.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50"
                      title="Excluir anotação"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-xs text-[#2D3748]">{note.titulo}</h3>

                <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                  {note.conteudoResumido}
                </p>

                <div className="flex items-center justify-between text-[10px] pt-1">
                  <span className="text-emerald-700 font-semibold">
                    {note.origem === 'oficial' ? '📗 Biblioteca Oficial' : '🌐 Complemento Externo'}
                  </span>
                  <button
                    onClick={() => alert(`Baixando anotação: ${note.titulo}`)}
                    className="text-[#1877F2] font-bold hover:underline flex items-center space-x-1"
                  >
                    <Download className="w-3 h-3" />
                    <span>Baixar TXT</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <FileText className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs font-semibold">Nenhuma anotação encontrada.</p>
              <p className="text-[11px] text-slate-500">
                Gere resumos e simulados no Estúdio e clique em "Salvar nas Anotações".
              </p>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 text-center">
          <p className="text-[10px] text-slate-500">
            Anotações salvas com backup local sincronizado.
          </p>
        </div>

      </div>
    </div>
  );
};
