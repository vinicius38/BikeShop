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
using OficinaBike.Domain.Enums;
using OficinaBike.Domain.Exceptions;

namespace OficinaBike.Application.Services
{
    public class SupplierService : ISupplierService
    {
        private readonly IOficinaBikeDbContext _context;
        private readonly ICurrentUserService _currentUserService;
        private readonly IAuditService _auditService;

        public SupplierService(IOficinaBikeDbContext context, ICurrentUserService currentUserService, IAuditService auditService)
        {
            _context = context;
            _currentUserService = currentUserService;
            _auditService = auditService;
        }

        public async Task<PagedResult<SupplierResponse>> GetSuppliersAsync(PagedRequest request, CancellationToken cancellationToken = default)
        {
            var query = _context.Suppliers
                .AsNoTracking()
                .Include(s => s.Address)
                .Include(s => s.Products)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(request.Search))
            {
                var term = request.Search.Trim().ToLower();
                query = query.Where(s => s.CorporateName.ToLower().Contains(term) ||
                                         s.TradeName.ToLower().Contains(term) ||
                                         (s.CpfCnpj != null && s.CpfCnpj.Contains(term)) ||
                                         (s.Email != null && s.Email.ToLower().Contains(term)));
            }

            var totalItems = await query.CountAsync(cancellationToken);
            var page = Math.Max(1, request.Page);
            var pageSize = Math.Clamp(request.PageSize, 1, 100);

            var suppliers = await query
                .OrderBy(s => s.TradeName)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(cancellationToken);

            var dtos = suppliers.Select(MapToResponse).ToList();
            return new PagedResult<SupplierResponse>(dtos, totalItems, page, pageSize);
        }

        public async Task<SupplierResponse> GetByIdAsync(int id, CancellationToken cancellationToken = default)
        {
            var s = await _context.Suppliers
                .AsNoTracking()
                .Include(s => s.Address)
                .Include(s => s.Products)
                .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);

            if (s == null)
                throw new NotFoundException("Fornecedor", id);

