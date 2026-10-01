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
    public class WorkOrderService : IWorkOrderService
    {
        private readonly IOficinaBikeDbContext _context;
        private readonly ICurrentUserService _currentUserService;
        private readonly IAuditService _auditService;
        private readonly ISaleService _saleService;

        public WorkOrderService(
            IOficinaBikeDbContext context,
            ICurrentUserService currentUserService,
            IAuditService auditService,
            ISaleService saleService)
        {
            _context = context;
            _currentUserService = currentUserService;
            _auditService = auditService;
            _saleService = saleService;
        }

        public async Task<PagedResult<WorkOrderResponse>> GetWorkOrdersAsync(
            PagedRequest request,
            int? customerId = null,
            int? bicycleId = null,
            WorkOrderStatus? status = null,
            DateTime? startDate = null,
            DateTime? endDate = null,
            CancellationToken cancellationToken = default)
        {
            var query = _context.WorkOrders
                .AsNoTracking()
                .Include(w => w.Customer)
                .Include(w => w.Bicycle)
                .Include(w => w.AssignedToUser)
                .Include(w => w.CreatedByUser)
                .Include(w => w.Sale)
                .Include(w => w.Items)
                    .ThenInclude(i => i.Product)
                .Include(w => w.Items)
                    .ThenInclude(i => i.Service)
                .Include(w => w.StatusHistory)
                    .ThenInclude(h => h.ChangedByUser)
                .AsQueryable();

            if (customerId.HasValue)
                query = query.Where(w => w.CustomerId == customerId.Value);

            if (bicycleId.HasValue)
                query = query.Where(w => w.BicycleId == bicycleId.Value);

            if (status.HasValue)
                query = query.Where(w => w.Status == status.Value);

            if (startDate.HasValue)
                query = query.Where(w => w.OpeningDate >= startDate.Value);

            if (endDate.HasValue)
                query = query.Where(w => w.OpeningDate <= endDate.Value);

            if (!string.IsNullOrWhiteSpace(request.Search))
            {
                var term = request.Search.Trim().ToLower();
                query = query.Where(w => w.Number.ToLower().Contains(term) ||
                                         w.Customer.Name.ToLower().Contains(term) ||
                                         w.Bicycle.Brand.ToLower().Contains(term) ||
                                         w.Bicycle.Model.ToLower().Contains(term) ||
                                         w.Description.ToLower().Contains(term));
            }

            var totalItems = await query.CountAsync(cancellationToken);
            var page = Math.Max(1, request.Page);
            var pageSize = Math.Clamp(request.PageSize, 1, 100);

            var orders = await query
                .OrderByDescending(w => w.Id)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(cancellationToken);

            var dtos = orders.Select(MapToResponse).ToList();
            return new PagedResult<WorkOrderResponse>(dtos, totalItems, page, pageSize);
        }

        public async Task<WorkOrderResponse> GetByIdAsync(int id, CancellationToken cancellationToken = default)
        {
            var w = await _context.WorkOrders
                .AsNoTracking()
                .Include(w => w.Customer)
                .Include(w => w.Bicycle)
                .Include(w => w.AssignedToUser)
                .Include(w => w.CreatedByUser)
                .Include(w => w.Sale)
                .Include(w => w.Items)
                    .ThenInclude(i => i.Product)
                .Include(w => w.Items)
                    .ThenInclude(i => i.Service)
                .Include(w => w.StatusHistory)
                    .ThenInclude(h => h.ChangedByUser)
                .FirstOrDefaultAsync(w => w.Id == id, cancellationToken);

            if (w == null)
                throw new NotFoundException("Ordem de Serviço", id);

            return MapToResponse(w);
        }

        public async Task<WorkOrderResponse> CreateAsync(CreateWorkOrderRequest request, CancellationToken cancellationToken = default)
        {
            var customer = await _context.Customers.FindAsync(new object[] { request.CustomerId }, cancellationToken);
            if (customer == null)
                throw new NotFoundException("Cliente", request.CustomerId);

            var bicycle = await _context.Bicycles.FirstOrDefaultAsync(b => b.Id == request.BicycleId && b.CustomerId == request.CustomerId, cancellationToken);
            if (bicycle == null)
                throw new BusinessRuleException("A bicicleta informada não foi encontrada ou não pertence a este cliente.");

            var currentUserId = _currentUserService.UserId;

            // Generate sequential Work Order number
            var nextNumber = await GenerateNextWorkOrderNumberAsync(cancellationToken);

            var workOrder = new WorkOrder
            {
                Number = nextNumber,
                CustomerId = request.CustomerId,
                BicycleId = request.BicycleId,
                OpeningDate = DateTime.UtcNow,
                ExpectedDate = request.ExpectedDate,
                Status = WorkOrderStatus.Open,
                Description = request.Description.Trim(),
                CustomerComplaint = request.CustomerComplaint?.Trim(),
                TechnicalEvaluation = request.TechnicalEvaluation?.Trim(),
                TechnicalNotes = request.TechnicalNotes?.Trim(),
                Discount = request.Discount,
                AdditionalCharge = request.AdditionalCharge,
                AssignedToUserId = request.AssignedToUserId,
                CreatedByUserFkId = currentUserId,
                CreatedAt = DateTime.UtcNow,
                CreatedByUserId = currentUserId
            };

            // Initial status history
            workOrder.StatusHistory.Add(new WorkOrderStatusHistory
            {
                PreviousStatus = WorkOrderStatus.Open,
                NewStatus = WorkOrderStatus.Open,
                Reason = "Abertura da Ordem de Serviço",
                ChangedByUserId = currentUserId,
                ChangedAt = DateTime.UtcNow
            });

            // Add items if supplied in creation
            if (request.Items != null && request.Items.Any())
            {
                foreach (var itemReq in request.Items)
                {
                    var item = await BuildWorkOrderItemAsync(itemReq, cancellationToken);
                    workOrder.Items.Add(item);
                }
            }

            workOrder.RecalculateTotals();
            workOrder.RequestedTotal = workOrder.Total;

            _context.WorkOrders.Add(workOrder);
            await _context.SaveChangesAsync(cancellationToken);

            await _auditService.LogAsync("WorkOrder", workOrder.Id.ToString(), "Create", null, new { workOrder.Number, workOrder.CustomerId, workOrder.Total }, cancellationToken);

            return await GetByIdAsync(workOrder.Id, cancellationToken);
        }

        public async Task<WorkOrderResponse> UpdateAsync(int id, UpdateWorkOrderRequest request, CancellationToken cancellationToken = default)
        {
            var workOrder = await _context.WorkOrders
                .Include(w => w.Items)
                .FirstOrDefaultAsync(w => w.Id == id, cancellationToken);

            if (workOrder == null)
                throw new NotFoundException("Ordem de Serviço", id);

            if (workOrder.Status == WorkOrderStatus.Delivered || workOrder.Status == WorkOrderStatus.Cancelled)
                throw new BusinessRuleException($"Não é permitido alterar dados de uma Ordem de Serviço com status '{workOrder.Status}'.");

            var oldValues = new { workOrder.Description, workOrder.Discount, workOrder.AdditionalCharge, workOrder.Total };

            workOrder.ExpectedDate = request.ExpectedDate;
            workOrder.Description = request.Description.Trim();
            workOrder.CustomerComplaint = request.CustomerComplaint?.Trim();
            workOrder.TechnicalEvaluation = request.TechnicalEvaluation?.Trim();
            workOrder.TechnicalNotes = request.TechnicalNotes?.Trim();
            workOrder.AssignedToUserId = request.AssignedToUserId;
            workOrder.Discount = request.Discount;
            workOrder.AdditionalCharge = request.AdditionalCharge;
            workOrder.UpdatedAt = DateTime.UtcNow;
            workOrder.UpdatedByUserId = _currentUserService.UserId;

            workOrder.RecalculateTotals();

            await _context.SaveChangesAsync(cancellationToken);
            await _auditService.LogAsync("WorkOrder", workOrder.Id.ToString(), "Update", oldValues, new { workOrder.Total }, cancellationToken);

            return await GetByIdAsync(workOrder.Id, cancellationToken);
        }

        public async Task<WorkOrderResponse> AddItemAsync(int workOrderId, AddWorkOrderItemRequest request, CancellationToken cancellationToken = default)
        {
            var workOrder = await _context.WorkOrders
                .Include(w => w.Items)
                .FirstOrDefaultAsync(w => w.Id == workOrderId, cancellationToken);

            if (workOrder == null)
                throw new NotFoundException("Ordem de Serviço", workOrderId);

            if (workOrder.Status == WorkOrderStatus.Delivered || workOrder.Status == WorkOrderStatus.Cancelled)
                throw new BusinessRuleException($"Não é permitido adicionar itens a uma Ordem de Serviço com status '{workOrder.Status}'.");

            var item = await BuildWorkOrderItemAsync(request, cancellationToken);
            item.WorkOrderId = workOrderId;

            workOrder.Items.Add(item);
            workOrder.RecalculateTotals();
            workOrder.UpdatedAt = DateTime.UtcNow;
            workOrder.UpdatedByUserId = _currentUserService.UserId;

            await _context.SaveChangesAsync(cancellationToken);
            await _auditService.LogAsync("WorkOrder", workOrderId.ToString(), "AddItem", null, new { item.Description, item.Total }, cancellationToken);

            return await GetByIdAsync(workOrderId, cancellationToken);
        }

        public async Task<WorkOrderResponse> UpdateItemAsync(int workOrderId, int itemId, UpdateWorkOrderItemRequest request, CancellationToken cancellationToken = default)
        {
            var workOrder = await _context.WorkOrders
                .Include(w => w.Items)
                .FirstOrDefaultAsync(w => w.Id == workOrderId, cancellationToken);

            if (workOrder == null)
                throw new NotFoundException("Ordem de Serviço", workOrderId);

            if (workOrder.Status == WorkOrderStatus.Delivered || workOrder.Status == WorkOrderStatus.Cancelled)
                throw new BusinessRuleException($"Não é permitido editar itens de uma Ordem de Serviço com status '{workOrder.Status}'.");

            var item = workOrder.Items.FirstOrDefault(i => i.Id == itemId);
            if (item == null)
                throw new NotFoundException("Item da Ordem de Serviço", itemId);

            item.Quantity = request.Quantity;
            item.UnitPrice = request.UnitPrice;
            item.Discount = request.Discount;
            if (!string.IsNullOrWhiteSpace(request.Description))
                item.Description = request.Description.Trim();

            item.CalculateTotal();
            workOrder.RecalculateTotals();
            workOrder.UpdatedAt = DateTime.UtcNow;
            workOrder.UpdatedByUserId = _currentUserService.UserId;

            await _context.SaveChangesAsync(cancellationToken);
            await _auditService.LogAsync("WorkOrder", workOrderId.ToString(), "UpdateItem", null, new { itemId, item.Total }, cancellationToken);

            return await GetByIdAsync(workOrderId, cancellationToken);
        }

        public async Task<WorkOrderResponse> RemoveItemAsync(int workOrderId, int itemId, CancellationToken cancellationToken = default)
        {
            var workOrder = await _context.WorkOrders
                .Include(w => w.Items)
                .FirstOrDefaultAsync(w => w.Id == workOrderId, cancellationToken);

            if (workOrder == null)
                throw new NotFoundException("Ordem de Serviço", workOrderId);

            if (workOrder.Status == WorkOrderStatus.Delivered || workOrder.Status == WorkOrderStatus.Cancelled)
                throw new BusinessRuleException($"Não é permitido remover itens de uma Ordem de Serviço com status '{workOrder.Status}'.");

            var item = workOrder.Items.FirstOrDefault(i => i.Id == itemId);
            if (item == null)
                throw new NotFoundException("Item da Ordem de Serviço", itemId);

            workOrder.Items.Remove(item);
            workOrder.RecalculateTotals();
            workOrder.UpdatedAt = DateTime.UtcNow;
            workOrder.UpdatedByUserId = _currentUserService.UserId;

            await _context.SaveChangesAsync(cancellationToken);
            await _auditService.LogAsync("WorkOrder", workOrderId.ToString(), "RemoveItem", new { itemId, item.Description }, null, cancellationToken);

            return await GetByIdAsync(workOrderId, cancellationToken);
        }

        public async Task<WorkOrderResponse> ChangeStatusAsync(int workOrderId, ChangeWorkOrderStatusRequest request, CancellationToken cancellationToken = default)
        {
            var workOrder = await _context.WorkOrders
                .Include(w => w.StatusHistory)
                .FirstOrDefaultAsync(w => w.Id == workOrderId, cancellationToken);

            if (workOrder == null)
                throw new NotFoundException("Ordem de Serviço", workOrderId);

            var oldStatus = workOrder.Status;
            workOrder.ChangeStatus(request.Status, _currentUserService.UserId, request.Reason, request.IsAdministrativeOverride);

            await _context.SaveChangesAsync(cancellationToken);
            await _auditService.LogAsync("WorkOrder", workOrderId.ToString(), "ChangeStatus", new { OldStatus = oldStatus }, new { NewStatus = request.Status, request.Reason }, cancellationToken);

            return await GetByIdAsync(workOrderId, cancellationToken);
        }

        public async Task<List<WorkOrderStatusHistoryResponse>> GetStatusHistoryAsync(int workOrderId, CancellationToken cancellationToken = default)
        {
            var history = await _context.WorkOrderStatusHistories
                .AsNoTracking()
                .Include(h => h.ChangedByUser)
                .Where(h => h.WorkOrderId == workOrderId)
                .OrderBy(h => h.ChangedAt)
                .ToListAsync(cancellationToken);

            return history.Select(h => new WorkOrderStatusHistoryResponse
            {
                Id = h.Id,
                PreviousStatus = h.PreviousStatus,
                NewStatus = h.NewStatus,
                Reason = h.Reason,
                ChangedByUserName = h.ChangedByUser?.Username,
                ChangedAt = h.ChangedAt
            }).ToList();
        }

        public async Task<WorkOrderResponse> ApproveAsync(int workOrderId, ApproveWorkOrderRequest request, CancellationToken cancellationToken = default)
        {
            var workOrder = await _context.WorkOrders
                .Include(w => w.StatusHistory)
                .FirstOrDefaultAsync(w => w.Id == workOrderId, cancellationToken);

            if (workOrder == null)
                throw new NotFoundException("Ordem de Serviço", workOrderId);

            if (workOrder.Status != WorkOrderStatus.WaitingApproval && workOrder.Status != WorkOrderStatus.Open)
                throw new BusinessRuleException($"Aprovação permitida apenas para Ordens de Serviço nos status 'Open' ou 'WaitingApproval'. Status atual: '{workOrder.Status}'.");

            var currentUserId = _currentUserService.UserId;

            if (request.Approved)
            {
                workOrder.ApprovalStatus = WorkOrderApprovalStatus.Approved;
                workOrder.ApprovedTotal = request.ApprovedTotal ?? workOrder.Total;
                workOrder.ApprovalDate = DateTime.UtcNow;
                workOrder.ApprovedByUserId = currentUserId;
                workOrder.ApprovalNotes = request.ApprovalNotes;
                workOrder.ChangeStatus(WorkOrderStatus.Approved, currentUserId, "Orçamento aprovado pelo cliente.");
            }
            else
            {
                workOrder.ApprovalStatus = WorkOrderApprovalStatus.Rejected;
                workOrder.ApprovalDate = DateTime.UtcNow;
                workOrder.ApprovedByUserId = currentUserId;
                workOrder.ApprovalNotes = request.ApprovalNotes;
                workOrder.ChangeStatus(WorkOrderStatus.Cancelled, currentUserId, "Orçamento reprovado pelo cliente.");
            }

            await _context.SaveChangesAsync(cancellationToken);
            await _auditService.LogAsync("WorkOrder", workOrderId.ToString(), request.Approved ? "Approve" : "Reject", null, new { Approved = request.Approved, request.ApprovalNotes }, cancellationToken);

            return await GetByIdAsync(workOrderId, cancellationToken);
        }

        public async Task<WorkOrderResponse> CancelAsync(int workOrderId, CancelWorkOrderRequest request, CancellationToken cancellationToken = default)
        {
            var workOrder = await _context.WorkOrders
                .Include(w => w.StatusHistory)
                .FirstOrDefaultAsync(w => w.Id == workOrderId, cancellationToken);

            if (workOrder == null)
                throw new NotFoundException("Ordem de Serviço", workOrderId);

            workOrder.ChangeStatus(WorkOrderStatus.Cancelled, _currentUserService.UserId, request.Reason);

            await _context.SaveChangesAsync(cancellationToken);
            await _auditService.LogAsync("WorkOrder", workOrderId.ToString(), "Cancel", null, new { request.Reason }, cancellationToken);

            return await GetByIdAsync(workOrderId, cancellationToken);
        }

        public async Task<SaleResponse> ConvertToSaleAsync(int workOrderId, ConvertWorkOrderToSaleRequest request, CancellationToken cancellationToken = default)
        {
            return await _saleService.ConvertToSaleAsync(workOrderId, request, cancellationToken);
        }

        private async Task<WorkOrderItem> BuildWorkOrderItemAsync(AddWorkOrderItemRequest req, CancellationToken cancellationToken)
        {
            string description;
            decimal unitPrice;

            if (req.ItemType == ItemType.Product)
            {
                if (!req.ProductId.HasValue)
                    throw new BusinessRuleException("O produto é obrigatório para itens do tipo 'Product'.");

                var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == req.ProductId.Value, cancellationToken);
                if (product == null)
                    throw new NotFoundException("Produto", req.ProductId.Value);

                if (!product.IsActive)
                    throw new BusinessRuleException($"O produto '{product.Name}' está inativo no catálogo.");

                description = string.IsNullOrWhiteSpace(req.Description) ? product.Name : req.Description.Trim();
                unitPrice = req.UnitPrice ?? product.SalePrice;
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

            var item = new WorkOrderItem
            {
                ItemType = req.ItemType,
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

        private async Task<string> GenerateNextWorkOrderNumberAsync(CancellationToken cancellationToken)
        {
            var count = await _context.WorkOrders.CountAsync(cancellationToken);
            return $"OS-{(count + 1):D6}";
        }

        private static WorkOrderResponse MapToResponse(WorkOrder w)
        {
            return new WorkOrderResponse
            {
                Id = w.Id,
                Number = w.Number,
                CustomerId = w.CustomerId,
                CustomerName = w.Customer?.Name ?? string.Empty,
                CustomerPhone = w.Customer?.CellPhone ?? w.Customer?.Phone,
                BicycleId = w.BicycleId,
                BicycleSummary = $"{w.Bicycle?.Brand} {w.Bicycle?.Model} ({w.Bicycle?.Color})",
                BicycleBrand = w.Bicycle?.Brand ?? string.Empty,
                BicycleModel = w.Bicycle?.Model ?? string.Empty,
                BicycleSerialNumber = w.Bicycle?.SerialNumber,
                OpeningDate = w.OpeningDate,
                ExpectedDate = w.ExpectedDate,
                CompletionDate = w.CompletionDate,
                Status = w.Status,
                Description = w.Description,
                CustomerComplaint = w.CustomerComplaint,
                TechnicalEvaluation = w.TechnicalEvaluation,
                TechnicalNotes = w.TechnicalNotes,
                Discount = w.Discount,
                AdditionalCharge = w.AdditionalCharge,
                Subtotal = w.Subtotal,
                Total = w.Total,
                RequestedTotal = w.RequestedTotal,
                ApprovedTotal = w.ApprovedTotal,
                ApprovalStatus = w.ApprovalStatus,
                ApprovalDate = w.ApprovalDate,
                ApprovedByUserName = w.ApprovedByUser?.Username,
                ApprovalNotes = w.ApprovalNotes,
                AssignedToUserId = w.AssignedToUserId,
                AssignedToUserName = w.AssignedToUser?.Username,
                CreatedByUserName = w.CreatedByUser?.Username,
                SaleId = w.Sale?.Id,
                SaleNumber = w.Sale?.Number,
                CreatedAt = w.CreatedAt,
                UpdatedAt = w.UpdatedAt,
                Items = w.Items.Select(i => new WorkOrderItemResponse
                {
                    Id = i.Id,
                    WorkOrderId = i.WorkOrderId,
                    ItemType = i.ItemType,
                    ProductId = i.ProductId,
                    ProductName = i.Product?.Name ?? (i.ItemType == ItemType.Product ? i.Description : null),
                    ProductSku = i.Product?.Sku,
                    ServiceId = i.ServiceId,
                    ServiceName = i.Service?.Name ?? (i.ItemType == ItemType.Service ? i.Description : null),
                    Description = i.Description,
                    Quantity = i.Quantity,
                    UnitPrice = i.UnitPrice,
                    Discount = i.Discount,
                    Total = i.Total
                }).ToList(),
                StatusHistory = w.StatusHistory.OrderBy(h => h.ChangedAt).Select(h => new WorkOrderStatusHistoryResponse
                {
                    Id = h.Id,
                    PreviousStatus = h.PreviousStatus,
                    NewStatus = h.NewStatus,
                    Reason = h.Reason,
                    ChangedByUserName = h.ChangedByUser?.Username,
                    ChangedAt = h.ChangedAt
                }).ToList()
            };
        }
    }
}
