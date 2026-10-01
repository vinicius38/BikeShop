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
    public class SaleService : ISaleService
    {
        private readonly IOficinaBikeDbContext _context;
        private readonly ICurrentUserService _currentUserService;
        private readonly IAuditService _auditService;

        public SaleService(
            IOficinaBikeDbContext context,
            ICurrentUserService currentUserService,
            IAuditService auditService)
        {
            _context = context;
            _currentUserService = currentUserService;
            _auditService = auditService;
        }

        public async Task<PagedResult<SaleResponse>> GetSalesAsync(
            PagedRequest request,
            int? customerId = null,
            SaleStatus? status = null,
            DateTime? startDate = null,
            DateTime? endDate = null,
            int? paymentMethodId = null,
            CancellationToken cancellationToken = default)
        {
            var query = _context.Sales
                .AsNoTracking()
                .Include(s => s.Customer)
                .Include(s => s.WorkOrder)
                .Include(s => s.CreatedByUser)
                .Include(s => s.CancelledByUser)
                .Include(s => s.Items)
                    .ThenInclude(i => i.Product)
                .Include(s => s.Items)
                    .ThenInclude(i => i.Service)
                .Include(s => s.Payments)
                    .ThenInclude(p => p.PaymentMethod)
                .AsQueryable();

            if (customerId.HasValue)
                query = query.Where(s => s.CustomerId == customerId.Value);

            if (status.HasValue)
                query = query.Where(s => s.Status == status.Value);

            if (startDate.HasValue)
                query = query.Where(s => s.SaleDate >= startDate.Value);

            if (endDate.HasValue)
                query = query.Where(s => s.SaleDate <= endDate.Value);

            if (paymentMethodId.HasValue)
                query = query.Where(s => s.Payments.Any(p => p.PaymentMethodId == paymentMethodId.Value));

            if (!string.IsNullOrWhiteSpace(request.Search))
            {
                var term = request.Search.Trim().ToLower();
                query = query.Where(s => s.Number.ToLower().Contains(term) ||
                                         s.Customer.Name.ToLower().Contains(term) ||
                                         (s.WorkOrder != null && s.WorkOrder.Number.ToLower().Contains(term)));
            }

            var totalItems = await query.CountAsync(cancellationToken);
            var page = Math.Max(1, request.Page);
            var pageSize = Math.Clamp(request.PageSize, 1, 100);

            var sales = await query
                .OrderByDescending(s => s.Id)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(cancellationToken);

            var dtos = sales.Select(MapToResponse).ToList();
            return new PagedResult<SaleResponse>(dtos, totalItems, page, pageSize);
        }

        public async Task<SaleResponse> GetByIdAsync(int id, CancellationToken cancellationToken = default)
        {
            var sale = await _context.Sales
                .AsNoTracking()
                .Include(s => s.Customer)
                .Include(s => s.WorkOrder)
                .Include(s => s.CreatedByUser)
                .Include(s => s.CancelledByUser)
                .Include(s => s.Items)
                    .ThenInclude(i => i.Product)
                .Include(s => s.Items)
                    .ThenInclude(i => i.Service)
                .Include(s => s.Payments)
                    .ThenInclude(p => p.PaymentMethod)
                .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);

            if (sale == null)
                throw new NotFoundException("Venda", id);

            return MapToResponse(sale);
        }

        public async Task<SaleResponse> CreateAsync(CreateSaleRequest request, CancellationToken cancellationToken = default)
        {
            await using var transaction = await _context.BeginTransactionAsync(cancellationToken);

            Customer? customer = null;
            if (request.CustomerId.HasValue && request.CustomerId.Value > 0)
            {
                customer = await _context.Customers.FindAsync(new object[] { request.CustomerId.Value }, cancellationToken);
                if (customer == null)
                    throw new NotFoundException("Cliente", request.CustomerId.Value);
            }
            else
            {
                customer = await _context.Customers.FirstOrDefaultAsync(c => c.CpfCnpj == "000.000.000-00", cancellationToken);
                if (customer == null)
                {
                    customer = new Customer
                    {
                        Name = "Consumidor Final (Balcão)",
                        CpfCnpj = "000.000.000-00",
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.Customers.Add(customer);
                    await _context.SaveChangesAsync(cancellationToken);
                }
            }

            if (request.Items == null || !request.Items.Any())
                throw new BusinessRuleException("A venda deve conter pelo menos um item.");

            var currentUserId = _currentUserService.UserId;
            var saleNumber = await GenerateNextSaleNumberAsync(cancellationToken);

            var sale = new Sale
            {
                Number = saleNumber,
                CustomerId = customer.Id,
                SaleDate = DateTime.UtcNow,
                Discount = request.Discount,
                AdditionalCharge = request.AdditionalCharge,
                Status = SaleStatus.Completed,
                CreatedByUserId = currentUserId,
                CreatedAt = DateTime.UtcNow
            };

            // Process items and validate inventory for products
            foreach (var itemReq in request.Items)
            {
                var item = await ProcessSaleItemAsync(itemReq, sale, isWorkOrderConversion: false, cancellationToken);
                sale.Items.Add(item);
            }

            sale.RecalculateTotals();

            // Process payments if provided
            if (request.Payments != null && request.Payments.Any())
            {
                foreach (var payReq in request.Payments)
                {
                    PaymentMethod? paymentMethod = null;
                    if (payReq.PaymentMethodId > 0)
                    {
                        paymentMethod = await _context.PaymentMethods.FindAsync(new object[] { payReq.PaymentMethodId }, cancellationToken);
                    }
                    if (paymentMethod == null && !string.IsNullOrWhiteSpace(payReq.PaymentMethod))
                    {
                        var mName = payReq.PaymentMethod.Trim().ToLower();
                        paymentMethod = await _context.PaymentMethods.FirstOrDefaultAsync(p =>
                            p.Name.ToLower() == mName || p.Code.ToLower() == mName, cancellationToken);
                    }
                    if (paymentMethod == null)
                    {
                        paymentMethod = await _context.PaymentMethods.FirstOrDefaultAsync(p => p.IsActive, cancellationToken);
                    }

                    if (paymentMethod == null || !paymentMethod.IsActive)
                        throw new BusinessRuleException("Forma de pagamento inválida ou inativa.");

                    sale.Payments.Add(new SalePayment
                    {
                        PaymentMethodId = paymentMethod.Id,
                        Amount = payReq.Amount,
                        Installments = Math.Max(1, payReq.Installments),
                        TransactionCode = payReq.TransactionCode?.Trim(),
                        PaidAt = DateTime.UtcNow
                    });
                }

                var paidTotal = sale.Payments.Sum(p => p.Amount);
                if (Math.Round(paidTotal, 2) >= Math.Round(sale.Total, 2))
                {
                    sale.Status = SaleStatus.Completed;
                }
            }

            _context.Sales.Add(sale);
            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            await _auditService.LogAsync("Sale", sale.Id.ToString(), "Create", null, new { sale.Number, sale.Total, sale.Status }, cancellationToken);

            return await GetByIdAsync(sale.Id, cancellationToken);
        }

        public async Task<SaleResponse> AddItemAsync(int saleId, AddSaleItemRequest request, CancellationToken cancellationToken = default)
        {
            await using var transaction = await _context.BeginTransactionAsync(cancellationToken);

            var sale = await _context.Sales
                .Include(s => s.Items)
                .FirstOrDefaultAsync(s => s.Id == saleId, cancellationToken);

            if (sale == null)
                throw new NotFoundException("Venda", saleId);

            if (sale.Status != SaleStatus.Open)
                throw new BusinessRuleException($"Itens só podem ser adicionados a vendas com status 'Open'. Status atual: '{sale.Status}'.");

            var item = await ProcessSaleItemAsync(request, sale, isWorkOrderConversion: false, cancellationToken);
            sale.Items.Add(item);
            sale.RecalculateTotals();
            sale.UpdatedAt = DateTime.UtcNow;
            sale.UpdatedByUserId = _currentUserService.UserId;

            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            await _auditService.LogAsync("Sale", saleId.ToString(), "AddItem", null, new { item.Description, item.Total }, cancellationToken);

            return await GetByIdAsync(saleId, cancellationToken);
        }

        public async Task<SaleResponse> RemoveItemAsync(int saleId, int itemId, CancellationToken cancellationToken = default)
        {
            await using var transaction = await _context.BeginTransactionAsync(cancellationToken);

            var sale = await _context.Sales
                .Include(s => s.Items)
                .FirstOrDefaultAsync(s => s.Id == saleId, cancellationToken);

            if (sale == null)
                throw new NotFoundException("Venda", saleId);

            if (sale.Status != SaleStatus.Open)
                throw new BusinessRuleException($"Itens só podem ser removidos de vendas com status 'Open'. Status atual: '{sale.Status}'.");

            var item = sale.Items.FirstOrDefault(i => i.Id == itemId);
            if (item == null)
                throw new NotFoundException("Item da Venda", itemId);

            // If it was a product, return stock
            if (item.ItemType == ItemType.Product && item.ProductId.HasValue)
            {
                var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == item.ProductId.Value, cancellationToken);
                if (product != null)
                {
                    var prevStock = product.StockQuantity;
                    var newStock = prevStock + item.Quantity;
                    product.StockQuantity = newStock;
                    product.UpdatedAt = DateTime.UtcNow;

                    _context.StockMovements.Add(new StockMovement
                    {
                        ProductId = product.Id,
                        Type = StockMovementType.Return,
                        Quantity = item.Quantity,
                        PreviousStock = prevStock,
                        NewStock = newStock,
                        UnitCost = product.CostPrice,
                        ReferenceType = "SaleItemRemoved",
                        ReferenceId = sale.Id,
                        Description = $"Estorno por remoção de item da venda {sale.Number}",
                        CreatedByUserId = _currentUserService.UserId,
                        CreatedAt = DateTime.UtcNow
                    });
                }
            }

            sale.Items.Remove(item);
            sale.RecalculateTotals();
            sale.UpdatedAt = DateTime.UtcNow;
            sale.UpdatedByUserId = _currentUserService.UserId;

            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            await _auditService.LogAsync("Sale", saleId.ToString(), "RemoveItem", new { itemId, item.Description }, null, cancellationToken);

            return await GetByIdAsync(saleId, cancellationToken);
        }

        public async Task<SaleResponse> AddPaymentAsync(int saleId, AddPaymentRequest request, CancellationToken cancellationToken = default)
        {
            var sale = await _context.Sales
                .Include(s => s.Payments)
                .FirstOrDefaultAsync(s => s.Id == saleId, cancellationToken);

            if (sale == null)
                throw new NotFoundException("Venda", saleId);

            if (sale.Status != SaleStatus.Open)
                throw new BusinessRuleException($"Pagamentos só podem ser adicionados a vendas com status 'Open'. Status atual: '{sale.Status}'.");

            var paymentMethod = await _context.PaymentMethods.FindAsync(new object[] { request.PaymentMethodId }, cancellationToken);
            if (paymentMethod == null || !paymentMethod.IsActive)
                throw new BusinessRuleException("Forma de pagamento inválida ou inativa.");

            var currentPaid = sale.Payments.Sum(p => p.Amount);
            if (currentPaid + request.Amount >= sale.Total)
            {
                sale.Status = SaleStatus.Completed;
            }

            sale.Payments.Add(new SalePayment
            {
                SaleId = saleId,
                PaymentMethodId = request.PaymentMethodId,
                Amount = request.Amount,
                Installments = Math.Max(1, request.Installments),
                TransactionCode = request.TransactionCode?.Trim(),
                PaidAt = DateTime.UtcNow
            });

            sale.UpdatedAt = DateTime.UtcNow;
            sale.UpdatedByUserId = _currentUserService.UserId;

            await _context.SaveChangesAsync(cancellationToken);
            await _auditService.LogAsync("Sale", saleId.ToString(), "AddPayment", null, new { request.PaymentMethodId, request.Amount }, cancellationToken);

            return await GetByIdAsync(saleId, cancellationToken);
        }

        public async Task<SaleResponse> CompleteSaleAsync(int saleId, CancellationToken cancellationToken = default)
        {
            var sale = await _context.Sales
                .Include(s => s.Items)
                .Include(s => s.Payments)
                .Include(s => s.WorkOrder)
                .FirstOrDefaultAsync(s => s.Id == saleId, cancellationToken);

            if (sale == null)
                throw new NotFoundException("Venda", saleId);

            sale.CompleteSale();
            sale.UpdatedByUserId = _currentUserService.UserId;

            // If linked to an OS, ensure OS is marked delivered if it wasn't already
            if (sale.WorkOrder != null && sale.WorkOrder.Status != WorkOrderStatus.Delivered)
            {
                sale.WorkOrder.ChangeStatus(WorkOrderStatus.Delivered, _currentUserService.UserId, "Venda finalizada e quitada.");
            }

            await _context.SaveChangesAsync(cancellationToken);
            await _auditService.LogAsync("Sale", saleId.ToString(), "Complete", null, new { sale.Total, PaidAmount = sale.Payments.Sum(p => p.Amount) }, cancellationToken);

            return await GetByIdAsync(saleId, cancellationToken);
        }

        public async Task<SaleResponse> CancelSaleAsync(int saleId, CancelSaleRequest request, CancellationToken cancellationToken = default)
        {
            await using var transaction = await _context.BeginTransactionAsync(cancellationToken);

            var sale = await _context.Sales
                .Include(s => s.Items)
                .Include(s => s.WorkOrder)
                .FirstOrDefaultAsync(s => s.Id == saleId, cancellationToken);

            if (sale == null)
                throw new NotFoundException("Venda", saleId);

            var currentUserId = _currentUserService.UserId ?? 0;
            var reason = string.IsNullOrWhiteSpace(request?.Reason) ? "Cancelamento solicitado pelo usuário" : request.Reason.Trim();
            sale.CancelSale(currentUserId, reason);

            // Revert product inventory
            foreach (var item in sale.Items.Where(i => i.ItemType == ItemType.Product && i.ProductId.HasValue))
            {
                var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == item.ProductId!.Value, cancellationToken);
                if (product != null)
                {
                    var prevStock = product.StockQuantity;
                    var newStock = prevStock + item.Quantity;
                    product.StockQuantity = newStock;
                    product.UpdatedAt = DateTime.UtcNow;

                    _context.StockMovements.Add(new StockMovement
                    {
                        ProductId = product.Id,
                        Type = StockMovementType.Cancellation,
                        Quantity = item.Quantity,
                        PreviousStock = prevStock,
                        NewStock = newStock,
                        UnitCost = product.CostPrice,
                        ReferenceType = "SaleCancellation",
                        ReferenceId = sale.Id,
                        Description = $"Estorno por cancelamento da venda {sale.Number}: {request.Reason}",
                        CreatedByUserId = currentUserId,
                        CreatedAt = DateTime.UtcNow
                    });
                }
            }

            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            await _auditService.LogAsync("Sale", saleId.ToString(), "Cancel", null, new { sale.Number, request.Reason }, cancellationToken);

            return await GetByIdAsync(saleId, cancellationToken);
        }

        public async Task<SaleResponse> ConvertToSaleAsync(int workOrderId, ConvertWorkOrderToSaleRequest request, CancellationToken cancellationToken = default)
        {
            await using var transaction = await _context.BeginTransactionAsync(cancellationToken);

            var workOrder = await _context.WorkOrders
                .Include(w => w.Customer)
                .Include(w => w.Items)
                .Include(w => w.Sale)
                .FirstOrDefaultAsync(w => w.Id == workOrderId, cancellationToken);

            if (workOrder == null)
                throw new NotFoundException("Ordem de Serviço", workOrderId);

            // 1. Cannot be cancelled
            if (workOrder.Status == WorkOrderStatus.Cancelled)
                throw new BusinessRuleException("Não é permitido converter uma Ordem de Serviço cancelada em venda.");

            // 2. Prevent duplicate conversion
            if (workOrder.Sale != null)
                throw new BusinessRuleException($"Esta Ordem de Serviço já foi convertida na venda '{workOrder.Sale.Number}'.");

            var existingSale = await _context.Sales.AnyAsync(s => s.WorkOrderId == workOrderId, cancellationToken);
            if (existingSale)
                throw new BusinessRuleException("Já existe uma venda vinculada a esta Ordem de Serviço.");

            // 3. Must have items
            if (!workOrder.Items.Any())
                throw new BusinessRuleException("A Ordem de Serviço não possui itens para faturamento. Adicione pelo menos um serviço ou produto antes de transformar em venda.");

            // 4. Must not be cancelled
            if (workOrder.Status == WorkOrderStatus.Cancelled)
            {
                throw new BusinessRuleException("Não é permitido converter uma Ordem de Serviço cancelada em venda.");
            }

            // 5. INVENTORY AVAILABILITY CHECK:
            // Check all products in the OS. If any product lacks available stock, abort and rollback!
            var productItems = workOrder.Items.Where(i => i.ItemType == ItemType.Product && i.ProductId.HasValue).ToList();
            var productIds = productItems.Select(i => i.ProductId!.Value).Distinct().ToList();

            var productsInDb = await _context.Products
                .Where(p => productIds.Contains(p.Id))
                .ToListAsync(cancellationToken);

            foreach (var group in productItems.GroupBy(i => i.ProductId!.Value))
            {
                var product = productsInDb.FirstOrDefault(p => p.Id == group.Key);
                if (product == null)
                    throw new BusinessRuleException($"Produto com ID {group.Key} não foi encontrado no catálogo.");

                var totalNeeded = group.Sum(i => i.Quantity);
                if (product.StockQuantity < totalNeeded)
                {
                    throw new BusinessRuleException($"Estoque insuficiente para o produto '{product.Name}' (SKU: {product.Sku}). Solicitado: {totalNeeded} {product.Unit}, Disponível: {product.StockQuantity} {product.Unit}. Operação cancelada sem alterações de estoque.");
                }
            }

            var currentUserId = _currentUserService.UserId;
            var saleNumber = await GenerateNextSaleNumberAsync(cancellationToken);

            var sale = new Sale
            {
                Number = saleNumber,
                CustomerId = workOrder.CustomerId,
                WorkOrderId = workOrder.Id,
                SaleDate = DateTime.UtcNow,
                Discount = workOrder.Discount + (request.AdditionalDiscount ?? request.Discount ?? 0),
                AdditionalCharge = workOrder.AdditionalCharge + (request.AdditionalCharge ?? 0),
                Status = SaleStatus.Completed,
                CreatedByUserId = currentUserId,
                CreatedAt = DateTime.UtcNow
            };

            // Copy items to sale with historical price snapshot and deduct product inventory
            foreach (var woItem in workOrder.Items)
            {
                var saleItem = new SaleItem
                {
                    ItemType = woItem.ItemType,
                    ProductId = woItem.ProductId,
                    ServiceId = woItem.ServiceId,
                    Description = woItem.Description,
                    Quantity = woItem.Quantity,
                    UnitPrice = woItem.UnitPrice,
                    Discount = woItem.Discount,
                    Total = woItem.Total,
                    CreatedAt = DateTime.UtcNow
                };

                sale.Items.Add(saleItem);

                // Deduct stock for products and record stock movement
                if (woItem.ItemType == ItemType.Product && woItem.ProductId.HasValue)
                {
                    var product = productsInDb.First(p => p.Id == woItem.ProductId.Value);
                    var prevStock = product.StockQuantity;
                    var newStock = prevStock - woItem.Quantity;

                    product.StockQuantity = newStock;
                    product.UpdatedAt = DateTime.UtcNow;
                    product.UpdatedByUserId = currentUserId;

                    _context.StockMovements.Add(new StockMovement
                    {
                        ProductId = product.Id,
                        Type = StockMovementType.WorkOrder,
                        Quantity = -woItem.Quantity,
                        PreviousStock = prevStock,
                        NewStock = newStock,
                        UnitCost = product.CostPrice,
                        ReferenceType = "WorkOrderConversion",
                        ReferenceId = workOrder.Id,
                        Description = $"Baixa por faturamento da OS {workOrder.Number} na venda {saleNumber}",
                        CreatedByUserId = currentUserId,
                        CreatedAt = DateTime.UtcNow
                    });
                }
            }

            sale.RecalculateTotals();

            // Process payments if provided
            if (request.Payments != null && request.Payments.Any())
            {
                foreach (var payReq in request.Payments)
                {
                    PaymentMethod? paymentMethod = null;
                    if (payReq.PaymentMethodId > 0)
                    {
                        paymentMethod = await _context.PaymentMethods.FindAsync(new object[] { payReq.PaymentMethodId }, cancellationToken);
                    }
                    if (paymentMethod == null && !string.IsNullOrWhiteSpace(payReq.PaymentMethod))
                    {
                        var mName = payReq.PaymentMethod.Trim().ToLower();
                        paymentMethod = await _context.PaymentMethods.FirstOrDefaultAsync(p =>
                            p.Name.ToLower() == mName || p.Code.ToLower() == mName, cancellationToken);
                    }
                    if (paymentMethod == null)
                    {
                        paymentMethod = await _context.PaymentMethods.FirstOrDefaultAsync(p => p.IsActive, cancellationToken);
                    }

                    if (paymentMethod == null || !paymentMethod.IsActive)
                        throw new BusinessRuleException("Forma de pagamento inválida ou inativa.");

                    sale.Payments.Add(new SalePayment
                    {
                        PaymentMethodId = paymentMethod.Id,
                        Amount = payReq.Amount,
                        Installments = Math.Max(1, payReq.Installments),
                        TransactionCode = payReq.TransactionCode?.Trim(),
                        PaidAt = DateTime.UtcNow
                    });
                }

                var paidTotal = sale.Payments.Sum(p => p.Amount);
                if (Math.Round(paidTotal, 2) >= Math.Round(sale.Total, 2))
                {
                    sale.Status = SaleStatus.Completed;
                }
            }

            // Update Work Order status to Delivered or keep history
            if (workOrder.Status != WorkOrderStatus.Delivered)
            {
                workOrder.ChangeStatus(WorkOrderStatus.Delivered, currentUserId, $"OS faturada e convertida na venda {saleNumber}", isAdministrativeOverride: true);
            }

            _context.Sales.Add(sale);
            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            await _auditService.LogAsync("WorkOrder", workOrder.Id.ToString(), "ConvertToSale", null, new { SaleNumber = saleNumber, WorkOrderNumber = workOrder.Number, sale.Total }, cancellationToken);
            await _auditService.LogAsync("Sale", sale.Id.ToString(), "CreateFromWorkOrder", null, new { sale.Number, WorkOrderNumber = workOrder.Number }, cancellationToken);

            return await GetByIdAsync(sale.Id, cancellationToken);
        }

        public async Task<List<PaymentMethodResponse>> GetPaymentMethodsAsync(CancellationToken cancellationToken = default)
        {
            var methods = await _context.PaymentMethods
                .AsNoTracking()
                .OrderBy(p => p.Id)
                .ToListAsync(cancellationToken);

            return methods.Select(m => new PaymentMethodResponse
            {
                Id = m.Id,
                Name = m.Name,
                Code = m.Code,
                IsActive = m.IsActive
            }).ToList();
        }

        private async Task<SaleItem> ProcessSaleItemAsync(AddSaleItemRequest req, Sale sale, bool isWorkOrderConversion, CancellationToken cancellationToken)
        {
            string description;
            decimal unitPrice;

            var itemType = req.ItemType;
            if ((int)itemType == 0)
            {
                itemType = req.ProductId.HasValue ? ItemType.Product : ItemType.Service;
            }

            if (itemType == ItemType.Product)
            {
                if (!req.ProductId.HasValue)
                    throw new BusinessRuleException("O produto é obrigatório para itens do tipo 'Product'.");

                var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == req.ProductId.Value, cancellationToken);
                if (product == null)
                    throw new NotFoundException("Produto", req.ProductId.Value);

                if (!product.IsActive)
                    throw new BusinessRuleException($"O produto '{product.Name}' está inativo no catálogo.");

                // Validate stock availability
                if (product.StockQuantity < req.Quantity)
                {
                    throw new BusinessRuleException($"Estoque insuficiente para o produto '{product.Name}'. Solicitado: {req.Quantity} {product.Unit}, Disponível: {product.StockQuantity} {product.Unit}.");
                }

                description = string.IsNullOrWhiteSpace(req.Description) ? product.Name : req.Description.Trim();
                unitPrice = req.UnitPrice ?? product.SalePrice;

                // Decrement stock
                var prevStock = product.StockQuantity;
                var newStock = prevStock - req.Quantity;
                product.StockQuantity = newStock;
                product.UpdatedAt = DateTime.UtcNow;

                _context.StockMovements.Add(new StockMovement
                {
                    ProductId = product.Id,
                    Type = StockMovementType.Sale,
                    Quantity = -req.Quantity,
                    PreviousStock = prevStock,
                    NewStock = newStock,
                    UnitCost = product.CostPrice,
                    ReferenceType = "DirectSale",
                    Description = $"Venda direta {sale.Number}",
                    CreatedByUserId = _currentUserService.UserId,
                    CreatedAt = DateTime.UtcNow
                });
            }
            else
            {
                if (!req.ServiceId.HasValue)
                    throw new BusinessRuleException("O serviço é obrigatório para itens do tipo 'Service'.");

                var service = await _context.Services.FirstOrDefaultAsync(s => s.Id == req.ServiceId.Value, cancellationToken);
                if (service == null)
                    throw new NotFoundException("Serviço", req.ServiceId.Value);

                if (!service.IsActive)
                    throw new BusinessRuleException($"O serviço '{service.Name}' está inativo no catálogo.");

                description = string.IsNullOrWhiteSpace(req.Description) ? service.Name : req.Description.Trim();
                unitPrice = req.UnitPrice ?? service.SalePrice;
            }

            var item = new SaleItem
            {
                ItemType = itemType,
                ProductId = req.ProductId,
                ServiceId = req.ServiceId,
                Description = description,
                Quantity = req.Quantity,
                UnitPrice = unitPrice,
                Discount = req.Discount,
                CreatedAt = DateTime.UtcNow
            };

            item.CalculateTotal();
            return item;
        }

        private async Task<string> GenerateNextSaleNumberAsync(CancellationToken cancellationToken)
        {
            var count = await _context.Sales.CountAsync(cancellationToken);
            return $"VENDA-{(count + 1):D6}";
        }

        private static SaleResponse MapToResponse(Sale s)
        {
            var totalPaid = s.Payments?.Sum(p => p.Amount) ?? 0;
            return new SaleResponse
            {
                Id = s.Id,
                Number = s.Number,
                CustomerId = s.CustomerId,
                CustomerName = s.Customer?.Name ?? string.Empty,
                CustomerPhone = s.Customer?.CellPhone ?? s.Customer?.Phone,
                WorkOrderId = s.WorkOrderId,
                WorkOrderNumber = s.WorkOrder?.Number,
                SaleDate = s.SaleDate,
                Subtotal = s.Subtotal,
                Discount = s.Discount,
                AdditionalCharge = s.AdditionalCharge,
                Total = s.Total,
                Status = s.Status,
                CreatedByUserName = s.CreatedByUser?.Username,
                CancelledByUserName = s.CancelledByUser?.Username,
                CancelledAt = s.CancelledAt,
                CancellationReason = s.CancellationReason,
                CreatedAt = s.CreatedAt,
                UpdatedAt = s.UpdatedAt,
                TotalPaid = totalPaid,
                Items = s.Items.Select(i => new SaleItemResponse
                {
                    Id = i.Id,
                    SaleId = i.SaleId,
                    ItemType = i.ItemType,
                    ProductId = i.ProductId,
                    ProductSku = i.Product?.Sku,
                    ServiceId = i.ServiceId,
                    Description = i.Description,
                    Quantity = i.Quantity,
                    UnitPrice = i.UnitPrice,
                    Discount = i.Discount,
                    Total = i.Total
                }).ToList(),
                Payments = s.Payments.Select(p => new SalePaymentResponse
                {
                    Id = p.Id,
                    PaymentMethodId = p.PaymentMethodId,
                    PaymentMethodName = p.PaymentMethod?.Name ?? string.Empty,
                    Amount = p.Amount,
                    Installments = p.Installments,
                    TransactionCode = p.TransactionCode,
                    PaidAt = p.PaidAt
                }).ToList()
            };
        }
    }
}
