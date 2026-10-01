import React, { useState, useEffect } from 'react';
import { ShieldCheck, Check, Key, Save } from 'lucide-react';
import { userService } from '../../services/userService';
import { Permission, Role } from '../../types/api';

const MODULE_TRANSLATIONS: Record<string, string> = {
  "Geral": "Geral",
  "Dashboard": "Painel Inicial",
  "WorkOrders": "Ordens de Serviço",
  "Sales": "Vendas",
  "Stock": "Estoque",
  "Customers": "Clientes",
  "Users": "Usuários",
  "Settings": "Configurações",
  "Products": "Produtos",
  "Services": "Serviços",
  "Bicycles": "Bicicletas",
  "Workshop": "Oficina",
  "Reports": "Relatórios",
  "Auth": "Autenticação"
};

export const PermissionsView: React.FC = () => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  
  // Local state for role permissions
  const [rolePermissions, setRolePermissions] = useState<Record<number, Set<string>>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    Promise.allSettled([userService.getPermissions(), userService.getRoles()]).then(
      ([pRes, rRes]) => {
        if (pRes.status === 'fulfilled') {
          const val = pRes.value as any;
          setPermissions(Array.isArray(val) ? val : val?.items || []);
        }
        if (rRes.status === 'fulfilled') {
          const val = rRes.value as any;
          const fetchedRoles = Array.isArray(val) ? val : val?.items || [];
          setRoles(fetchedRoles);
          
          if (fetchedRoles.length > 0) {
            setSelectedRoleId(fetchedRoles[0].id);
          }

          // Initialize local permissions state for each role
          const initialPermissions: Record<number, Set<string>> = {};
          fetchedRoles.forEach((role: Role) => {
             initialPermissions[role.id] = new Set(role.permissions || []);
          });
          setRolePermissions(initialPermissions);
        }
        setIsLoading(false);
      }
    );
  }, []);

  const handleTogglePermission = (permissionCode: string) => {
    if (!selectedRoleId) return;
    
    setRolePermissions(prev => {
      const newPerms = new Set(prev[selectedRoleId]);
      if (newPerms.has(permissionCode)) {
        newPerms.delete(permissionCode);
      } else {
        newPerms.add(permissionCode);
      }
      return { ...prev, [selectedRoleId]: newPerms };
    });
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    if (!selectedRoleId) return;
    setIsSaving(true);
    
    try {
      const permissionsArray = Array.from(rolePermissions[selectedRoleId] || []);
      await userService.updateRolePermissions(selectedRoleId, permissionsArray);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to update permissions:', error);
      alert('Erro ao salvar permissões');
    } finally {
      setIsSaving(false);
    }
  };

  // Group permissions by module
  const grouped: { [module: string]: Permission[] } = {};
  if (Array.isArray(permissions)) {
    permissions.forEach((p) => {
      const mod = p.module || 'Geral';
      if (!grouped[mod]) grouped[mod] = [];
      grouped[mod].push(p);
    });
  }

  const getTranslatedModule = (module: string) => MODULE_TRANSLATIONS[module] || module;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-[#F8F8F8] tracking-tight">
            Matriz de Permissões de Acesso
          </h2>
          <p className="text-xs text-[#ACB0B0] mt-1">
            Configure o acesso de cada perfil do sistema aos diferentes módulos e funcionalidades.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving || !selectedRoleId}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
            saveSuccess 
              ? 'bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/50'
              : 'bg-[#EF7410] hover:bg-[#EF7410]/90 text-white shadow-sm'
          }`}
        >
          {isSaving ? (
            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : saveSuccess ? (
            <Check className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isSaving ? 'Salvando...' : saveSuccess ? 'Configurações Salvas' : 'Salvar Configurações'}
        </button>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-xs text-[#ACB0B0] animate-pulse">
          Carregando dados...
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          
          {/* Roles Selector */}
          <div className="w-full lg:w-64 shrink-0 space-y-2">
            <h3 className="text-sm font-bold text-white mb-3 px-1">Perfis de Acesso</h3>
            {roles.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelectedRoleId(r.id)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  selectedRoleId === r.id
                    ? 'bg-[#EF7410]/10 border-[#EF7410] shadow-sm'
                    : 'bg-[#0B1424] border-[#1F2E45] hover:border-[#1F2E45]/80 hover:bg-[#0B1424]/80'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className={`w-4 h-4 ${selectedRoleId === r.id ? 'text-[#EF7410]' : 'text-[#ACB0B0]'}`} />
                    <span className={`text-sm font-bold ${selectedRoleId === r.id ? 'text-white' : 'text-[#ACB0B0]'}`}>
                      {r.name}
                    </span>
                  </div>
                  {/* Indicator for modified/selected */}
                  {selectedRoleId === r.id && (
                     <div className="w-1.5 h-1.5 rounded-full bg-[#EF7410]" />
                  )}
                </div>
                <p className="text-[10px] text-[#ACB0B0] line-clamp-2 leading-tight">
                  {r.description}
                </p>
              </button>
            ))}
          </div>

          {/* Permissions List */}
          <div className="flex-1 w-full bg-[#0B1424] rounded-xl border border-[#1F2E45] overflow-hidden shadow-sm">
            <div className="px-5 py-4 bg-[#121E30] border-b border-[#1F2E45] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-[#ACB0B0]" />
                <span className="text-xs font-semibold uppercase tracking-wider text-white">
                  {selectedRoleId 
                    ? `Permissões: ${roles.find(r => r.id === selectedRoleId)?.name}`
                    : 'Selecione um perfil'}
                </span>
              </div>
              <span className="text-xs font-mono text-[#ACB0B0]">
                {selectedRoleId && rolePermissions[selectedRoleId] 
                  ? `${rolePermissions[selectedRoleId].size} ativas`
                  : ''}
              </span>
            </div>

            <div className="divide-y divide-[#1F2E45] max-h-[600px] overflow-y-auto custom-scrollbar">
              {!selectedRoleId ? (
                <div className="py-12 text-center text-xs text-[#ACB0B0]">
                  Selecione um perfil à esquerda para configurar as permissões.
                </div>
              ) : (
                Object.entries(grouped).map(([moduleName, perms]) => (
                  <div key={moduleName} className="p-5 space-y-3">
                    <h4 className="text-xs font-bold text-[#EF7410] uppercase tracking-wider flex items-center gap-2">
                      <div className="w-1 h-3 rounded-full bg-[#EF7410]" />
                      {getTranslatedModule(moduleName)}
                    </h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                      {perms.map((p) => {
                        const permCode = p.code || p.name;
                        const isChecked = rolePermissions[selectedRoleId]?.has(permCode);
                        return (
                          <label
                            key={permCode}
                            className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                              isChecked 
                                ? 'bg-[#22C55E]/5 border-[#22C55E]/30 hover:bg-[#22C55E]/10' 
                                : 'bg-[#121E30]/40 border-[#1F2E45] hover:bg-[#121E30]'
                            }`}
                          >
                            <div className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center border shrink-0 transition-colors ${
                              isChecked 
                                ? 'bg-[#22C55E] border-[#22C55E]' 
                                : 'border-[#4A5568] bg-[#0B1424]'
                            }`}>
                              {isChecked && <Check className="w-3 h-3 text-[#0B1424] stroke-[3]" />}
                            </div>
                            
                            <input
                              type="checkbox"
                              className="hidden"
                              checked={isChecked}
                              onChange={() => handleTogglePermission(permCode)}
                            />
                            
                            <div className="flex-1">
                              <div className={`font-semibold text-[11px] ${isChecked ? 'text-white' : 'text-[#ACB0B0]'}`}>
                                {p.name}
                              </div>
                              <div className="text-[10px] text-[#8C939D] leading-tight mt-1">
                                {p.description}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
