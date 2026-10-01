import React, { useState, useEffect, useRef } from 'react';
import { Search, X, User, Bike, Package, Wrench, ShoppingBag, ArrowRight } from 'lucide-react';
import { customerService } from '../../services/customerService';
import { bicycleService } from '../../services/bicycleService';
import { productService } from '../../services/productService';
import { workOrderService } from '../../services/workOrderService';
import { saleService } from '../../services/saleService';
import { maskCpfCnpj, maskCellPhone, maskPhone } from '../../utils/maskUtils';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: string, itemId?: number) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<{
    customers: any[];
    bicycles: any[];
    products: any[];
    workOrders: any[];
    sales: any[];
  }>({
    customers: [],
    bicycles: [],
    products: [],
    workOrders: [],
    sales: [],
  });

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setSearchTerm('');
      setResults({ customers: [], bicycles: [], products: [], workOrders: [], sales: [] });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!searchTerm.trim() || searchTerm.length < 2) {
      setResults({ customers: [], bicycles: [], products: [], workOrders: [], sales: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const [cRes, bRes, pRes, wRes, sRes] = await Promise.allSettled([
          customerService.getAll({ search: searchTerm, pageSize: 4 }),
          bicycleService.getAll({ search: searchTerm, pageSize: 4 }),
          productService.getAll({ search: searchTerm, pageSize: 4 }),
          workOrderService.getAll({ search: searchTerm, pageSize: 4 }),
          saleService.getAll({ search: searchTerm, pageSize: 4 }),
        ]);

        setResults({
          customers: cRes.status === 'fulfilled' ? cRes.value.items : [],
          bicycles: bRes.status === 'fulfilled' ? bRes.value.items : [],
          products: pRes.status === 'fulfilled' ? pRes.value.items : [],
          workOrders: wRes.status === 'fulfilled' ? wRes.value.items : [],
          sales: sRes.status === 'fulfilled' ? sRes.value.items : [],
        });
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  if (!isOpen) return null;

  const totalResults =
    results.customers.length +
    results.bicycles.length +
    results.products.length +
    results.workOrders.length +
    results.sales.length;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-start justify-center p-4 pt-16 sm:pt-24"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[#0B1424] border border-[#1F2E45] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] text-[#F8F8F8]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-[#1F2E45] bg-[#121E30]/70">
          <Search className="w-5 h-5 text-[#EF7410] shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar no sistema... (clientes, bicicletas, produtos, OS, vendas)"
            className="w-full bg-transparent text-sm text-[#F8F8F8] placeholder-[#ACB0B0] outline-hidden"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="p-1 text-[#ACB0B0] hover:text-white mr-2"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono text-[#ACB0B0] bg-[#18263A] border border-[#1F2E45] rounded">
            ESC
          </kbd>
        </div>

        {/* Results area */}
        <div className="p-4 overflow-y-auto grow custom-scrollbar space-y-4">
          {isLoading && (
            <div className="flex items-center justify-center py-10 text-xs text-[#ACB0B0]">
              <span className="w-5 h-5 border-2 border-[#EF7410] border-t-transparent rounded-full animate-spin mr-3" />
              Buscando em todos os registros...
            </div>
          )}

          {!isLoading && searchTerm.length >= 2 && totalResults === 0 && (
            <div className="py-10 text-center text-xs text-[#ACB0B0]">
              Nenhum resultado encontrado para &quot;<span className="text-white font-medium">{searchTerm}</span>&quot;.
            </div>
          )}

          {!isLoading && searchTerm.length < 2 && (
            <div className="py-8 text-center text-xs text-[#ACB0B0]">
              Digite ao menos 2 caracteres para pesquisar em clientes, bicicletas, produtos, ordens de serviço e vendas.
            </div>
          )}

          {/* Work Orders */}
          {results.workOrders.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#EF7410] mb-2 px-2">
                <Wrench className="w-3.5 h-3.5" />
                Ordens de Serviço ({results.workOrders.length})
              </div>
              <div className="space-y-1">
                {results.workOrders.map((os) => (
                  <button
                    key={os.id}
                    onClick={() => {
                      onNavigate('work-orders', os.id);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg bg-[#121E30]/50 hover:bg-[#18263A] border border-[#1F2E45] text-left transition-colors group"
                  >
                    <div>
                      <div className="text-sm font-semibold text-white group-hover:text-[#EF7410] transition-colors font-mono">
                        {os.number}
                      </div>
                      <div className="text-xs text-[#ACB0B0]">
                        {os.customerName} · {os.bicycleSummary}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-medium text-white">
                        R$ {Number(os.total).toFixed(2)}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#ACB0B0] group-hover:text-[#EF7410] transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Customers */}
          {results.customers.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#3B82F6] mb-2 px-2">
                <User className="w-3.5 h-3.5" />
                Clientes ({results.customers.length})
              </div>
              <div className="space-y-1">
                {results.customers.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      onNavigate('customers', c.id);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg bg-[#121E30]/50 hover:bg-[#18263A] border border-[#1F2E45] text-left transition-colors group"
                  >
                    <div>
                      <div className="text-sm font-semibold text-white group-hover:text-[#3B82F6] transition-colors">
                        {c.name}
                      </div>
                      <div className="text-xs text-[#ACB0B0]">
                        {maskCellPhone(c.cellPhone) || maskPhone(c.phone) || 'Sem telefone'} · {maskCpfCnpj(c.cpfCnpj)}
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[#ACB0B0] group-hover:text-[#3B82F6] transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Products */}
          {results.products.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#22C55E] mb-2 px-2">
                <Package className="w-3.5 h-3.5" />
                Produtos ({results.products.length})
              </div>
              <div className="space-y-1">
                {results.products.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onNavigate('products', p.id);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg bg-[#121E30]/50 hover:bg-[#18263A] border border-[#1F2E45] text-left transition-colors group"
                  >
                    <div>
                      <div className="text-sm font-semibold text-white group-hover:text-[#22C55E] transition-colors">
                        {p.name}
                      </div>
                      <div className="text-xs text-[#ACB0B0]">
                        Código: <span className="font-mono">{p.code}</span> · Estoque:{' '}
                        <span className="font-mono font-medium text-white">{p.stockQuantity}</span> {p.unit}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-semibold text-[#22C55E]">
                        R$ {Number(p.salePrice).toFixed(2)}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#ACB0B0] group-hover:text-[#22C55E] transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bicycles */}
          {results.bicycles.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#F59E0B] mb-2 px-2">
                <Bike className="w-3.5 h-3.5" />
                Bicicletas ({results.bicycles.length})
              </div>
              <div className="space-y-1">
                {results.bicycles.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => {
                      onNavigate('bicycles', b.id);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg bg-[#121E30]/50 hover:bg-[#18263A] border border-[#1F2E45] text-left transition-colors group"
                  >
                    <div>
                      <div className="text-sm font-semibold text-white group-hover:text-[#F59E0B] transition-colors">
                        {b.brand} {b.model} ({b.color})
                      </div>
                      <div className="text-xs text-[#ACB0B0]">
                        Cliente: {b.customerName} · Série: {b.serialNumber || 'N/A'}
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[#ACB0B0] group-hover:text-[#F59E0B] transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sales */}
          {results.sales.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-400 mb-2 px-2">
                <ShoppingBag className="w-3.5 h-3.5" />
                Vendas ({results.sales.length})
              </div>
              <div className="space-y-1">
                {results.sales.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      onNavigate('sales', s.id);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg bg-[#121E30]/50 hover:bg-[#18263A] border border-[#1F2E45] text-left transition-colors group"
                  >
                    <div>
                      <div className="text-sm font-semibold text-white group-hover:text-purple-400 transition-colors font-mono">
                        {s.number}
                      </div>
                      <div className="text-xs text-[#ACB0B0]">
                        {s.customerName || 'Consumidor Final'} · {new Date(s.date).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-medium text-white">
                        R$ {Number(s.total).toFixed(2)}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#ACB0B0] group-hover:text-purple-400 transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
