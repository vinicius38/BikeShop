using System;
using System.Collections.Generic;
using OficinaBike.Domain.Enums;

namespace OficinaBike.Application.DTOs
{
    public class SupplierResponse
    {
        public int Id { get; set; }
        public string CorporateName { get; set; } = string.Empty;
        public string TradeName { get; set; } = string.Empty;
        public string? CpfCnpj { get; set; }
        public string? StateRegistration { get; set; }
        public string? Phone { get; set; }
        public string? CellPhone { get; set; }
        public string? Email { get; set; }
        public string? Notes { get; set; }
        public bool IsActive { get; set; }
        public AddressDto? Address { get; set; }
        public int ProductsCount { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CreateSupplierRequest
    {
        public string CorporateName { get; set; } = string.Empty;
        public string TradeName { get; set; } = string.Empty;
        public string? CpfCnpj { get; set; }
        public string? StateRegistration { get; set; }
        public string? Phone { get; set; }
        public string? CellPhone { get; set; }
        public string? Email { get; set; }
        public string? Notes { get; set; }
        public AddressDto? Address { get; set; }
    }

    public class UpdateSupplierRequest
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
        public AddressDto? Address { get; set; }
    }

    public class ProductCategoryDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool IsActive { get; set; } = true;
        public int ProductsCount { get; set; }
    }

    public class CreateProductCategoryRequest
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
    }

    public class UpdateProductCategoryRequest
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool IsActive { get; set; } = true;
    }

    public class ProductResponse
    {
        public int Id { get; set; }
        public string Sku { get; set; } = string.Empty;
        public string Code => Sku;
        public string? Barcode { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }

        public int ProductCategoryId { get; set; }
        public int CategoryId => ProductCategoryId;
        public string CategoryName { get; set; } = string.Empty;

        public int? SupplierId { get; set; }
        public string? SupplierName { get; set; }

        public decimal CostPrice { get; set; }
        public decimal SalePrice { get; set; }

        public decimal StockQuantity { get; set; }
        public decimal MinimumStock { get; set; }
        public decimal MinimumStockQuantity => MinimumStock;
        public bool IsBelowMinimumStock => StockQuantity <= MinimumStock;
        public bool IsLowStock => IsBelowMinimumStock;

        public UnitOfMeasure Unit { get; set; }
        public string UnitName => Unit.ToString();

        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class CreateProductRequest
    {
        private string _sku = string.Empty;
        public string Sku
        {
            get => _sku;
            set => _sku = value;
        }

        public string? Code
        {
            get => _sku;
            set { if (string.IsNullOrWhiteSpace(_sku) && !string.IsNullOrWhiteSpace(value)) _sku = value; }
        }

        public string? Barcode { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }

        private int _productCategoryId;
        public int ProductCategoryId
        {
            get => _productCategoryId;
            set => _productCategoryId = value;
        }

        public int? CategoryId
        {
            get => _productCategoryId;
            set { if (value.HasValue && value.Value > 0) _productCategoryId = value.Value; }
        }

        public int? SupplierId { get; set; }

        public decimal CostPrice { get; set; }
        public decimal SalePrice { get; set; }

        private decimal _initialStock = 0;
        public decimal InitialStock
        {
            get => _initialStock;
            set => _initialStock = value;
        }

        public decimal? StockQuantity
        {
            get => _initialStock;
            set { if (value.HasValue) _initialStock = value.Value; }
        }

        private decimal _minimumStock = 0;
        public decimal MinimumStock
        {
            get => _minimumStock;
            set => _minimumStock = value;
        }

        public decimal? MinimumStockQuantity
        {
            get => _minimumStock;
            set { if (value.HasValue) _minimumStock = value.Value; }
        }

        public UnitOfMeasure Unit { get; set; } = UnitOfMeasure.UN;
    }

    public class UpdateProductRequest
    {
        private string _sku = string.Empty;
        public string Sku
        {
            get => _sku;
            set => _sku = value;
        }

        public string? Code
        {
            get => _sku;
            set { if (string.IsNullOrWhiteSpace(_sku) && !string.IsNullOrWhiteSpace(value)) _sku = value; }
        }

        public string? Barcode { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }

        private int _productCategoryId;
        public int ProductCategoryId
        {
            get => _productCategoryId;
            set => _productCategoryId = value;
        }

        public int? CategoryId
        {
            get => _productCategoryId;
            set { if (value.HasValue && value.Value > 0) _productCategoryId = value.Value; }
        }

        public int? SupplierId { get; set; }

        public decimal CostPrice { get; set; }
        public decimal SalePrice { get; set; }

        private decimal _minimumStock = 0;
        public decimal MinimumStock
        {
            get => _minimumStock;
            set => _minimumStock = value;
        }

        public decimal? MinimumStockQuantity
        {
            get => _minimumStock;
            set { if (value.HasValue) _minimumStock = value.Value; }
        }

        public UnitOfMeasure Unit { get; set; } = UnitOfMeasure.UN;
        public bool IsActive { get; set; } = true;
    }

    public class ServiceResponse
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal CostPrice { get; set; }
        public decimal SalePrice { get; set; }
        public int EstimatedTimeMinutes { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CreateServiceRequest
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal CostPrice { get; set; }
        public decimal SalePrice { get; set; }
        public int EstimatedTimeMinutes { get; set; }
    }

    public class UpdateServiceRequest
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal CostPrice { get; set; }
        public decimal SalePrice { get; set; }
        public int EstimatedTimeMinutes { get; set; }
        public bool IsActive { get; set; } = true;
    }

    public class AdjustStockRequest
    {
        public int ProductId { get; set; }
        public StockMovementType Type { get; set; } = StockMovementType.Adjustment;
        public decimal Quantity { get; set; } // Positive to add, negative to subtract
        public decimal? UnitCost { get; set; }
        public string Reason { get; set; } = string.Empty;
    }

    public class StockMovementResponse
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public string ProductSku { get; set; } = string.Empty;
        public StockMovementType Type { get; set; }
        public string TypeName => Type.ToString();
        public decimal Quantity { get; set; }
        public decimal PreviousStock { get; set; }
        public decimal NewStock { get; set; }
        public decimal UnitCost { get; set; }
        public string? ReferenceType { get; set; }
        public int? ReferenceId { get; set; }
        public string? Description { get; set; }
        public string? CreatedByUserName { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
