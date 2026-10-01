using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using OficinaBike.Application.Common;
using OficinaBike.Application.DTOs;
using OficinaBike.Application.Interfaces;
using OficinaBike.Domain.Entities;
using OficinaBike.Domain.Exceptions;

namespace OficinaBike.Application.Services
{
    public class AuthService : IAuthService
    {
        private readonly IOficinaBikeDbContext _context;
        private readonly IPasswordHasher _passwordHasher;
        private readonly ITokenService _tokenService;
        private readonly ICurrentUserService _currentUserService;
        private readonly IAuditService _auditService;

        public AuthService(
            IOficinaBikeDbContext context,
            IPasswordHasher passwordHasher,
            ITokenService tokenService,
            ICurrentUserService currentUserService,
            IAuditService auditService)
        {
            _context = context;
            _passwordHasher = passwordHasher;
            _tokenService = tokenService;
            _currentUserService = currentUserService;
            _auditService = auditService;
        }

        public async Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
        {
            var user = await _context.Users
                .Include(u => u.Role)
                .ThenInclude(r => r.RolePermissions)
                .ThenInclude(rp => rp.Permission)
                .FirstOrDefaultAsync(u => u.Username.ToLower() == request.Username.ToLower(), cancellationToken);

            if (user == null || !_passwordHasher.VerifyPassword(request.Password, user.PasswordHash))
            {
                throw new BusinessRuleException("Credenciais inválidas. Verifique o usuário e a senha.");
            }

            if (!user.IsActive)
            {
                throw new BusinessRuleException("Usuário inativo. Contate o administrador do sistema.");
            }

            user.LastLoginAt = DateTime.UtcNow;

            var permissions = user.Role.RolePermissions.Select(rp => rp.Permission.Code).Distinct().ToList();
            var accessToken = _tokenService.GenerateAccessToken(user, permissions);
            var refreshTokenString = _tokenService.GenerateRefreshToken();

            var refreshToken = new UserRefreshToken
            {
                UserId = user.Id,
                Token = refreshTokenString,
                ExpiresAt = DateTime.UtcNow.AddDays(7),
                IsRevoked = false,
                CreatedAt = DateTime.UtcNow
            };

            _context.UserRefreshTokens.Add(refreshToken);
            await _context.SaveChangesAsync(cancellationToken);

            await _auditService.LogAsync("User", user.Id.ToString(), "Login", null, new { Username = user.Username }, cancellationToken);

            return new AuthResponse
            {
                AccessToken = accessToken,
                RefreshToken = refreshTokenString,
                ExpiresAt = DateTime.UtcNow.AddHours(8),
                User = MapUserToResponse(user, permissions)
            };
        }

        public async Task<AuthResponse> RefreshTokenAsync(RefreshTokenRequest request, CancellationToken cancellationToken = default)
        {
            var tokenRecord = await _context.UserRefreshTokens
                .Include(t => t.User)
                .ThenInclude(u => u.Role)
                .ThenInclude(r => r.RolePermissions)
                .ThenInclude(rp => rp.Permission)
                .FirstOrDefaultAsync(t => t.Token == request.RefreshToken, cancellationToken);

            if (tokenRecord == null || tokenRecord.IsRevoked || tokenRecord.ExpiresAt <= DateTime.UtcNow)
            {
                throw new BusinessRuleException("Token de atualização inválido ou expirado.");
            }

            var user = tokenRecord.User;
            if (!user.IsActive)
            {
                throw new BusinessRuleException("Usuário inativo.");
            }

            // Revoke previous refresh token
            tokenRecord.IsRevoked = true;

            var permissions = user.Role.RolePermissions.Select(rp => rp.Permission.Code).Distinct().ToList();
            var newAccessToken = _tokenService.GenerateAccessToken(user, permissions);
            var newRefreshTokenString = _tokenService.GenerateRefreshToken();

            var newRefreshToken = new UserRefreshToken
            {
                UserId = user.Id,
                Token = newRefreshTokenString,
                ExpiresAt = DateTime.UtcNow.AddDays(7),
                IsRevoked = false,
                CreatedAt = DateTime.UtcNow
            };

            _context.UserRefreshTokens.Add(newRefreshToken);
            await _context.SaveChangesAsync(cancellationToken);

            return new AuthResponse
            {
                AccessToken = newAccessToken,
                RefreshToken = newRefreshTokenString,
                ExpiresAt = DateTime.UtcNow.AddHours(8),
                User = MapUserToResponse(user, permissions)
            };
        }

