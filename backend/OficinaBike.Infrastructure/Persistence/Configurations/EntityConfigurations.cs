using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OficinaBike.Domain.Entities;

namespace OficinaBike.Infrastructure.Persistence.Configurations
{
    public class UserConfiguration : IEntityTypeConfiguration<User>
    {
        public void Configure(EntityTypeBuilder<User> builder)
        {
            builder.ToTable("Users");
            builder.HasKey(u => u.Id);

            builder.Property(u => u.Name).IsRequired().HasMaxLength(150);
            builder.Property(u => u.Username).IsRequired().HasMaxLength(50);
            builder.Property(u => u.Email).IsRequired().HasMaxLength(100);
            builder.Property(u => u.PasswordHash).IsRequired().HasMaxLength(255);

            builder.HasIndex(u => u.Username).IsUnique();
            builder.HasIndex(u => u.Email).IsUnique();

            builder.HasOne(u => u.Role)
                .WithMany(r => r.Users)
                .HasForeignKey(u => u.RoleId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }

    public class RoleConfiguration : IEntityTypeConfiguration<Role>
    {
        public void Configure(EntityTypeBuilder<Role> builder)
        {
            builder.ToTable("Roles");
            builder.HasKey(r => r.Id);
            builder.Property(r => r.Name).IsRequired().HasMaxLength(50);
            builder.Property(r => r.Description).HasMaxLength(250);
        }
    }

    public class PermissionConfiguration : IEntityTypeConfiguration<Permission>
    {
        public void Configure(EntityTypeBuilder<Permission> builder)
        {
            builder.ToTable("Permissions");
            builder.HasKey(p => p.Id);
            builder.Property(p => p.Code).IsRequired().HasMaxLength(100);
            builder.Property(p => p.Name).IsRequired().HasMaxLength(100);
            builder.Property(p => p.Module).IsRequired().HasMaxLength(50);
            builder.HasIndex(p => p.Code).IsUnique();
        }
    }

    public class RolePermissionConfiguration : IEntityTypeConfiguration<RolePermission>
    {
        public void Configure(EntityTypeBuilder<RolePermission> builder)
        {
            builder.ToTable("RolePermissions");
            builder.HasKey(rp => new { rp.RoleId, rp.PermissionId });

            builder.HasOne(rp => rp.Role)
                .WithMany(r => r.RolePermissions)
                .HasForeignKey(rp => rp.RoleId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(rp => rp.Permission)
                .WithMany(p => p.RolePermissions)
                .HasForeignKey(rp => rp.PermissionId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }

    public class CustomerConfiguration : IEntityTypeConfiguration<Customer>
    {
        public void Configure(EntityTypeBuilder<Customer> builder)
        {
            builder.ToTable("Customers");
            builder.HasKey(c => c.Id);

            builder.Property(c => c.Name).IsRequired().HasMaxLength(150);
            builder.Property(c => c.CpfCnpj).HasMaxLength(20);
            builder.Property(c => c.Phone).HasMaxLength(20);
            builder.Property(c => c.CellPhone).HasMaxLength(20);
            builder.Property(c => c.Email).HasMaxLength(100);

            builder.HasIndex(c => c.Name);
            builder.HasIndex(c => c.CpfCnpj).IsUnique().HasFilter("\"CpfCnpj\" IS NOT NULL");

            builder.HasOne(c => c.Address)
                .WithMany()
                .HasForeignKey(c => c.AddressId)
                .OnDelete(DeleteBehavior.SetNull);
        }
    }

    public class BicycleConfiguration : IEntityTypeConfiguration<Bicycle>
    {
        public void Configure(EntityTypeBuilder<Bicycle> builder)
        {
            builder.ToTable("Bicycles");
            builder.HasKey(b => b.Id);

            builder.Property(b => b.Brand).IsRequired().HasMaxLength(80);
            builder.Property(b => b.Model).IsRequired().HasMaxLength(80);
            builder.Property(b => b.Color).HasMaxLength(50);
            builder.Property(b => b.FrameSize).HasMaxLength(30);
            builder.Property(b => b.SerialNumber).HasMaxLength(100);

            builder.HasIndex(b => b.SerialNumber);

            builder.HasOne(b => b.Customer)
                .WithMany(c => c.Bicycles)
                .HasForeignKey(b => b.CustomerId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }

    public class SupplierConfiguration : IEntityTypeConfiguration<Supplier>
    {
        public void Configure(EntityTypeBuilder<Supplier> builder)
        {
            builder.ToTable("Suppliers");
            builder.HasKey(s => s.Id);

            builder.Property(s => s.CorporateName).IsRequired().HasMaxLength(150);
            builder.Property(s => s.TradeName).IsRequired().HasMaxLength(150);
            builder.Property(s => s.CpfCnpj).HasMaxLength(20);

            builder.HasIndex(s => s.CpfCnpj).IsUnique().HasFilter("\"CpfCnpj\" IS NOT NULL");

            builder.HasOne(s => s.Address)
                .WithMany()
                .HasForeignKey(s => s.AddressId)
                .OnDelete(DeleteBehavior.SetNull);
        }
    }

    public class ProductCategoryConfiguration : IEntityTypeConfiguration<ProductCategory>
    {
        public void Configure(EntityTypeBuilder<ProductCategory> builder)
        {
            builder.ToTable("ProductCategories");
            builder.HasKey(c => c.Id);
            builder.Property(c => c.Name).IsRequired().HasMaxLength(100);
            builder.HasIndex(c => c.Name).IsUnique();
        }
    }

    public class ProductConfiguration : IEntityTypeConfiguration<Product>
    {
        public void Configure(EntityTypeBuilder<Product> builder)
        {
            builder.ToTable("Products");
            builder.HasKey(p => p.Id);

            builder.Property(p => p.Sku).IsRequired().HasMaxLength(50);
            builder.Property(p => p.Barcode).HasMaxLength(50);
            builder.Property(p => p.Name).IsRequired().HasMaxLength(150);

            builder.Property(p => p.CostPrice).HasPrecision(18, 2);
            builder.Property(p => p.SalePrice).HasPrecision(18, 2);
            builder.Property(p => p.StockQuantity).HasPrecision(18, 2);
            builder.Property(p => p.MinimumStock).HasPrecision(18, 2);

            builder.Property(p => p.RowVersion).IsConcurrencyToken();

            builder.HasIndex(p => p.Sku).IsUnique();
            builder.HasIndex(p => p.Barcode).IsUnique().HasFilter("\"Barcode\" IS NOT NULL");
            builder.HasIndex(p => p.Name);

            builder.HasOne(p => p.ProductCategory)
                .WithMany(c => c.Products)
                .HasForeignKey(p => p.ProductCategoryId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(p => p.Supplier)
                .WithMany(s => s.Products)
                .HasForeignKey(p => p.SupplierId)
                .OnDelete(DeleteBehavior.SetNull);
        }
    }

    public class ServiceConfiguration : IEntityTypeConfiguration<Service>
    {
        public void Configure(EntityTypeBuilder<Service> builder)
        {
            builder.ToTable("Services");
            builder.HasKey(s => s.Id);

            builder.Property(s => s.Name).IsRequired().HasMaxLength(150);
            builder.Property(s => s.CostPrice).HasPrecision(18, 2);
            builder.Property(s => s.SalePrice).HasPrecision(18, 2);
        }
    }

    public class StockMovementConfiguration : IEntityTypeConfiguration<StockMovement>
    {
        public void Configure(EntityTypeBuilder<StockMovement> builder)
        {
            builder.ToTable("StockMovements");
            builder.HasKey(m => m.Id);

            builder.Property(m => m.Quantity).HasPrecision(18, 2);
            builder.Property(m => m.PreviousStock).HasPrecision(18, 2);
            builder.Property(m => m.NewStock).HasPrecision(18, 2);
            builder.Property(m => m.UnitCost).HasPrecision(18, 2);

            builder.HasOne(m => m.Product)
                .WithMany(p => p.StockMovements)
                .HasForeignKey(m => m.ProductId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(m => m.CreatedByUser)
                .WithMany()
                .HasForeignKey(m => m.CreatedByUserId)
                .OnDelete(DeleteBehavior.SetNull);

            builder.HasIndex(m => m.CreatedAt);
        }
    }

    public class WorkOrderConfiguration : IEntityTypeConfiguration<WorkOrder>
    {
        public void Configure(EntityTypeBuilder<WorkOrder> builder)
        {
            builder.ToTable("WorkOrders");
            builder.HasKey(w => w.Id);

            builder.Property(w => w.Number).IsRequired().HasMaxLength(30);
            builder.HasIndex(w => w.Number).IsUnique();

            builder.Property(w => w.Description).IsRequired().HasMaxLength(500);

            builder.Property(w => w.Discount).HasPrecision(18, 2);
            builder.Property(w => w.AdditionalCharge).HasPrecision(18, 2);
            builder.Property(w => w.Subtotal).HasPrecision(18, 2);
            builder.Property(w => w.Total).HasPrecision(18, 2);
            builder.Property(w => w.RequestedTotal).HasPrecision(18, 2);
            builder.Property(w => w.ApprovedTotal).HasPrecision(18, 2);

            builder.HasOne(w => w.Customer)
                .WithMany(c => c.WorkOrders)
                .HasForeignKey(w => w.CustomerId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(w => w.Bicycle)
                .WithMany(b => b.WorkOrders)
                .HasForeignKey(w => w.BicycleId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(w => w.AssignedToUser)
                .WithMany()
                .HasForeignKey(w => w.AssignedToUserId)
                .OnDelete(DeleteBehavior.SetNull);

            builder.HasOne(w => w.CreatedByUser)
                .WithMany()
                .HasForeignKey(w => w.CreatedByUserFkId)
                .OnDelete(DeleteBehavior.SetNull);

            builder.HasOne(w => w.ApprovedByUser)
                .WithMany()
                .HasForeignKey(w => w.ApprovedByUserId)
                .OnDelete(DeleteBehavior.SetNull);

            builder.HasIndex(w => w.Status);
            builder.HasIndex(w => w.OpeningDate);
        }
    }

    public class WorkOrderItemConfiguration : IEntityTypeConfiguration<WorkOrderItem>
    {
        public void Configure(EntityTypeBuilder<WorkOrderItem> builder)
        {
            builder.ToTable("WorkOrderItems");
            builder.HasKey(i => i.Id);

            builder.Property(i => i.Description).IsRequired().HasMaxLength(200);
            builder.Property(i => i.Quantity).HasPrecision(18, 2);
            builder.Property(i => i.UnitPrice).HasPrecision(18, 2);
            builder.Property(i => i.Discount).HasPrecision(18, 2);
            builder.Property(i => i.Total).HasPrecision(18, 2);

            builder.HasOne(i => i.WorkOrder)
                .WithMany(w => w.Items)
                .HasForeignKey(i => i.WorkOrderId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(i => i.Product)
                .WithMany()
                .HasForeignKey(i => i.ProductId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(i => i.Service)
                .WithMany()
                .HasForeignKey(i => i.ServiceId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }

    public class WorkOrderStatusHistoryConfiguration : IEntityTypeConfiguration<WorkOrderStatusHistory>
    {
        public void Configure(EntityTypeBuilder<WorkOrderStatusHistory> builder)
        {
            builder.ToTable("WorkOrderStatusHistories");
            builder.HasKey(h => h.Id);

            builder.Property(h => h.Reason).HasMaxLength(300);

            builder.HasOne(h => h.WorkOrder)
                .WithMany(w => w.StatusHistory)
                .HasForeignKey(h => h.WorkOrderId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(h => h.ChangedByUser)
                .WithMany()
                .HasForeignKey(h => h.ChangedByUserId)
                .OnDelete(DeleteBehavior.SetNull);
        }
    }

    public class SaleConfiguration : IEntityTypeConfiguration<Sale>
    {
        public void Configure(EntityTypeBuilder<Sale> builder)
        {
            builder.ToTable("Sales");
            builder.HasKey(s => s.Id);

            builder.Property(s => s.Number).IsRequired().HasMaxLength(30);
            builder.HasIndex(s => s.Number).IsUnique();

            builder.Property(s => s.Discount).HasPrecision(18, 2);
            builder.Property(s => s.AdditionalCharge).HasPrecision(18, 2);
            builder.Property(s => s.Subtotal).HasPrecision(18, 2);
            builder.Property(s => s.Total).HasPrecision(18, 2);

            builder.HasOne(s => s.Customer)
                .WithMany(c => c.Sales)
                .HasForeignKey(s => s.CustomerId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(s => s.WorkOrder)
                .WithOne(w => w.Sale)
                .HasForeignKey<Sale>(s => s.WorkOrderId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(s => s.CreatedByUser)
                .WithMany()
                .HasForeignKey(s => s.CreatedByUserId)
                .OnDelete(DeleteBehavior.SetNull);

            builder.HasOne(s => s.CancelledByUser)
                .WithMany()
                .HasForeignKey(s => s.CancelledByUserId)
                .OnDelete(DeleteBehavior.SetNull);

            builder.HasIndex(s => s.Status);
            builder.HasIndex(s => s.SaleDate);
        }
    }

    public class SaleItemConfiguration : IEntityTypeConfiguration<SaleItem>
    {
        public void Configure(EntityTypeBuilder<SaleItem> builder)
        {
            builder.ToTable("SaleItems");
            builder.HasKey(i => i.Id);

            builder.Property(i => i.Description).IsRequired().HasMaxLength(200);
            builder.Property(i => i.Quantity).HasPrecision(18, 2);
            builder.Property(i => i.UnitPrice).HasPrecision(18, 2);
            builder.Property(i => i.Discount).HasPrecision(18, 2);
            builder.Property(i => i.Total).HasPrecision(18, 2);

            builder.HasOne(i => i.Sale)
                .WithMany(s => s.Items)
                .HasForeignKey(i => i.SaleId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(i => i.Product)
                .WithMany()
                .HasForeignKey(i => i.ProductId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(i => i.Service)
                .WithMany()
                .HasForeignKey(i => i.ServiceId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }

    public class PaymentMethodConfiguration : IEntityTypeConfiguration<PaymentMethod>
    {
        public void Configure(EntityTypeBuilder<PaymentMethod> builder)
        {
            builder.ToTable("PaymentMethods");
            builder.HasKey(p => p.Id);
            builder.Property(p => p.Name).IsRequired().HasMaxLength(60);
            builder.Property(p => p.Code).IsRequired().HasMaxLength(30);
            builder.HasIndex(p => p.Code).IsUnique();
        }
    }

    public class SalePaymentConfiguration : IEntityTypeConfiguration<SalePayment>
    {
        public void Configure(EntityTypeBuilder<SalePayment> builder)
        {
            builder.ToTable("SalePayments");
            builder.HasKey(p => p.Id);

            builder.Property(p => p.Amount).HasPrecision(18, 2);
            builder.Property(p => p.TransactionCode).HasMaxLength(100);

            builder.HasOne(p => p.Sale)
                .WithMany(s => s.Payments)
                .HasForeignKey(p => p.SaleId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(p => p.PaymentMethod)
                .WithMany(m => m.SalePayments)
                .HasForeignKey(p => p.PaymentMethodId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }

    public class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
    {
        public void Configure(EntityTypeBuilder<AuditLog> builder)
        {
            builder.ToTable("AuditLogs");
            builder.HasKey(a => a.Id);

            builder.Property(a => a.EntityName).IsRequired().HasMaxLength(100);
            builder.Property(a => a.EntityId).IsRequired().HasMaxLength(50);
            builder.Property(a => a.Action).IsRequired().HasMaxLength(50);
            builder.Property(a => a.IpAddress).HasMaxLength(50);

            builder.HasOne(a => a.User)
                .WithMany()
                .HasForeignKey(a => a.UserId)
                .OnDelete(DeleteBehavior.SetNull);

            builder.HasIndex(a => a.EntityName);
            builder.HasIndex(a => a.CreatedAt);
        }
    }

    public class WorkshopSettingsConfiguration : IEntityTypeConfiguration<WorkshopSettings>
    {
        public void Configure(EntityTypeBuilder<WorkshopSettings> builder)
        {
            builder.ToTable("WorkshopSettings");
            builder.HasKey(w => w.Id);

            builder.Property(w => w.CompanyName).IsRequired().HasMaxLength(150);
            builder.Property(w => w.TradeName).IsRequired().HasMaxLength(150);
            builder.Property(w => w.CorporateName).IsRequired().HasMaxLength(150);
            builder.Property(w => w.CpfCnpj).HasMaxLength(20);
            builder.Property(w => w.StateRegistration).HasMaxLength(30);

            builder.Property(w => w.Phone).HasMaxLength(20);
            builder.Property(w => w.WhatsApp).HasMaxLength(20);
            builder.Property(w => w.Email).HasMaxLength(150);
            builder.Property(w => w.Website).HasMaxLength(200);

            builder.Property(w => w.LogoFileName).HasMaxLength(255);
            builder.Property(w => w.LogoContentType).HasMaxLength(100);
            builder.Property(w => w.LogoStoragePath).HasMaxLength(500);

            builder.Property(w => w.FooterMessage).HasMaxLength(500);
            builder.Property(w => w.AdditionalInformation).HasMaxLength(1000);

            builder.HasOne(w => w.Address)
                .WithMany()
                .HasForeignKey(w => w.AddressId)
                .OnDelete(DeleteBehavior.SetNull);

            builder.HasIndex(w => w.IsActive);
        }
    }
}
