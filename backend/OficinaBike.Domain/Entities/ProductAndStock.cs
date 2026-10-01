using System;
using System.Collections.Generic;
using OficinaBike.Domain.Enums;

namespace OficinaBike.Domain.Entities
{
    public class Supplier : BaseEntity
    {
        public string CorporateName { get; set; } = string.Empty;
        public string TradeName { get; set; } = string.Empty;
        public string? CpfCnpj { get; set; }
        public string? StateRegistration { get; set; }
        public string? Phone { get; set; }
        public string? CellPhone { get; set; }
        public string? Email { get; set; }
        public string? Notes { get; set; }
        public bool IsActive { get; set; } = true;

        public int? AddressId { get; set; }
        public virtual Address? Address { get; set; }

        public virtual ICollection<Product> Products { get; set; } = new List<Product>();
    }

    public class ProductCategory : BaseEntity
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool IsActive { get; set; } = true;

        public virtual ICollection<Product> Products { get; set; } = new List<Product>();
    }

    public class Product : BaseEntity
    {
        public string Sku { get; set; } = string.Empty;
        public string? Barcode { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }

        public int ProductCategoryId { get; set; }
        public virtual ProductCategory ProductCategory { get; set; } = null!;

        public int? SupplierId { get; set; }
        public virtual Supplier? Supplier { get; set; }

        public decimal CostPrice { get; set; }
        public decimal SalePrice { get; set; }

        public decimal StockQuantity { get; set; }
        public decimal MinimumStock { get; set; }

        public UnitOfMeasure Unit { get; set; } = UnitOfMeasure.UN;
        public bool IsActive { get; set; } = true;

        // Concurrency token to protect inventory operations
        public byte[] RowVersion { get; set; } = Guid.NewGuid().ToByteArray();

        public virtual ICollection<StockMovement> StockMovements { get; set; } = new List<StockMovement>();
    }

    public class Service : BaseEntity
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal CostPrice { get; set; }
        public decimal SalePrice { get; set; }
        public int EstimatedTimeMinutes { get; set; }
        public bool IsActive { get; set; } = true;
    }

    public class StockMovement
    {
        public int Id { get; set; }

        public int ProductId { get; set; }
        public virtual Product Product { get; set; } = null!;

        public StockMovementType Type { get; set; }
        public decimal Quantity { get; set; } // Positive for in, negative for out

        public decimal PreviousStock { get; set; }
        public decimal NewStock { get; set; }
        public decimal UnitCost { get; set; }

        public string? ReferenceType { get; set; } // e.g. "WorkOrder", "Sale", "ManualAdjustment"
        public int? ReferenceId { get; set; }

        public string? Description { get; set; }

        public int? CreatedByUserId { get; set; }
        public virtual User? CreatedByUser { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