        public async Task ChangePasswordAsync(ChangePasswordRequest request, CancellationToken cancellationToken = default)
        {
            var userId = _currentUserService.UserId;
            if (!userId.HasValue)
                throw new BusinessRuleException("Usuário não autenticado.");

            var user = await _context.Users.FindAsync(new object[] { userId.Value }, cancellationToken);
            if (user == null)
                throw new NotFoundException("Usuário", userId.Value);

            if (!_passwordHasher.VerifyPassword(request.CurrentPassword, user.PasswordHash))
                throw new BusinessRuleException("A senha atual informada está incorreta.");

            user.PasswordHash = _passwordHasher.HashPassword(request.NewPassword);
            user.UpdatedAt = DateTime.UtcNow;
            user.UpdatedByUserId = userId;

            await _context.SaveChangesAsync(cancellationToken);
            await _auditService.LogAsync("User", user.Id.ToString(), "ChangePassword", null, null, cancellationToken);
        }

        public async Task<UserResponse> GetCurrentUserAsync(CancellationToken cancellationToken = default)
        {
            var userId = _currentUserService.UserId;
            if (!userId.HasValue)
                throw new BusinessRuleException("Usuário não autenticado.");

            var user = await _context.Users
                .AsNoTracking()
                .Include(u => u.Role)
                .ThenInclude(r => r.RolePermissions)
                .ThenInclude(rp => rp.Permission)
                .FirstOrDefaultAsync(u => u.Id == userId.Value, cancellationToken);

            if (user == null)
                throw new NotFoundException("Usuário", userId.Value);

            var permissions = user.Role.RolePermissions.Select(rp => rp.Permission.Code).Distinct().ToList();
            return MapUserToResponse(user, permissions);
        }

        private static UserResponse MapUserToResponse(User user, List<string> permissions)
        {
            return new UserResponse
            {
                Id = user.Id,
                Name = user.Name,
                Username = user.Username,
                Email = user.Email,
                IsActive = user.IsActive,
                RoleId = user.RoleId,
                RoleName = user.Role?.Name ?? string.Empty,
                Permissions = permissions,
                LastLoginAt = user.LastLoginAt,
                CreatedAt = user.CreatedAt
            };
        }
    }

    public class UserService : IUserService
    {
        private readonly IOficinaBikeDbContext _context;
        private readonly IPasswordHasher _passwordHasher;
        private readonly ICurrentUserService _currentUserService;
        private readonly IAuditService _auditService;

        public UserService(
            IOficinaBikeDbContext context,
            IPasswordHasher passwordHasher,
            ICurrentUserService currentUserService,
            IAuditService auditService)
        {
            _context = context;
            _passwordHasher = passwordHasher;
            _currentUserService = currentUserService;
            _auditService = auditService;
        }

        public async Task<PagedResult<UserResponse>> GetUsersAsync(PagedRequest request, CancellationToken cancellationToken = default)
        {
            var query = _context.Users
                .AsNoTracking()
                .Include(u => u.Role)
                .ThenInclude(r => r.RolePermissions)
                .ThenInclude(rp => rp.Permission)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(request.Search))
            {
                var term = request.Search.Trim().ToLower();
                query = query.Where(u => u.Name.ToLower().Contains(term) ||
                                         u.Username.ToLower().Contains(term) ||
                                         u.Email.ToLower().Contains(term));
            }

            var totalItems = await query.CountAsync(cancellationToken);
            var page = Math.Max(1, request.Page);
            var pageSize = Math.Clamp(request.PageSize, 1, 100);

            var users = await query
                .OrderBy(u => u.Name)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(cancellationToken);

