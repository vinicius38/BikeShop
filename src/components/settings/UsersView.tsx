import React, { useState, useEffect } from 'react';
import { UserCog, Plus, CheckCircle2, XCircle, Shield, User, Lock } from 'lucide-react';
import { userService, CreateUserDto } from '../../services/userService';
import { User as UserType, Role } from '../../types/api';
import { Modal } from '../common/Modal';

export const UsersView: React.FC = () => {
  const [users, setUsers] = useState<UserType[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [formData, setFormData] = useState<CreateUserDto>({
    name: '',
    username: '',
    email: '',
    password: '',
    roleId: 1,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const [uRes, rRes] = await Promise.allSettled([
        userService.getAll({ pageSize: 100 }),
        userService.getRoles(),
      ]);
      if (uRes.status === 'fulfilled') {
        const val = uRes.value as any;
        setUsers(Array.isArray(val) ? val : val?.items || []);
      }
      if (rRes.status === 'fulfilled') {
        const val = rRes.value as any;
        setRoles(Array.isArray(val) ? val : val?.items || []);
      }
    } catch (err) {
      console.warn('Erro ao carregar usuários:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleToggleActive = async (user: UserType) => {
    try {
      if (user.isActive) {
        await userService.deactivate(user.id);
      } else {
        await userService.activate(user.id);
      }
      loadUsers();
    } catch (err: any) {
      alert(err.message || 'Erro ao alterar status do usuário.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      if (editingUser) {
        await userService.update(editingUser.id, {
          name: formData.name,
          email: formData.email,
          roleId: formData.roleId,
          password: formData.password || undefined, // only send if filled
        });
      } else {
        await userService.create(formData);
      }
      setIsModalOpen(false);
      loadUsers();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao salvar usuário.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#F8F8F8] tracking-tight">
            Gerenciamento de Usuários
          </h2>
          <p className="text-xs text-[#ACB0B0]">
            Contas de acesso, papéis de técnico, vendedor e administrador
          </p>
        </div>

        <button
          onClick={() => {
            setEditingUser(null);
            setFormData({
              name: '',
              username: '',
              email: '',
              password: '',
              roleId: roles[0]?.id || 1,
            });
            setErrorMsg(null);
            setIsModalOpen(true);
          }}
          className="px-4 py-2.5 rounded-lg bg-[#EF7410] hover:bg-[#EF7410]/90 text-white font-semibold text-xs shadow-lg shadow-[#EF7410]/20 transition-colors flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Novo Usuário
        </button>
      </div>

      {/* Users Table */}
      <div className="rounded-xl border border-[#1F2E45] bg-[#0B1424] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1F2E45] bg-[#121E30]/70 text-[11px] font-semibold uppercase tracking-wider text-[#ACB0B0]">
                <th className="py-3 px-4 w-20 text-center"># Cód</th>
                <th className="py-3 px-4">Nome do Usuário</th>
                <th className="py-3 px-4">Login (Username)</th>
                <th className="py-3 px-4">E-mail</th>
                <th className="py-3 px-4">Cargo / Perfil</th>
                <th className="py-3 px-4">Último Acesso</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2E45] text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#ACB0B0]">
                    Carregando usuários...
                  </td>
                </tr>
              ) : (
                Array.isArray(users) &&
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-[#121E30]/50 transition-colors">
                    <td className="py-3 px-4 text-center font-mono font-bold text-[#EF7410]">
                      #{u.id}
                    </td>
                    <td className="py-3 px-4 font-semibold text-white flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#18263A] border border-[#1F2E45] flex items-center justify-center font-bold text-[#EF7410]">
                        {u.name.slice(0, 1)}
                      </div>
                      {u.name}
                    </td>
                    <td className="py-3 px-4 font-mono text-white">{u.username}</td>
                    <td className="py-3 px-4 text-[#ACB0B0]">{u.email}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] text-[#3B82F6]">
                        <Shield className="w-3.5 h-3.5" />
                        {u.roleName}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-[#ACB0B0]">
                      {u.lastLoginAt
                        ? new Date(u.lastLoginAt).toLocaleString('pt-BR')
                        : 'Nunca acessou'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {u.isActive ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#22C55E]/15 border border-[#22C55E]/30 text-[#22C55E]">
                          ATIVO
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444]">
                          INATIVO
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center flex items-center justify-center gap-2">
                      {u.id !== 1 && (
                        <>
                          <button
                            onClick={() => {
                              setEditingUser(u);
                              setFormData({
                                name: u.name,
                                username: u.username,
                                email: u.email,
                                password: '', // blank initially for update
                                roleId: u.roleId,
                              });
                              setErrorMsg(null);
                              setIsModalOpen(true);
                            }}
                            className="px-2 py-1 rounded text-[11px] font-semibold border border-[#3B82F6]/30 text-[#3B82F6] hover:bg-[#3B82F6]/10 transition-colors"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleToggleActive(u)}
                            className={`px-2 py-1 rounded text-[11px] font-semibold border transition-colors ${
                              u.isActive
                                ? 'text-[#EF4444] border-[#EF4444]/30 hover:bg-[#EF4444]/10'
                                : 'text-[#22C55E] border-[#22C55E]/30 hover:bg-[#22C55E]/10'
                            }`}
                          >
                            {u.isActive ? 'Desativar' : 'Ativar'}
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal New/Edit User */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingUser ? 'Editar Colaborador' : 'Cadastrar Novo Colaborador'}
          maxWidth="md"
        >
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {errorMsg && (
              <div className="p-2.5 rounded-lg bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444]">
                {errorMsg}
              </div>
            )}

            {/* Sequential Code Display (Database sequence, read-only) */}
            <div className="p-3 rounded-lg bg-[#0B1424] border border-[#1F2E45] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#18263A] border border-[#1F2E45] flex items-center justify-center text-[#EF7410]">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#ACB0B0] uppercase block">
                    Código do Usuário (Sequencial do Banco)
                  </span>
                  <span className="font-mono text-sm font-bold text-white">
                    {editingUser ? `#${editingUser.id}` : `Sequência Automática (#${users.length + 1})`}
                  </span>
                </div>
              </div>
              <span className="text-[10px] px-2.5 py-1 rounded bg-[#EF7410]/15 text-[#EF7410] border border-[#EF7410]/30 font-semibold flex items-center gap-1">
                <Lock className="w-3 h-3" /> Sequencial do Banco (Não Alterável)
              </span>
            </div>

            <div>
              <label className="block font-semibold text-[#ACB0B0] uppercase mb-1">
                Nome Completo *
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
                  Login / Usuário *
                </label>
                <input
                  type="text"
                  required
                  disabled={!!editingUser}
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className={`w-full p-2.5 rounded-lg border border-[#1F2E45] font-mono ${
                    !!editingUser ? 'bg-[#18263A] text-[#ACB0B0] cursor-not-allowed' : 'bg-[#121E30] text-white'
                  }`}
                />
              </div>

              <div>
                <label className="block font-semibold text-[#ACB0B0] uppercase mb-1">
                  Perfil de Acesso *
                </label>
                <select
                  value={formData.roleId}
                  disabled={editingUser?.id === 1}
                  onChange={(e) =>
                    setFormData({ ...formData, roleId: parseInt(e.target.value) })
                  }
                  className={`w-full p-2.5 rounded-lg border border-[#1F2E45] ${
                    editingUser?.id === 1
                      ? 'bg-[#18263A] text-[#ACB0B0] cursor-not-allowed'
                      : 'bg-[#121E30] text-white'
                  }`}
                >
                  {Array.isArray(roles) &&
                    roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#ACB0B0] uppercase mb-1">E-mail *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-2.5 rounded-lg bg-[#121E30] border border-[#1F2E45] text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#ACB0B0] uppercase mb-1">
                Senha {editingUser ? '(Deixe em branco para não alterar)' : '*'}
              </label>
              <input
                type="password"
                required={!editingUser}
                disabled={editingUser?.id === 1}
                placeholder={editingUser ? "Nova senha..." : "Mínimo 6 caracteres..."}
                value={formData.password || ''}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={`w-full p-2.5 rounded-lg border border-[#1F2E45] font-mono ${
                  editingUser?.id === 1
                    ? 'bg-[#18263A] text-[#ACB0B0] cursor-not-allowed'
                    : 'bg-[#121E30] text-white'
                }`}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1F2E45]">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-[#ACB0B0] hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-lg bg-[#EF7410] hover:bg-[#EF7410]/90 text-white font-semibold shadow-md"
              >
                {isSubmitting ? 'Salvando...' : editingUser ? 'Salvar Alterações' : 'Cadastrar Usuário'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