            return MapToResponse(s);
        }

        public async Task<SupplierResponse> CreateAsync(CreateSupplierRequest request, CancellationToken cancellationToken = default)
        {
            if (!string.IsNullOrWhiteSpace(request.CpfCnpj))
            {
                var exists = await _context.Suppliers.AnyAsync(s => s.CpfCnpj == request.CpfCnpj.Trim(), cancellationToken);
                if (exists)
                    throw new BusinessRuleException($"Já existe um fornecedor cadastrado com o CPF/CNPJ '{request.CpfCnpj}'.");
            }

            Address? address = null;
            if (request.Address != null)
            {
                address = new Address
                {
                    ZipCode = request.Address.ZipCode.Trim(),
                    Street = request.Address.Street.Trim(),
                    Number = request.Address.Number.Trim(),
                    Complement = request.Address.Complement?.Trim(),
                    Neighborhood = request.Address.Neighborhood.Trim(),
                    City = request.Address.City.Trim(),
                    State = request.Address.State.Trim(),
                    CreatedAt = DateTime.UtcNow
                };
            }

            var supplier = new Supplier
            {
                CorporateName = request.CorporateName.Trim(),
                TradeName = request.TradeName.Trim(),
                CpfCnpj = string.IsNullOrWhiteSpace(request.CpfCnpj) ? null : request.CpfCnpj.Trim(),
                StateRegistration = request.StateRegistration?.Trim(),
                Phone = request.Phone?.Trim(),
                CellPhone = request.CellPhone?.Trim(),
                Email = request.Email?.Trim().ToLower(),
                Notes = request.Notes?.Trim(),
                Address = address,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                CreatedByUserId = _currentUserService.UserId
            };

            _context.Suppliers.Add(supplier);
            await _context.SaveChangesAsync(cancellationToken);

            await _auditService.LogAsync("Supplier", supplier.Id.ToString(), "Create", null, new { supplier.CorporateName, supplier.TradeName }, cancellationToken);

            return await GetByIdAsync(supplier.Id, cancellationToken);
        }

        public async Task<SupplierResponse> UpdateAsync(int id, UpdateSupplierRequest request, CancellationToken cancellationToken = default)
        {
            var supplier = await _context.Suppliers
                .Include(s => s.Address)
                .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);

            if (supplier == null)
                throw new NotFoundException("Fornecedor", id);

            var oldValues = new { supplier.CorporateName, supplier.TradeName, supplier.CpfCnpj, supplier.IsActive };

            supplier.CorporateName = request.CorporateName.Trim();
            supplier.TradeName = request.TradeName.Trim();
            supplier.CpfCnpj = string.IsNullOrWhiteSpace(request.CpfCnpj) ? null : request.CpfCnpj.Trim();
            supplier.StateRegistration = request.StateRegistration?.Trim();
            supplier.Phone = request.Phone?.Trim();
            supplier.CellPhone = request.CellPhone?.Trim();
            supplier.Email = request.Email?.Trim().ToLower();
            supplier.Notes = request.Notes?.Trim();
            supplier.IsActive = request.IsActive;
            supplier.UpdatedAt = DateTime.UtcNow;
            supplier.UpdatedByUserId = _currentUserService.UserId;

            if (request.Address != null)
            {
                if (supplier.Address == null)
                {
                    supplier.Address = new Address
                    {
                        ZipCode = request.Address.ZipCode.Trim(),
                        Street = request.Address.Street.Trim(),
                        Number = request.Address.Number.Trim(),
                        Complement = request.Address.Complement?.Trim(),
                        Neighborhood = request.Address.Neighborhood.Trim(),
                        City = request.Address.City.Trim(),
                        State = request.Address.State.Trim(),
                        CreatedAt = DateTime.UtcNow
                    };
                }
                else
                {
                    supplier.Address.ZipCode = request.Address.ZipCode.Trim();
                    supplier.Address.Street = request.Address.Street.Trim();
                    supplier.Address.Number = request.Address.Number.Trim();
                    supplier.Address.Complement = request.Address.Complement?.Trim();
                    supplier.Address.Neighborhood = request.Address.Neighborhood.Trim();
                    supplier.Address.City = request.Address.City.Trim();
                    supplier.Address.State = request.Address.State.Trim();
                    supplier.Address.UpdatedAt = DateTime.UtcNow;
                }
            }

            await _context.SaveChangesAsync(cancellationToken);
            await _auditService.LogAsync("Supplier", supplier.Id.ToString(), "Update", oldValues, new { supplier.CorporateName, supplier.TradeName }, cancellationToken);

            return await GetByIdAsync(supplier.Id, cancellationToken);
        }

        public async Task DeleteOrDeactivateAsync(int id, CancellationToken cancellationToken = default)
        {
            var supplier = await _context.Suppliers
                .Include(s => s.Products)
                .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);

            if (supplier == null)
                throw new NotFoundException("Fornecedor", id);

            if (supplier.Products.Any())
            {
                supplier.IsActive = false;
                supplier.UpdatedAt = DateTime.UtcNow;
                supplier.UpdatedByUserId = _currentUserService.UserId;
                await _context.SaveChangesAsync(cancellationToken);
                await _auditService.LogAsync("Supplier", supplier.Id.ToString(), "Deactivate", null, new { IsActive = false }, cancellationToken);
            }
            else
            {
                _context.Suppliers.Remove(supplier);
                await _context.SaveChangesAsync(cancellationToken);
                await _auditService.LogAsync("Supplier", supplier.Id.ToString(), "Delete", null, null, cancellationToken);
            }
        }

        private static SupplierResponse MapToResponse(Supplier s)
        {
            return new SupplierResponse
            {
                Id = s.Id,
                CorporateName = s.CorporateName,
                TradeName = s.TradeName,
                CpfCnpj = s.CpfCnpj,
                StateRegistration = s.StateRegistration,
                Phone = s.Phone,
                CellPhone = s.CellPhone,
                Email = s.Email,
                Notes = s.Notes,
                IsActive = s.IsActive,
                ProductsCount = s.Products.Count,
                CreatedAt = s.CreatedAt,
                Address = s.Address == null ? null : new AddressDto
                {
                    Id = s.Address.Id,
                    ZipCode = s.Address.ZipCode,
                    Street = s.Address.Street,
                    Number = s.Address.Number,
                    Complement = s.Address.Complement,
                    Neighborhood = s.Address.Neighborhood,
                    City = s.Address.City,
                    State = s.Address.State
                }
            };
        }
    }

    public class ProductService : IProductService
    {
        private readonly IOficinaBikeDbContext _context;
        private readonly ICurrentUserService _currentUserService;
        private readonly IAuditService _auditService;

        public ProductService(IOficinaBikeDbContext context, ICurrentUserService currentUserService, IAuditService auditService)
        {
            _context = context;
            _currentUserService = currentUserService;
            _auditService = auditService;
        }

        public async Task<PagedResult<ProductResponse>> GetProductsAsync(
            PagedRequest request,
            int? categoryId = null,
            int? supplierId = null,
            bool? activeOnly = null,
            bool? lowStockOnly = null,
            CancellationToken cancellationToken = default)
        {
            var query = _context.Products
                .AsNoTracking()
                .Include(p => p.ProductCategory)
                .Include(p => p.Supplier)
                .AsQueryable();

            if (categoryId.HasValue)
                query = query.Where(p => p.ProductCategoryId == categoryId.Value);

            if (supplierId.HasValue)
                query = query.Where(p => p.SupplierId == supplierId.Value);

            if (activeOnly.HasValue)
                query = query.Where(p => p.IsActive == activeOnly.Value);

            if (lowStockOnly == true)
                query = query.Where(p => p.StockQuantity <= p.MinimumStock);

            if (!string.IsNullOrWhiteSpace(request.Search))
            {
                var term = request.Search.Trim().ToLower();
                query = query.Where(p => p.Name.ToLower().Contains(term) ||
                                         p.Sku.ToLower().Contains(term) ||
                                         (p.Barcode != null && p.Barcode.ToLower().Contains(term)) ||
                                         p.ProductCategory.Name.ToLower().Contains(term));
            }

            var totalItems = await query.CountAsync(cancellationToken);
            var page = Math.Max(1, request.Page);
            var pageSize = Math.Clamp(request.PageSize, 1, 100);

            var products = await query
                .OrderBy(p => p.Name)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(cancellationToken);

            var dtos = products.Select(p => new ProductResponse
            {
                Id = p.Id,
                Sku = p.Sku,
                Barcode = p.Barcode,
                Name = p.Name,
                Description = p.Description,
                ProductCategoryId = p.ProductCategoryId,
                CategoryName = p.ProductCategory.Name,
                SupplierId = p.SupplierId,
                SupplierName = p.Supplier?.TradeName,
                CostPrice = p.CostPrice,
                SalePrice = p.SalePrice,
                StockQuantity = p.StockQuantity,
                MinimumStock = p.MinimumStock,
                Unit = p.Unit,
                IsActive = p.IsActive,
                CreatedAt = p.CreatedAt,
                UpdatedAt = p.UpdatedAt
            }).ToList();

            return new PagedResult<ProductResponse>(dtos, totalItems, page, pageSize);
        }

        public async Task<ProductResponse> GetByIdAsync(int id, CancellationToken cancellationToken = default)
        {
            var p = await _context.Products
                .AsNoTracking()
                .Include(p => p.ProductCategory)
                .Include(p => p.Supplier)
                .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);

            if (p == null)
                throw new NotFoundException("Produto", id);

            return new ProductResponse
            {
                Id = p.Id,
                Sku = p.Sku,
                Barcode = p.Barcode,
                Name = p.Name,
                Description = p.Description,
                ProductCategoryId = p.ProductCategoryId,
                CategoryName = p.ProductCategory.Name,
                SupplierId = p.SupplierId,
                SupplierName = p.Supplier?.TradeName,
                CostPrice = p.CostPrice,
                SalePrice = p.SalePrice,
                StockQuantity = p.StockQuantity,
                MinimumStock = p.MinimumStock,
                Unit = p.Unit,
                IsActive = p.IsActive,
                CreatedAt = p.CreatedAt,
                UpdatedAt = p.UpdatedAt
            };
        }

        public async Task<string> GetNextCodeAsync(CancellationToken cancellationToken = default)
        {
            var maxId = await _context.Products.MaxAsync(p => (int?)p.Id, cancellationToken) ?? 0;
            int nextNumber = maxId + 1;

            var existingCodes = await _context.Products
                .Select(p => p.Sku)
                .ToListAsync(cancellationToken);

            foreach (var code in existingCodes)
            {
                if (int.TryParse(code, out int num) && num >= nextNumber)
                {
                    nextNumber = num + 1;
                }
            }

            while (await _context.Products.AnyAsync(p => p.Sku == nextNumber.ToString(), cancellationToken))
            {
                nextNumber++;
            }

            return nextNumber.ToString();
        }

        public async Task<ProductResponse> CreateAsync(CreateProductRequest request, CancellationToken cancellationToken = default)
        {
            // Código sequencial gerado automaticamente pelo banco de dados (1, 2, 3...)
            request.Sku = await GetNextCodeAsync(cancellationToken);

            if (!string.IsNullOrWhiteSpace(request.Barcode))
            {
                var barcodeExists = await _context.Products.AnyAsync(p => p.Barcode == request.Barcode.Trim(), cancellationToken);
                if (barcodeExists)
                    throw new BusinessRuleException($"Já existe um produto com o código de barras '{request.Barcode}'.");
            }

            var categoryExists = await _context.ProductCategories.AnyAsync(c => c.Id == request.ProductCategoryId, cancellationToken);
            if (!categoryExists)
                throw new BusinessRuleException("A categoria de produto informada não existe.");

            if (request.SupplierId.HasValue)
            {
                var supplierExists = await _context.Suppliers.AnyAsync(s => s.Id == request.SupplierId.Value, cancellationToken);
                if (!supplierExists)
                    throw new BusinessRuleException("O fornecedor informado não existe.");
            }

            var product = new Product
            {
                Sku = request.Sku,
                Barcode = string.IsNullOrWhiteSpace(request.Barcode) ? null : request.Barcode.Trim(),
                Name = request.Name.Trim(),
                Description = request.Description?.Trim(),
                ProductCategoryId = request.ProductCategoryId,
                SupplierId = request.SupplierId,
                CostPrice = request.CostPrice,
                SalePrice = request.SalePrice,
                StockQuantity = request.InitialStock,
                MinimumStock = request.MinimumStock,
                Unit = request.Unit,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                CreatedByUserId = _currentUserService.UserId
            };

            _context.Products.Add(product);

            if (request.InitialStock > 0)
            {
                _context.StockMovements.Add(new StockMovement
                {
                    Product = product,
                    Type = StockMovementType.InitialStock,
                    Quantity = request.InitialStock,
                    PreviousStock = 0,
                    NewStock = request.InitialStock,
                    UnitCost = request.CostPrice,
                    ReferenceType = "InitialStock",
                    Description = "Carga inicial de estoque",
                    CreatedByUserId = _currentUserService.UserId,
                    CreatedAt = DateTime.UtcNow
                });
            }

            await _context.SaveChangesAsync(cancellationToken);
            await _auditService.LogAsync("Product", product.Id.ToString(), "Create", null, new { product.Sku, product.Name, product.SalePrice }, cancellationToken);

            return await GetByIdAsync(product.Id, cancellationToken);
        }

        public async Task<ProductResponse> UpdateAsync(int id, UpdateProductRequest request, CancellationToken cancellationToken = default)
        {
            var product = await _context.Products.FindAsync(new object[] { id }, cancellationToken);
            if (product == null)
                throw new NotFoundException("Produto", id);

            if (!string.IsNullOrWhiteSpace(request.Barcode))
            {
                var barcodeExists = await _context.Products.AnyAsync(p => p.Barcode == request.Barcode.Trim() && p.Id != id, cancellationToken);
                if (barcodeExists)
                    throw new BusinessRuleException($"Já existe outro produto cadastrado com o código de barras '{request.Barcode}'.");
            }

            var oldValues = new { product.Sku, product.Name, product.CostPrice, product.SalePrice, product.IsActive };

            // O código/SKU é sequencial e imutável pelo cadastro (permanece o original)
            product.Barcode = string.IsNullOrWhiteSpace(request.Barcode) ? null : request.Barcode.Trim();
            product.Name = request.Name.Trim();
            product.Description = request.Description?.Trim();
            product.ProductCategoryId = request.ProductCategoryId;
            product.SupplierId = request.SupplierId;
            product.CostPrice = request.CostPrice;
            product.SalePrice = request.SalePrice;
            product.MinimumStock = request.MinimumStock;
            product.Unit = request.Unit;
            product.IsActive = request.IsActive;
            product.UpdatedAt = DateTime.UtcNow;
            product.UpdatedByUserId = _currentUserService.UserId;

            await _context.SaveChangesAsync(cancellationToken);
            await _auditService.LogAsync("Product", product.Id.ToString(), "Update", oldValues, new { product.Sku, product.Name }, cancellationToken);

            return await GetByIdAsync(product.Id, cancellationToken);
        }

        public async Task SetActiveStatusAsync(int id, bool isActive, CancellationToken cancellationToken = default)
        {
            var product = await _context.Products.FindAsync(new object[] { id }, cancellationToken);
            if (product == null)
                throw new NotFoundException("Produto", id);

            product.IsActive = isActive;
            product.UpdatedAt = DateTime.UtcNow;
            product.UpdatedByUserId = _currentUserService.UserId;

            await _context.SaveChangesAsync(cancellationToken);
            await _auditService.LogAsync("Product", product.Id.ToString(), isActive ? "Activate" : "Deactivate", null, new { IsActive = isActive }, cancellationToken);
        }

        public async Task<List<ProductCategoryDto>> GetCategoriesAsync(CancellationToken cancellationToken = default)
        {
            var categories = await _context.ProductCategories
                .AsNoTracking()
                .Include(c => c.Products)
                .OrderBy(c => c.Name)
                .ToListAsync(cancellationToken);

            return categories.Select(c => new ProductCategoryDto
            {
                Id = c.Id,
                Name = c.Name,
                Description = c.Description,
                IsActive = c.IsActive,
                ProductsCount = c.Products.Count
            }).ToList();
        }

        public async Task<ProductCategoryDto> CreateCategoryAsync(CreateProductCategoryRequest request, CancellationToken cancellationToken = default)
        {
            var exists = await _context.ProductCategories.AnyAsync(c => c.Name.ToLower() == request.Name.Trim().ToLower(), cancellationToken);
            if (exists)
                throw new BusinessRuleException($"A categoria '{request.Name}' já existe.");

            var cat = new ProductCategory
            {
                Name = request.Name.Trim(),
                Description = request.Description?.Trim(),
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                CreatedByUserId = _currentUserService.UserId
            };

            _context.ProductCategories.Add(cat);
            await _context.SaveChangesAsync(cancellationToken);

            return new ProductCategoryDto
            {
                Id = cat.Id,
                Name = cat.Name,
                Description = cat.Description,
                IsActive = cat.IsActive,
                ProductsCount = 0
            };
        }

        public async Task<ProductCategoryDto> UpdateCategoryAsync(int id, UpdateProductCategoryRequest request, CancellationToken cancellationToken = default)
        {
            var cat = await _context.ProductCategories.FindAsync(new object[] { id }, cancellationToken);
            if (cat == null)
                throw new NotFoundException("Categoria de Produto", id);

            cat.Name = request.Name.Trim();
            cat.Description = request.Description?.Trim();
            cat.IsActive = request.IsActive;
            cat.UpdatedAt = DateTime.UtcNow;
            cat.UpdatedByUserId = _currentUserService.UserId;

            await _context.SaveChangesAsync(cancellationToken);

            return new ProductCategoryDto
            {
                Id = cat.Id,
                Name = cat.Name,
                Description = cat.Description,
                IsActive = cat.IsActive,
                ProductsCount = await _context.Products.CountAsync(p => p.ProductCategoryId == id, cancellationToken)
            };
        }
    }

    public class ServiceService : IServiceService
    {
        private readonly IOficinaBikeDbContext _context;
        private readonly ICurrentUserService _currentUserService;
        private readonly IAuditService _auditService;

        public ServiceService(IOficinaBikeDbContext context, ICurrentUserService currentUserService, IAuditService auditService)
        {
            _context = context;
            _currentUserService = currentUserService;
            _auditService = auditService;
        }

        public async Task<PagedResult<ServiceResponse>> GetServicesAsync(PagedRequest request, bool? activeOnly = null, CancellationToken cancellationToken = default)
        {
            var query = _context.Services.AsNoTracking().AsQueryable();

            if (activeOnly.HasValue)
                query = query.Where(s => s.IsActive == activeOnly.Value);

            if (!string.IsNullOrWhiteSpace(request.Search))
            {
                var term = request.Search.Trim().ToLower();
                query = query.Where(s => s.Name.ToLower().Contains(term) ||
                                         (s.Description != null && s.Description.ToLower().Contains(term)));
            }

            var totalItems = await query.CountAsync(cancellationToken);
            var page = Math.Max(1, request.Page);
            var pageSize = Math.Clamp(request.PageSize, 1, 100);

            var services = await query
                .OrderBy(s => s.Name)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(cancellationToken);

            var dtos = services.Select(s => new ServiceResponse
            {
                Id = s.Id,
                Name = s.Name,
                Description = s.Description,
                CostPrice = s.CostPrice,
                SalePrice = s.SalePrice,
                EstimatedTimeMinutes = s.EstimatedTimeMinutes,
                IsActive = s.IsActive,
                CreatedAt = s.CreatedAt
            }).ToList();

            return new PagedResult<ServiceResponse>(dtos, totalItems, page, pageSize);
        }

        public async Task<ServiceResponse> GetByIdAsync(int id, CancellationToken cancellationToken = default)
        {
            var s = await _context.Services.AsNoTracking().FirstOrDefaultAsync(s => s.Id == id, cancellationToken);
            if (s == null)
                throw new NotFoundException("Serviço", id);

            return new ServiceResponse
            {
                Id = s.Id,
                Name = s.Name,
                Description = s.Description,
                CostPrice = s.CostPrice,
                SalePrice = s.SalePrice,
                EstimatedTimeMinutes = s.EstimatedTimeMinutes,
                IsActive = s.IsActive,
                CreatedAt = s.CreatedAt
            };
        }

        public async Task<ServiceResponse> CreateAsync(CreateServiceRequest request, CancellationToken cancellationToken = default)
        {
            var service = new Service
            {
                Name = request.Name.Trim(),
                Description = request.Description?.Trim(),
                CostPrice = request.CostPrice,
                SalePrice = request.SalePrice,
                EstimatedTimeMinutes = request.EstimatedTimeMinutes,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                CreatedByUserId = _currentUserService.UserId
            };

            _context.Services.Add(service);
            await _context.SaveChangesAsync(cancellationToken);

            await _auditService.LogAsync("Service", service.Id.ToString(), "Create", null, new { service.Name, service.SalePrice }, cancellationToken);

            return await GetByIdAsync(service.Id, cancellationToken);
        }

        public async Task<ServiceResponse> UpdateAsync(int id, UpdateServiceRequest request, CancellationToken cancellationToken = default)
        {
            var service = await _context.Services.FindAsync(new object[] { id }, cancellationToken);
            if (service == null)
                throw new NotFoundException("Serviço", id);

            var oldValues = new { service.Name, service.CostPrice, service.SalePrice, service.EstimatedTimeMinutes, service.IsActive };

            service.Name = request.Name.Trim();
            service.Description = request.Description?.Trim();
            service.CostPrice = request.CostPrice;
            service.SalePrice = request.SalePrice;
            service.EstimatedTimeMinutes = request.EstimatedTimeMinutes;
            service.IsActive = request.IsActive;
            service.UpdatedAt = DateTime.UtcNow;
            service.UpdatedByUserId = _currentUserService.UserId;

            await _context.SaveChangesAsync(cancellationToken);
            await _auditService.LogAsync("Service", service.Id.ToString(), "Update", oldValues, new { service.Name, service.SalePrice }, cancellationToken);

            return await GetByIdAsync(service.Id, cancellationToken);
        }

        public async Task DeleteOrDeactivateAsync(int id, CancellationToken cancellationToken = default)
        {
            var service = await _context.Services.FindAsync(new object[] { id }, cancellationToken);
            if (service == null)
                throw new NotFoundException("Serviço", id);

            var isUsedInOS = await _context.WorkOrderItems.AnyAsync(i => i.ServiceId == id, cancellationToken);
            var isUsedInSale = await _context.SaleItems.AnyAsync(i => i.ServiceId == id, cancellationToken);

            if (isUsedInOS || isUsedInSale)
            {
                service.IsActive = false;
                service.UpdatedAt = DateTime.UtcNow;
                service.UpdatedByUserId = _currentUserService.UserId;
                await _context.SaveChangesAsync(cancellationToken);
                await _auditService.LogAsync("Service", service.Id.ToString(), "Deactivate", null, new { IsActive = false }, cancellationToken);
            }
            else
            {
                _context.Services.Remove(service);
                await _context.SaveChangesAsync(cancellationToken);
                await _auditService.LogAsync("Service", service.Id.ToString(), "Delete", null, null, cancellationToken);
            }
        }
    }

    public class StockService : IStockService
    {
        private readonly IOficinaBikeDbContext _context;
        private readonly ICurrentUserService _currentUserService;
        private readonly IAuditService _auditService;

        public StockService(IOficinaBikeDbContext context, ICurrentUserService currentUserService, IAuditService auditService)
        {
            _context = context;
            _currentUserService = currentUserService;
            _auditService = auditService;
        }

        public async Task<StockMovementResponse> AdjustStockAsync(AdjustStockRequest request, CancellationToken cancellationToken = default)
        {
            await using var transaction = await _context.BeginTransactionAsync(cancellationToken);

            var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == request.ProductId, cancellationToken);
            if (product == null)
                throw new NotFoundException("Produto", request.ProductId);

            var previousStock = product.StockQuantity;
            var newStock = previousStock + request.Quantity;

            if (newStock < 0)
            {
                throw new BusinessRuleException($"Ajuste inválido: o estoque resultante seria negativo ({newStock}), o que não é permitido.");
            }

            product.StockQuantity = newStock;
            product.UpdatedAt = DateTime.UtcNow;
            product.UpdatedByUserId = _currentUserService.UserId;

            var movement = new StockMovement
            {
                ProductId = product.Id,
                Type = request.Type,
                Quantity = request.Quantity,
                PreviousStock = previousStock,
                NewStock = newStock,
                UnitCost = request.UnitCost ?? product.CostPrice,
                ReferenceType = "ManualAdjustment",
                Description = request.Reason.Trim(),
                CreatedByUserId = _currentUserService.UserId,
                CreatedAt = DateTime.UtcNow
            };

            _context.StockMovements.Add(movement);
            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            await _auditService.LogAsync("StockMovement", movement.Id.ToString(), "Adjustment",
                new { ProductId = product.Id, PreviousStock = previousStock },
                new { ProductId = product.Id, NewStock = newStock, Quantity = request.Quantity },
                cancellationToken);

            return new StockMovementResponse
            {
                Id = movement.Id,
                ProductId = product.Id,
                ProductName = product.Name,
                ProductSku = product.Sku,
                Type = movement.Type,
                Quantity = movement.Quantity,
                PreviousStock = movement.PreviousStock,
                NewStock = movement.NewStock,
                UnitCost = movement.UnitCost,
                ReferenceType = movement.ReferenceType,
                ReferenceId = movement.ReferenceId,
                Description = movement.Description,
                CreatedByUserName = _currentUserService.Username,
                CreatedAt = movement.CreatedAt
            };
        }

        public async Task<PagedResult<StockMovementResponse>> GetMovementsAsync(
            PagedRequest request,
            int? productId = null,
            StockMovementType? type = null,
            CancellationToken cancellationToken = default)
        {
            var query = _context.StockMovements
                .AsNoTracking()
                .Include(m => m.Product)
                .Include(m => m.CreatedByUser)
                .AsQueryable();

            if (productId.HasValue)
                query = query.Where(m => m.ProductId == productId.Value);

            if (type.HasValue)
                query = query.Where(m => m.Type == type.Value);

            if (!string.IsNullOrWhiteSpace(request.Search))
            {
                var term = request.Search.Trim().ToLower();
                query = query.Where(m => m.Product.Name.ToLower().Contains(term) ||
                                         m.Product.Sku.ToLower().Contains(term) ||
                                         (m.Description != null && m.Description.ToLower().Contains(term)));
            }

            var totalItems = await query.CountAsync(cancellationToken);
            var page = Math.Max(1, request.Page);
            var pageSize = Math.Clamp(request.PageSize, 1, 100);

            var movements = await query
                .OrderByDescending(m => m.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(cancellationToken);

            var dtos = movements.Select(m => new StockMovementResponse
            {
                Id = m.Id,
                ProductId = m.ProductId,
                ProductName = m.Product?.Name ?? string.Empty,
                ProductSku = m.Product?.Sku ?? string.Empty,
                Type = m.Type,
                Quantity = m.Quantity,
                PreviousStock = m.PreviousStock,
                NewStock = m.NewStock,
                UnitCost = m.UnitCost,
                ReferenceType = m.ReferenceType,
                ReferenceId = m.ReferenceId,
                Description = m.Description,
                CreatedByUserName = m.CreatedByUser?.Username,
                CreatedAt = m.CreatedAt
            }).ToList();

            return new PagedResult<StockMovementResponse>(dtos, totalItems, page, pageSize);
        }

        public async Task<decimal> GetProductStockAsync(int productId, CancellationToken cancellationToken = default)
        {
            var product = await _context.Products.AsNoTracking().FirstOrDefaultAsync(p => p.Id == productId, cancellationToken);
            if (product == null)
                throw new NotFoundException("Produto", productId);

            return product.StockQuantity;
        }
    }
}