            var dtos = users.Select(u => new UserResponse
            {
                Id = u.Id,
                Name = u.Name,
                Username = u.Username,
                Email = u.Email,
                IsActive = u.IsActive,
                RoleId = u.RoleId,
                RoleName = u.Role?.Name ?? string.Empty,
                Permissions = u.Role?.RolePermissions.Select(rp => rp.Permission.Code).Distinct().ToList() ?? new List<string>(),
                LastLoginAt = u.LastLoginAt,
                CreatedAt = u.CreatedAt
            }).ToList();

            return new PagedResult<UserResponse>(dtos, totalItems, page, pageSize);
        }

        public async Task<UserResponse> GetByIdAsync(int id, CancellationToken cancellationToken = default)
        {
            var user = await _context.Users
                .AsNoTracking()
                .Include(u => u.Role)
                .ThenInclude(r => r.RolePermissions)
                .ThenInclude(rp => rp.Permission)
                .FirstOrDefaultAsync(u => u.Id == id, cancellationToken);

            if (user == null)
                throw new NotFoundException("Usuário", id);

            var permissions = user.Role?.RolePermissions.Select(rp => rp.Permission.Code).Distinct().ToList() ?? new List<string>();

            return new UserResponse
            {
                Id = user.Id,
                Name = user.Name,
                Username = user.Username,
                Email = user.Email,
                IsActive = user.IsActive,
                RoleId = user.RoleId,
                RoleName = user.Role?.Name ?? string.Empty,
                Permissions = permissions,
                LastLoginAt = user.LastLoginAt,
                CreatedAt = user.CreatedAt
            };
        }

