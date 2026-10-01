using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using OficinaBike.Domain.Entities;

namespace OficinaBike.Application.Interfaces
{
    public interface IOficinaBikeDbContext
    {
        DbSet<User> Users { get; }
        DbSet<UserRefreshToken> UserRefreshTokens { get; }
        DbSet<Role> Roles { get; }
        DbSet<Permission> Permissions { get; }
        DbSet<RolePermission> RolePermissions { get; }

        DbSet<Customer> Customers { get; }
        DbSet<Address> Addresses { get; }
        DbSet<Bicycle> Bicycles { get; }

        DbSet<Supplier> Suppliers { get; }
        DbSet<ProductCategory> ProductCategories { get; }
        DbSet<Product> Products { get; }
        DbSet<StockMovement> StockMovements { get; }
        DbSet<Service> Services { get; }

        DbSet<WorkOrder> WorkOrders { get; }
        DbSet<WorkOrderItem> WorkOrderItems { get; }
        DbSet<WorkOrderStatusHistory> WorkOrderStatusHistories { get; }

        DbSet<Sale> Sales { get; }
        DbSet<SaleItem> SaleItems { get; }
        DbSet<PaymentMethod> PaymentMethods { get; }
        DbSet<SalePayment> SalePayments { get; }

        DbSet<AuditLog> AuditLogs { get; }
        DbSet<WorkshopSettings> WorkshopSettings { get; }

        Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
        Task<IDbContextTransaction> BeginTransactionAsync(CancellationToken cancellationToken = default);
    }

    public interface ICurrentUserService
    {
        int? UserId { get; }
        string? Username { get; }
        string? Role { get; }
        string? IpAddress { get; }
    }

    public interface IPasswordHasher
    {
        string HashPassword(string password);
        bool VerifyPassword(string password, string passwordHash);
    }

    public interface ITokenService
    {
        string GenerateAccessToken(User user, IEnumerable<string> permissions);
        string GenerateRefreshToken();
    }
}
