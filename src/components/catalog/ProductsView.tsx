import React, { useState, useEffect, useCallback } from 'react';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  Edit,
  Trash2,
  Layers,
  ArrowUpDown,
  Lock,
} from 'lucide-react';
import { productService } from '../../services/productService';
import { supplierService } from '../../services/supplierService';
import { Product, ProductCategory, Supplier } from '../../types/api';
import { Pagination } from '../common/Pagination';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { maskCurrency, formatCurrencyTwoDecimals, parseCurrency } from '../../utils/maskUtils';

export const ProductsView: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [isLoading, setIsLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | ''>('');
  const [filterLowStockOnly, setFilterLowStockOnly] = useState<boolean>(false);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    barcode: '',
    name: '',
    description: '',
    categoryId: 1,
    supplierId: '' as number | '',
    costPrice: '0,00',
    salePrice: '0,00',
    stockQuantity: 0,
    minimumStockQuantity: 5,
    unit: 'UN',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Stock Adjust Modal
  const [adjustModalProduct, setAdjustModalProduct] = useState<Product | null>(null);
  const [adjustQty, setAdjustQty] = useState<number>(0);
  const [adjustType, setAdjustType] = useState<'In' | 'Out' | 'Adjustment'>('In');
  const [adjustMode, setAdjustMode] = useState<'add' | 'replace'>('replace');
  const [adjustReason, setAdjustReason] = useState('');

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await productService.getAll({
        page,
        pageSize,
        search: search || undefined,
        categoryId: selectedCategory || undefined,
        isLowStock: filterLowStockOnly || undefined,
      });
      setProducts(res.items);
      setTotalItems(res.totalItems);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.warn('Erro ao carregar produtos:', err);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, search, selectedCategory, filterLowStockOnly]);

  useEffect(() => {
    productService.getCategories().then(setCategories).catch(console.warn);
    supplierService.getAll({ pageSize: 50 }).then((res) => setSuppliers(res.items)).catch(console.warn);
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleOpenCreate = async () => {
    setEditingProduct(null);
    let nextCode = '...';
    try {
      nextCode = await productService.getNextCode();
    } catch {
      nextCode = `${(totalItems || 0) + 1}`;
    }

    setFormData({
      code: nextCode,
      barcode: '',
      name: '',
      description: '',
      categoryId: categories[0]?.id || 1,
      supplierId: '',
      costPrice: '0,00',
      salePrice: '0,00',
      stockQuantity: 10,
      minimumStockQuantity: 5,
      unit: 'UN',
    });
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      code: p.code,
      barcode: p.barcode || '',
      name: p.name,
      description: p.description || '',
      categoryId: p.categoryId,
      supplierId: p.supplierId || '',
      costPrice: formatCurrencyTwoDecimals(p.costPrice),
      salePrice: formatCurrencyTwoDecimals(p.salePrice),
      stockQuantity: p.stockQuantity,
      minimumStockQuantity: p.minimumStockQuantity,
      unit: p.unit,
    });
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const payload = {
        ...formData,
        costPrice: parseCurrency(formData.costPrice),
        salePrice: parseCurrency(formData.salePrice),
        supplierId: formData.supplierId ? Number(formData.supplierId) : null,
      };

      if (editingProduct) {
        await productService.update(editingProduct.id, payload);
      } else {
        await productService.create(payload);
      }
      setIsModalOpen(false);
      loadProducts();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao salvar produto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStockAdjust = async () => {
    if (!adjustModalProduct || adjustQty <= 0) return;
    try {
      let finalQty = adjustQty;
      
      // If it's an adjustment and user wants to REPLACE the stock, calculate the difference
      if (adjustType === 'Adjustment' && adjustMode === 'replace') {
        finalQty = adjustQty - adjustModalProduct.stockQuantity;
        // If finalQty is 0, nothing changed, but we can still send 0 or just ignore.
        // The backend takes the number to add/subtract. 
        // e.g., if stock is 10, user inputs 15. finalQty = 5.
        // if stock is 10, user inputs 8. finalQty = -2.
        if (finalQty === 0) {
           setAdjustModalProduct(null);
           setAdjustQty(0);
           setAdjustReason('');
           return;
        }
      }

      // If finalQty < 0, it should be an 'Out' technically, but the backend Adjustment takes positive or negative?
      // Wait, in productService: `const qty = type === 'Out' ? -Math.abs(quantity) : Math.abs(quantity);`
      // This means for 'Adjustment', the productService does `Math.abs(quantity)`! So it always ADDS!
      // This is a bug in productService.ts. Let's fix productService.ts too.

      await productService.updateStock(
        adjustModalProduct.id,
        finalQty,
        adjustType,
        adjustReason || undefined
      );
      setAdjustModalProduct(null);
      setAdjustQty(0);
      setAdjustReason('');
      loadProducts();
    } catch (err: any) {
      alert(err.message || 'Erro ao movimentar estoque.');
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#F8F8F8] tracking-tight">
            Catálogo de Produtos & Peças
          </h2>
          <p className="text-xs text-[#ACB0B0]">
            Controle de estoque, preços de custo, venda e parâmetros de reposição
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-lg bg-[#EF7410] hover:bg-[#EF7410]/90 text-white font-semibold text-xs shadow-lg shadow-[#EF7410]/20 transition-colors flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Novo Produto
        </button>
      </div>

      {/* Filter toolbar */}
      <div className="p-4 rounded-xl bg-[#0B1424] border border-[#1F2E45] grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-[#ACB0B0] absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Buscar por código, nome ou código de barras..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#121E30] border border-[#1F2E45] text-xs text-white placeholder-[#ACB0B0] outline-hidden focus:border-[#EF7410]"
          />
        </div>

        <div>
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value ? Number(e.target.value) : '');
              setPage(1);
            }}
            className="w-full py-2 px-3 rounded-lg bg-[#121E30] border border-[#1F2E45] text-xs text-white outline-hidden focus:border-[#EF7410]"
          >
            <option value="">Todas as Categorias</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center">
          <label className="flex items-center gap-2 text-xs font-semibold text-[#ACB0B0] cursor-pointer hover:text-white">
            <input
              type="checkbox"
              checked={filterLowStockOnly}
              onChange={(e) => {
                setFilterLowStockOnly(e.target.checked);
                setPage(1);
              }}
              className="rounded bg-[#121E30] border-[#1F2E45] text-[#EF7410] focus:ring-0"
            />
            Filtrar Apenas Estoque Baixo
          </label>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[#1F2E45] bg-[#0B1424] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1F2E45] bg-[#121E30]/70 text-[11px] font-semibold uppercase tracking-wider text-[#ACB0B0]">
                <th className="py-3 px-4">SKU / Código</th>
                <th className="py-3 px-4">Nome do Produto</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4 text-right">Preço Venda</th>
                <th className="py-3 px-4 text-center">Estoque Atual</th>
                <th className="py-3 px-4 text-center">Mínimo</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2E45] text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-[#ACB0B0]">
                    Carregando produtos...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-[#ACB0B0]">
                    Nenhum produto encontrado.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const isLow = p.stockQuantity <= p.minimumStockQuantity;
                  return (
                    <tr key={p.id} className="hover:bg-[#121E30]/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-white">
                        {p.code}
                        {p.barcode && (
                          <div className="text-[10px] text-[#ACB0B0] font-normal">
                            EAN: {p.barcode}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{p.name}</div>
                        {p.supplierName && (
                          <div className="text-[10px] text-[#ACB0B0]">
                            Forn: {p.supplierName}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-[#ACB0B0]">{p.categoryName}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-[#22C55E]">
                        R$ {formatCurrencyTwoDecimals(p.salePrice)}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold">
                        <span className={isLow ? 'text-[#EF4444]' : 'text-white'}>
                          {p.stockQuantity} {p.unit}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-[#ACB0B0]">
                        {p.minimumStockQuantity} {p.unit}
                      </td>
                      <td className="py-3 px-4">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 font-bold text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444]">
                            <AlertTriangle className="w-3 h-3" />
                            ESTOQUE BAIXO
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-[#22C55E]/15 border border-[#22C55E]/30 text-[#22C55E]">
                            EM DIA
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setAdjustModalProduct(p)}
                            className="p-1.5 rounded-lg text-[#ACB0B0] hover:text-[#EF7410] hover:bg-[#18263A]"
                            title="Ajustar Estoque"
                          >
                            <ArrowUpDown className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 rounded-lg text-[#ACB0B0] hover:text-white hover:bg-[#18263A]"
                            title="Editar Produto"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      </div>

      {/* Product Create / Edit Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingProduct ? 'Editar Produto' : 'Cadastrar Novo Produto'}
          maxWidth="2xl"
        >
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {errorMsg && (
              <div className="p-2.5 rounded-lg bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444]">
                {errorMsg}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#ACB0B0] uppercase mb-1 flex items-center justify-between">
                  <span>Código / SKU</span>
                  <span className="text-[10px] text-[#EF7410] font-normal flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Sequencial do Banco
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={formData.code}
                    className="w-full pl-3 pr-8 py-2.5 rounded-lg bg-[#0B1424] border border-[#1F2E45] text-[#ACB0B0] font-mono cursor-not-allowed select-none opacity-85"
                  />
                  <Lock className="w-4 h-4 text-[#ACB0B0] absolute right-2.5 top-3 opacity-60" />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-[#ACB0B0] uppercase mb-1">
                  Código de Barras (EAN)
                </label>
                <input
                  type="text"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  className="w-full p-2.5 rounded-lg bg-[#121E30] border border-[#1F2E45] text-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#ACB0B0] uppercase mb-1">
                Nome do Produto *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2.5 rounded-lg bg-[#121E30] border border-[#1F2E45] text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#ACB0B0] uppercase mb-1">
                  Categoria *
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) =>
                    setFormData({ ...formData, categoryId: parseInt(e.target.value) })
                  }
                  className="w-full p-2.5 rounded-lg bg-[#121E30] border border-[#1F2E45] text-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#ACB0B0] uppercase mb-1">
                  Fornecedor
                </label>
                <select
                  value={formData.supplierId}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      supplierId: e.target.value ? parseInt(e.target.value) : '',
                    })
                  }
                  className="w-full p-2.5 rounded-lg bg-[#121E30] border border-[#1F2E45] text-white"
                >
                  <option value="">Nenhum fornecedor vinculado</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.tradeName || s.corporateName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-[#ACB0B0] uppercase mb-1">
                  Preço Custo (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-xs">R$</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={formData.costPrice}
                    onChange={(e) =>
                      setFormData({ ...formData, costPrice: maskCurrency(e.target.value) })
                    }
                    onBlur={() =>
                      setFormData({ ...formData, costPrice: formatCurrencyTwoDecimals(formData.costPrice) })
                    }
                    placeholder="0,00"
                    className="w-full pl-9 p-2.5 rounded-lg bg-[#121E30] border border-[#1F2E45] text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#ACB0B0] uppercase mb-1">
                  Preço Venda (R$) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-xs">R$</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    required
                    value={formData.salePrice}
                    onChange={(e) =>
                      setFormData({ ...formData, salePrice: maskCurrency(e.target.value) })
                    }
                    onBlur={() =>
                      setFormData({ ...formData, salePrice: formatCurrencyTwoDecimals(formData.salePrice) })
                    }
                    placeholder="0,00"
                    className="w-full pl-9 p-2.5 rounded-lg bg-[#121E30] border border-[#1F2E45] text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#ACB0B0] uppercase mb-1">
                  Unidade
                </label>
                <input
                  type="text"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full p-2.5 rounded-lg bg-[#121E30] border border-[#1F2E45] text-white font-mono uppercase"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#ACB0B0] uppercase mb-1">
                  Estoque Inicial
                </label>
                <input
                  type="number"
                  value={formData.stockQuantity}
                  onChange={(e) =>
                    setFormData({ ...formData, stockQuantity: parseInt(e.target.value) || 0 })
                  }
                  className="w-full p-2.5 rounded-lg bg-[#121E30] border border-[#1F2E45] text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#ACB0B0] uppercase mb-1">
                  Estoque Mínimo (Alerta)
                </label>
                <input
                  type="number"
                  value={formData.minimumStockQuantity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      minimumStockQuantity: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full p-2.5 rounded-lg bg-[#121E30] border border-[#1F2E45] text-white font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#1F2E45]">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-lg text-[#ACB0B0] hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-lg bg-[#EF7410] hover:bg-[#EF7410]/90 text-white font-semibold shadow-md"
              >
                {isSubmitting ? 'Salvando...' : 'Salvar Produto'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Stock Adjust Modal */}
      {adjustModalProduct && (
        <Modal
          isOpen={!!adjustModalProduct}
          onClose={() => setAdjustModalProduct(null)}
          title={`Movimentar Estoque · ${adjustModalProduct.name}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-lg bg-[#121E30] border border-[#1F2E45] flex items-center justify-between">
              <span className="text-[#ACB0B0]">Estoque Atual:</span>
              <span className="font-mono text-base font-bold text-white">
                {adjustModalProduct.stockQuantity} {adjustModalProduct.unit}
              </span>
            </div>

            <div>
              <label className="block font-semibold text-[#ACB0B0] uppercase mb-1">
                Tipo de Movimentação
              </label>
              <select
                value={adjustType}
                onChange={(e) => setAdjustType(e.target.value as any)}
                className="w-full p-2 rounded-lg bg-[#121E30] border border-[#1F2E45] text-white"
              >
                <option value="In">Entrada de Estoque (+)</option>
                <option value="Out">Saída Manual (-)</option>
                <option value="Adjustment">Ajuste de Balanço / Inventário</option>
              </select>
            </div>

            {adjustType === 'Adjustment' && (
              <div className="flex gap-4 mt-2 mb-2">
                <label className="flex items-center gap-2 text-white cursor-pointer">
                  <input
                    type="radio"
                    name="adjustMode"
                    value="replace"
                    checked={adjustMode === 'replace'}
                    onChange={() => setAdjustMode('replace')}
                    className="accent-[#EF7410]"
                  />
                  <span>Substituir quantidade atual</span>
                </label>
                <label className="flex items-center gap-2 text-white cursor-pointer">
                  <input
                    type="radio"
                    name="adjustMode"
                    value="add"
                    checked={adjustMode === 'add'}
                    onChange={() => setAdjustMode('add')}
                    className="accent-[#EF7410]"
                  />
                  <span>Somar à quantidade atual</span>
                </label>
              </div>
            )}

            <div>
              <label className="block font-semibold text-[#ACB0B0] uppercase mb-1">
                Quantidade {adjustType === 'Adjustment' && adjustMode === 'replace' ? '(Novo Saldo)' : '(Para movimentar)'}
              </label>
              <input
                type="number"
                min="0"
                value={adjustQty || ''}
                onChange={(e) => setAdjustQty(parseInt(e.target.value) || 0)}
                placeholder="Ex: 5"
                className="w-full p-2 rounded-lg bg-[#121E30] border border-[#1F2E45] text-white font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#ACB0B0] uppercase mb-1">
                Motivo / Justificativa
              </label>
              <input
                type="text"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="Ex: Recebimento de compra do fornecedor..."
                className="w-full p-2 rounded-lg bg-[#121E30] border border-[#1F2E45] text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1F2E45]">
              <button
                type="button"
                onClick={() => setAdjustModalProduct(null)}
                className="px-4 py-2 text-[#ACB0B0] hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleStockAdjust}
                className="px-4 py-2 bg-[#EF7410] hover:bg-[#EF7410]/90 text-white font-semibold rounded-lg"
              >
                Confirmar Movimentação
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
