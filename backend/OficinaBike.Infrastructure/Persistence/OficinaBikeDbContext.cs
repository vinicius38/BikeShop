using System;
using System.Reflection;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using OficinaBike.Application.Interfaces;
using OficinaBike.Domain.Entities;

namespace OficinaBike.Infrastructure.Persistence
{
    public class OficinaBikeDbContext : DbContext, IOficinaBikeDbContext
    {
        private readonly ICurrentUserService? _currentUserService;

        public OficinaBikeDbContext(DbContextOptions<OficinaBikeDbContext> options, ICurrentUserService? currentUserService = null)
            : base(options)
        {
            _currentUserService = currentUserService;
        }

        public DbSet<User> Users => Set<User>();
        public DbSet<UserRefreshToken> UserRefreshTokens => Set<UserRefreshToken>();
        public DbSet<Role> Roles => Set<Role>();
        public DbSet<Permission> Permissions => Set<Permission>();
        public DbSet<RolePermission> RolePermissions => Set<RolePermission>();

        public DbSet<Customer> Customers => Set<Customer>();
        public DbSet<Address> Addresses => Set<Address>();
        public DbSet<Bicycle> Bicycles => Set<Bicycle>();

        public DbSet<Supplier> Suppliers => Set<Supplier>();
        public DbSet<ProductCategory> ProductCategories => Set<ProductCategory>();
        public DbSet<Product> Products => Set<Product>();
        public DbSet<StockMovement> StockMovements => Set<StockMovement>();
        public DbSet<Service> Services => Set<Service>();

        public DbSet<WorkOrder> WorkOrders => Set<WorkOrder>();
        public DbSet<WorkOrderItem> WorkOrderItems => Set<WorkOrderItem>();
        public DbSet<WorkOrderStatusHistory> WorkOrderStatusHistories => Set<WorkOrderStatusHistory>();

        public DbSet<Sale> Sales => Set<Sale>();
        public DbSet<SaleItem> SaleItems => Set<SaleItem>();
        public DbSet<PaymentMethod> PaymentMethods => Set<PaymentMethod>();
        public DbSet<SalePayment> SalePayments => Set<SalePayment>();

        public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
        public DbSet<WorkshopSettings> WorkshopSettings => Set<WorkshopSettings>();

        public async Task<IDbContextTransaction> BeginTransactionAsync(CancellationToken cancellationToken = default)
        {
            return await Database.BeginTransactionAsync(cancellationToken);
        }

        public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            var currentUserId = _currentUserService?.UserId;

            foreach (var entry in ChangeTracker.Entries<BaseEntity>())
            {
                switch (entry.State)
                {
                    case EntityState.Added:
                        entry.Entity.CreatedAt = DateTime.UtcNow;
                        if (!entry.Entity.CreatedByUserId.HasValue && currentUserId.HasValue)
                        {
                            entry.Entity.CreatedByUserId = currentUserId;
                        }
                        break;

                    case EntityState.Modified:
                        entry.Entity.UpdatedAt = DateTime.UtcNow;
                        if (currentUserId.HasValue)
                        {
                            entry.Entity.UpdatedByUserId = currentUserId;
                        }
                        break;
                }
            }

            return await base.SaveChangesAsync(cancellationToken);
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
        }
    }
}