        public async Task<UserResponse> CreateAsync(CreateUserRequest request, CancellationToken cancellationToken = default)
        {
            var usernameExists = await _context.Users.AnyAsync(u => u.Username.ToLower() == request.Username.ToLower(), cancellationToken);
            if (usernameExists)
                throw new BusinessRuleException($"O nome de usuário '{request.Username}' já está em uso.");

            var emailExists = await _context.Users.AnyAsync(u => u.Email.ToLower() == request.Email.ToLower(), cancellationToken);
            if (emailExists)
                throw new BusinessRuleException($"O e-mail '{request.Email}' já está cadastrado.");

            var roleExists = await _context.Roles.AnyAsync(r => r.Id == request.RoleId, cancellationToken);
            if (!roleExists)
                throw new BusinessRuleException("A função (Role) informada não existe.");

            var currentUserId = _currentUserService.UserId;

            var user = new User
            {
                Name = request.Name.Trim(),
                Username = request.Username.Trim(),
                Email = request.Email.Trim().ToLower(),
                PasswordHash = _passwordHasher.HashPassword(request.Password),
                RoleId = request.RoleId,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                CreatedByUserId = currentUserId
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync(cancellationToken);

            await _auditService.LogAsync("User", user.Id.ToString(), "Create", null, new { user.Username, user.Email, user.RoleId }, cancellationToken);

            return await GetByIdAsync(user.Id, cancellationToken);
        }

        public async Task<UserResponse> UpdateAsync(int id, UpdateUserRequest request, CancellationToken cancellationToken = default)
        {
            var user = await _context.Users.FindAsync(new object[] { id }, cancellationToken);
            if (user == null)
                throw new NotFoundException("Usuário", id);

            if (id == 1)
            {
                if (request.RoleId != user.RoleId)
                    throw new BusinessRuleException("Não é possível alterar a permissão deste usuário administrador principal.");
                if (!request.IsActive)
                    throw new BusinessRuleException("Não é possível inativar este usuário administrador principal.");
            }

            var emailExists = await _context.Users.AnyAsync(u => u.Email.ToLower() == request.Email.ToLower() && u.Id != id, cancellationToken);
            if (emailExists)
                throw new BusinessRuleException($"O e-mail '{request.Email}' já está cadastrado para outro usuário.");

            var roleExists = await _context.Roles.AnyAsync(r => r.Id == request.RoleId, cancellationToken);
            if (!roleExists)
                throw new BusinessRuleException("A função informada não existe.");

            var oldValues = new { user.Name, user.Email, user.RoleId, user.IsActive };

            user.Name = request.Name.Trim();
            user.Email = request.Email.Trim().ToLower();
            user.RoleId = request.RoleId;
            user.IsActive = request.IsActive;
            
            if (!string.IsNullOrWhiteSpace(request.Password))
            {
                if (id == 1)
                {
                    throw new BusinessRuleException("Não é possível alterar a senha deste usuário administrador principal por aqui.");
                }
                user.PasswordHash = _passwordHasher.HashPassword(request.Password);
            }

            user.UpdatedAt = DateTime.UtcNow;
            user.UpdatedByUserId = _currentUserService.UserId;

            await _context.SaveChangesAsync(cancellationToken);

            await _auditService.LogAsync("User", user.Id.ToString(), "Update", oldValues, new { user.Name, user.Email, user.RoleId, user.IsActive }, cancellationToken);

            return await GetByIdAsync(user.Id, cancellationToken);
        }

        public async Task SetActiveStatusAsync(int id, bool isActive, CancellationToken cancellationToken = default)
        {
            var user = await _context.Users.FindAsync(new object[] { id }, cancellationToken);
            if (user == null)
                throw new NotFoundException("Usuário", id);

            if (!isActive && id == 1)
                throw new BusinessRuleException("Não é possível inativar o usuário administrador principal.");

            user.IsActive = isActive;
            user.UpdatedAt = DateTime.UtcNow;
            user.UpdatedByUserId = _currentUserService.UserId;

            await _context.SaveChangesAsync(cancellationToken);
            await _auditService.LogAsync("User", user.Id.ToString(), isActive ? "Activate" : "Deactivate", null, new { IsActive = isActive }, cancellationToken);
        }

        public async Task<List<RoleResponse>> GetRolesAsync(CancellationToken cancellationToken = default)
        {
            var roles = await _context.Roles
                .AsNoTracking()
                .Include(r => r.RolePermissions)
                .ThenInclude(rp => rp.Permission)
                .ToListAsync(cancellationToken);

            return roles.Select(r => new RoleResponse
            {
                Id = r.Id,
                Name = r.Name,
                Description = r.Description,
                Permissions = r.RolePermissions.Select(rp => rp.Permission.Code).Distinct().ToList()
            }).ToList();
        }

        public async Task<RoleResponse> UpdateRolePermissionsAsync(int id, UpdateRolePermissionsRequest request, CancellationToken cancellationToken = default)
        {
            var role = await _context.Roles
                .Include(r => r.RolePermissions)
                .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

            if (role == null)
                throw new NotFoundException("Função (Role)", id);

            var permissions = await _context.Permissions
                .Where(p => request.Permissions.Contains(p.Code))
                .ToListAsync(cancellationToken);

            _context.RolePermissions.RemoveRange(role.RolePermissions);

            foreach (var permission in permissions)
            {
                role.RolePermissions.Add(new RolePermission
                {
                    RoleId = role.Id,
                    PermissionId = permission.Id
                });
            }

            await _context.SaveChangesAsync(cancellationToken);
            await _auditService.LogAsync("Role", role.Id.ToString(), "UpdatePermissions", null, new { request.Permissions }, cancellationToken);

            return new RoleResponse
            {
                Id = role.Id,
                Name = role.Name,
                Description = role.Description,
                Permissions = permissions.Select(p => p.Code).ToList()
            };
        }

        public async Task<List<PermissionResponse>> GetPermissionsAsync(CancellationToken cancellationToken = default)
        {
            var permissions = await _context.Permissions
                .AsNoTracking()
                .OrderBy(p => p.Module)
                .ThenBy(p => p.Name)
                .ToListAsync(cancellationToken);

            return permissions.Select(p => new PermissionResponse
            {
                Id = p.Id,
                Name = p.Name,
                Code = p.Code,
                Module = p.Module,
                Description = p.Description
            }).ToList();
        }
    }
}
