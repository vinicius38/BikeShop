using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
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
    public class PrintService : IPrintService
    {
        private readonly IOficinaBikeDbContext _context;
        private readonly IDocumentCompanyInfoService _companyInfoService;

        public PrintService(IOficinaBikeDbContext context, IDocumentCompanyInfoService companyInfoService)
        {
            _context = context;
            _companyInfoService = companyInfoService;
        }

        public async Task<WorkOrderPrintDto> GetWorkOrderPrintDataAsync(int workOrderId, CancellationToken cancellationToken = default)
        {
            var w = await _context.WorkOrders
                .AsNoTracking()
                .Include(w => w.Customer)
                    .ThenInclude(c => c.Address)
                .Include(w => w.Bicycle)
                .Include(w => w.AssignedToUser)
                .Include(w => w.CreatedByUser)
                .Include(w => w.Items)
                    .ThenInclude(i => i.Product)
                .Include(w => w.Items)
                    .ThenInclude(i => i.Service)
                .FirstOrDefaultAsync(w => w.Id == workOrderId, cancellationToken);

            if (w == null)
                throw new NotFoundException("Ordem de Serviço", workOrderId);

            var services = w.Items
                .Where(i => i.ItemType == ItemType.Service)
                .Select(i => new PrintItemDto
                {
                    Code = $"SRV-{i.ServiceId}",
                    Description = i.Description,
                    Quantity = i.Quantity,
                    UnitPrice = i.UnitPrice,
                    Discount = i.Discount,
                    Total = i.Total
                }).ToList();

            var products = w.Items
                .Where(i => i.ItemType == ItemType.Product)
                .Select(i => new PrintItemDto
                {
                    Code = i.Product?.Sku ?? $"PRD-{i.ProductId}",
                    Description = i.Description,
                    Quantity = i.Quantity,
                    UnitPrice = i.UnitPrice,
                    Discount = i.Discount,
                    Total = i.Total
                }).ToList();

            var subtotalServices = services.Sum(s => s.Total);
            var subtotalProducts = products.Sum(p => p.Total);

            var addressStr = w.Customer?.Address != null
                ? $"{w.Customer.Address.Street}, {w.Customer.Address.Number} - {w.Customer.Address.Neighborhood}, {w.Customer.Address.City}/{w.Customer.Address.State} - CEP {w.Customer.Address.ZipCode}"
                : null;

            var companyHeader = await _companyInfoService.GetCompanyHeaderAsync(false, cancellationToken);

            var result = new WorkOrderPrintDto
            {
                Company = companyHeader,
                WorkOrderNumber = w.Number,
                IssueDate = w.OpeningDate,
                ExpectedDate = w.ExpectedDate,
                Status = w.Status switch
                {
                    WorkOrderStatus.Open => "Aberta",
                    WorkOrderStatus.WaitingApproval => "Aguardando Aprovação",
                    WorkOrderStatus.Approved => "Aprovada",
                    WorkOrderStatus.InProgress => "Em Andamento",
                    WorkOrderStatus.WaitingParts => "Aguardando Peças",
                    WorkOrderStatus.Ready => "Pronta",
                    WorkOrderStatus.Delivered => "Entregue",
                    WorkOrderStatus.Cancelled => "Cancelada",
                    _ => w.Status.ToString()
                },
                CustomerName = w.Customer?.Name ?? string.Empty,
                CustomerCpfCnpj = w.Customer?.CpfCnpj,
                CustomerPhone = w.Customer?.CellPhone ?? w.Customer?.Phone,
                CustomerEmail = w.Customer?.Email,
                CustomerAddress = addressStr,
                BicycleBrand = w.Bicycle?.Brand ?? string.Empty,
                BicycleModel = w.Bicycle?.Model ?? string.Empty,
                BicycleColor = w.Bicycle?.Color,
                BicycleFrameSize = w.Bicycle?.FrameSize,
                BicycleSerialNumber = w.Bicycle?.SerialNumber,
                BikeType = w.Bicycle?.BikeType.ToString() ?? string.Empty,
                Description = w.Description,
                CustomerComplaint = w.CustomerComplaint,
                TechnicalEvaluation = w.TechnicalEvaluation,
                TechnicalNotes = w.TechnicalNotes,
                AssignedTechnician = w.AssignedToUser?.Name ?? w.AssignedToUser?.Username,
                Services = services,
                Products = products,
                SubtotalServices = subtotalServices,
                SubtotalProducts = subtotalProducts,
                Subtotal = w.Subtotal,
                Discount = w.Discount,
                AdditionalCharge = w.AdditionalCharge,
                Total = w.Total
            };

            result.AsciiThermal58mm = GenerateThermalReceipt(result, 32);
            result.AsciiThermal80mm = GenerateThermalReceipt(result, 48);

            return result;
        }

        public async Task<SalePrintDto> GetSalePrintDataAsync(int saleId, CancellationToken cancellationToken = default)
        {
            var s = await _context.Sales
                .AsNoTracking()
                .Include(s => s.Customer)
                .Include(s => s.WorkOrder)
                .Include(s => s.CreatedByUser)
                .Include(s => s.Items)
                    .ThenInclude(i => i.Product)
                .Include(s => s.Payments)
                    .ThenInclude(p => p.PaymentMethod)
                .FirstOrDefaultAsync(s => s.Id == saleId, cancellationToken);

            if (s == null)
                throw new NotFoundException("Venda", saleId);

            var items = s.Items.Select(i => new PrintItemDto
            {
                Code = i.ItemType == ItemType.Product ? (i.Product?.Sku ?? $"P-{i.ProductId}") : $"S-{i.ServiceId}",
                Description = i.Description,
                Quantity = i.Quantity,
                UnitPrice = i.UnitPrice,
                Discount = i.Discount,
                Total = i.Total
            }).ToList();

            var payments = s.Payments.Select(p => new SalePaymentResponse
            {
                Id = p.Id,
                PaymentMethodId = p.PaymentMethodId,
                PaymentMethodName = p.PaymentMethod?.Name ?? string.Empty,
                Amount = p.Amount,
                Installments = p.Installments,
                TransactionCode = p.TransactionCode,
                PaidAt = p.PaidAt
            }).ToList();

            var totalPaid = payments.Sum(p => p.Amount);
            var change = Math.Max(0, totalPaid - s.Total);

            var companyHeader = await _companyInfoService.GetCompanyHeaderAsync(false, cancellationToken);

            var result = new SalePrintDto
            {
                Company = companyHeader,
                SaleNumber = s.Number,
                WorkOrderNumber = s.WorkOrder?.Number,
                SaleDate = s.SaleDate,
                Status = s.Status.ToString(),
                CustomerName = s.Customer?.Name ?? string.Empty,
                CustomerCpfCnpj = s.Customer?.CpfCnpj,
                CustomerPhone = s.Customer?.CellPhone ?? s.Customer?.Phone,
                OperatorName = s.CreatedByUser?.Name ?? s.CreatedByUser?.Username,
                Items = items,
                Subtotal = s.Subtotal,
                Discount = s.Discount,
                AdditionalCharge = s.AdditionalCharge,
                Total = s.Total,
                Payments = payments,
                TotalPaid = totalPaid,
                ChangeDue = change
            };

            result.AsciiThermal58mm = GenerateSaleThermalReceipt(result, 32);
            result.AsciiThermal80mm = GenerateSaleThermalReceipt(result, 48);

            return result;
        }

        private static string GenerateThermalReceipt(WorkOrderPrintDto wo, int cols)
        {
            var sb = new StringBuilder();
            var line = new string('=', cols);
            var dash = new string('-', cols);

            var companyName = !string.IsNullOrWhiteSpace(wo.Company?.TradeName) ? wo.Company.TradeName : (wo.Company?.Name ?? "OFICINA BIKE PRO");
            sb.AppendLine(Center(companyName.ToUpperInvariant(), cols));
            if (!string.IsNullOrWhiteSpace(wo.Company?.CorporateName) && wo.Company.CorporateName != companyName)
                sb.AppendLine(Center(wo.Company.CorporateName, cols));
            if (!string.IsNullOrWhiteSpace(wo.Company?.FormattedCpfCnpj))
                sb.AppendLine(Center($"CNPJ: {wo.Company.FormattedCpfCnpj}", cols));
            if (!string.IsNullOrWhiteSpace(wo.Company?.Address?.FormattedAddressLine))
                sb.AppendLine(Center(wo.Company.Address.FormattedAddressLine, cols));
            if (!string.IsNullOrWhiteSpace(wo.Company?.FormattedPhone))
                sb.AppendLine(Center($"Tel: {wo.Company.FormattedPhone}", cols));

            sb.AppendLine(Center("ORDEM DE SERVIÇO", cols));
            sb.AppendLine(line);
            sb.AppendLine($"OS: {wo.WorkOrderNumber}");
            sb.AppendLine($"Data: {wo.IssueDate:dd/MM/yyyy HH:mm}");
            sb.AppendLine($"Status: {wo.Status}");
            sb.AppendLine(dash);
            sb.AppendLine($"Cliente: {wo.CustomerName}");
            if (!string.IsNullOrEmpty(wo.CustomerPhone)) sb.AppendLine($"Tel: {wo.CustomerPhone}");
            sb.AppendLine(dash);
            sb.AppendLine($"Bicicleta: {wo.BicycleBrand} {wo.BicycleModel}");
            if (!string.IsNullOrEmpty(wo.BicycleSerialNumber)) sb.AppendLine($"Nº Quadro: {wo.BicycleSerialNumber}");
            sb.AppendLine(dash);
            sb.AppendLine("ITENS / SERVICOS:");
            foreach (var item in wo.Services.Concat(wo.Products))
            {
                sb.AppendLine($"{item.Quantity:N0}x {item.Description}");
                sb.AppendLine(PadRightLeft($"  R$ {item.UnitPrice:N2}", $"R$ {item.Total:N2}", cols));
            }
            sb.AppendLine(dash);
            sb.AppendLine(PadRightLeft("Subtotal:", $"R$ {wo.Subtotal:N2}", cols));
            if (wo.Discount > 0) sb.AppendLine(PadRightLeft("Desconto:", $"-R$ {wo.Discount:N2}", cols));
            if (wo.AdditionalCharge > 0) sb.AppendLine(PadRightLeft("Acrescimo:", $"+R$ {wo.AdditionalCharge:N2}", cols));
            sb.AppendLine(PadRightLeft("TOTAL GERAL:", $"R$ {wo.Total:N2}", cols));
            sb.AppendLine(line);
            if (!string.IsNullOrWhiteSpace(wo.Company?.FooterMessage))
            {
                sb.AppendLine(Center(wo.Company.FooterMessage, cols));
                sb.AppendLine(dash);
            }
            sb.AppendLine(Center("Assinatura do Cliente", cols));
            sb.AppendLine();
            sb.AppendLine(Center("___________________________", cols));
            return sb.ToString();
        }

        private static string GenerateSaleThermalReceipt(SalePrintDto s, int cols)
        {
            var sb = new StringBuilder();
            var line = new string('=', cols);
            var dash = new string('-', cols);

            var companyName = !string.IsNullOrWhiteSpace(s.Company?.TradeName) ? s.Company.TradeName : (s.Company?.Name ?? "OFICINA BIKE PRO");
            sb.AppendLine(Center(companyName.ToUpperInvariant(), cols));
            if (!string.IsNullOrWhiteSpace(s.Company?.CorporateName) && s.Company.CorporateName != companyName)
                sb.AppendLine(Center(s.Company.CorporateName, cols));
            if (!string.IsNullOrWhiteSpace(s.Company?.FormattedCpfCnpj))
                sb.AppendLine(Center($"CNPJ: {s.Company.FormattedCpfCnpj}", cols));
            if (!string.IsNullOrWhiteSpace(s.Company?.Address?.FormattedAddressLine))
                sb.AppendLine(Center(s.Company.Address.FormattedAddressLine, cols));
            if (!string.IsNullOrWhiteSpace(s.Company?.FormattedPhone))
                sb.AppendLine(Center($"Tel: {s.Company.FormattedPhone}", cols));

            sb.AppendLine(Center("CUPOM NÃO FISCAL", cols));
            sb.AppendLine(line);
            sb.AppendLine($"Venda: {s.SaleNumber}");
            if (!string.IsNullOrEmpty(s.WorkOrderNumber)) sb.AppendLine($"Ref. OS: {s.WorkOrderNumber}");
            sb.AppendLine($"Data: {s.SaleDate:dd/MM/yyyy HH:mm}");
            sb.AppendLine($"Cliente: {s.CustomerName}");
            sb.AppendLine(dash);
            sb.AppendLine("ITENS:");
            foreach (var item in s.Items)
            {
                sb.AppendLine($"{item.Quantity:N0}x {item.Description}");
                sb.AppendLine(PadRightLeft($"  R$ {item.UnitPrice:N2}", $"R$ {item.Total:N2}", cols));
            }
            sb.AppendLine(dash);
            sb.AppendLine(PadRightLeft("Subtotal:", $"R$ {s.Subtotal:N2}", cols));
            if (s.Discount > 0) sb.AppendLine(PadRightLeft("Desconto:", $"-R$ {s.Discount:N2}", cols));
            sb.AppendLine(PadRightLeft("TOTAL:", $"R$ {s.Total:N2}", cols));
            sb.AppendLine(dash);
            sb.AppendLine("FORMA DE PAGAMENTO:");
            foreach (var p in s.Payments)
            {
                sb.AppendLine(PadRightLeft($"{p.PaymentMethodName}:", $"R$ {p.Amount:N2}", cols));
            }
            sb.AppendLine(line);
            var footerMsg = !string.IsNullOrWhiteSpace(s.Company?.FooterMessage) ? s.Company.FooterMessage : "Obrigado pela preferência!";
            sb.AppendLine(Center(footerMsg, cols));
            return sb.ToString();
        }

        private static string Center(string text, int width)
        {
            if (text.Length >= width) return text;
            var pad = (width - text.Length) / 2;
            return text.PadLeft(pad + text.Length).PadRight(width);
        }

        private static string PadRightLeft(string left, string right, int width)
        {
            var spaces = width - left.Length - right.Length;
            if (spaces < 1) spaces = 1;
            return left + new string(' ', spaces) + right;
        }
    }

    public class DashboardService : IDashboardService
    {
        private readonly IOficinaBikeDbContext _context;

        public DashboardService(IOficinaBikeDbContext context)
        {
            _context = context;
        }

        public async Task<DashboardMetricsDto> GetDashboardMetricsAsync(CancellationToken cancellationToken = default)
        {
            var now = DateTime.UtcNow;
            var today = DateTime.SpecifyKind(now.Date, DateTimeKind.Utc);
            var firstDayOfMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);

            // Work Order Metrics by Status
            var openCount = await _context.WorkOrders.CountAsync(w => w.Status == WorkOrderStatus.Open, cancellationToken);
            var waitingApprovalCount = await _context.WorkOrders.CountAsync(w => w.Status == WorkOrderStatus.WaitingApproval, cancellationToken);
            var inProgressCount = await _context.WorkOrders.CountAsync(w => w.Status == WorkOrderStatus.InProgress, cancellationToken);
            var waitingPartsCount = await _context.WorkOrders.CountAsync(w => w.Status == WorkOrderStatus.WaitingParts, cancellationToken);
            var readyCount = await _context.WorkOrders.CountAsync(w => w.Status == WorkOrderStatus.Ready, cancellationToken);
            var deliveredCount = await _context.WorkOrders.CountAsync(w => w.Status == WorkOrderStatus.Delivered, cancellationToken);

            var totalActiveWorkOrders = openCount + waitingApprovalCount + inProgressCount + waitingPartsCount + readyCount;

            // Sales Metrics
            var salesToday = await _context.Sales
                .Where(s => s.Status == SaleStatus.Completed && s.SaleDate >= today)
                .ToListAsync(cancellationToken);

            var salesThisMonth = await _context.Sales
                .Where(s => s.Status == SaleStatus.Completed && s.SaleDate >= firstDayOfMonth)
                .ToListAsync(cancellationToken);

            // Low Stock Products
            var lowStockProducts = await _context.Products
                .AsNoTracking()
                .Where(p => p.IsActive && p.StockQuantity <= p.MinimumStock)
                .OrderBy(p => p.Name)
                .Take(10)
                .Select(p => new LowStockProductSummaryDto
                {
                    ProductId = p.Id,
                    Sku = p.Sku,
                    Name = p.Name,
                    CurrentStock = p.StockQuantity,
                    MinimumStock = p.MinimumStock
                })
                .ToListAsync(cancellationToken);

            var lowStockTotalCount = await _context.Products
                .CountAsync(p => p.IsActive && p.StockQuantity <= p.MinimumStock, cancellationToken);

            return new DashboardMetricsDto
            {
                OpenWorkOrders = openCount,
                WaitingApprovalWorkOrders = waitingApprovalCount,
                InProgressWorkOrders = inProgressCount,
                WaitingPartsWorkOrders = waitingPartsCount,
                ReadyWorkOrders = readyCount,
                DeliveredWorkOrders = deliveredCount,
                TotalActiveWorkOrders = totalActiveWorkOrders,
                SalesTodayCount = salesToday.Count,
                SalesTodayAmount = salesToday.Sum(s => s.Total),
                SalesThisMonthCount = salesThisMonth.Count,
                SalesThisMonthAmount = salesThisMonth.Sum(s => s.Total),
                LowStockProductsCount = lowStockTotalCount,
                LowStockProducts = lowStockProducts
            };
        }
    }

    public class AuditService : IAuditService
    {
        private readonly IOficinaBikeDbContext _context;
        private readonly ICurrentUserService _currentUserService;

        public AuditService(IOficinaBikeDbContext context, ICurrentUserService currentUserService)
        {
            _context = context;
            _currentUserService = currentUserService;
        }

        public async Task LogAsync(
            string entityName,
            string entityId,
            string action,
            object? oldValues = null,
            object? newValues = null,
            CancellationToken cancellationToken = default)
        {
            try
            {
                var auditLog = new AuditLog
                {
                    UserId = _currentUserService.UserId,
                    EntityName = entityName,
                    EntityId = entityId,
                    Action = action,
                    OldValues = oldValues != null ? JsonSerializer.Serialize(oldValues) : null,
                    NewValues = newValues != null ? JsonSerializer.Serialize(newValues) : null,
                    IpAddress = _currentUserService.IpAddress,
                    CreatedAt = DateTime.UtcNow
                };

                _context.AuditLogs.Add(auditLog);
                await _context.SaveChangesAsync(cancellationToken);
            }
            catch
            {
                // Silent fail to never crash primary transactions because of telemetry/audit logs
            }
        }

        public async Task<PagedResult<AuditLogDto>> GetLogsAsync(
            PagedRequest request,
            string? entityName = null,
            string? entityId = null,
            CancellationToken cancellationToken = default)
        {
            var query = _context.AuditLogs
                .AsNoTracking()
                .Include(a => a.User)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(entityName))
                query = query.Where(a => a.EntityName.ToLower() == entityName.ToLower());

            if (!string.IsNullOrWhiteSpace(entityId))
                query = query.Where(a => a.EntityId == entityId);

            if (!string.IsNullOrWhiteSpace(request.Search))
            {
                var term = request.Search.Trim().ToLower();
                query = query.Where(a => a.Action.ToLower().Contains(term) ||
                                         a.EntityName.ToLower().Contains(term) ||
                                         (a.User != null && a.User.Username.ToLower().Contains(term)));
            }

            var totalItems = await query.CountAsync(cancellationToken);
            var page = Math.Max(1, request.Page);
            var pageSize = Math.Clamp(request.PageSize, 1, 100);

            var logs = await query
                .OrderByDescending(a => a.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(cancellationToken);

            var dtos = logs.Select(a => new AuditLogDto
            {
                Id = a.Id,
                UserId = a.UserId,
                UserName = a.User?.Username,
                EntityName = a.EntityName,
                EntityId = a.EntityId,
                Action = a.Action,
                OldValues = a.OldValues,
                NewValues = a.NewValues,
                IpAddress = a.IpAddress,
                CreatedAt = a.CreatedAt
            }).ToList();

            return new PagedResult<AuditLogDto>(dtos, totalItems, page, pageSize);
        }
    }
}
