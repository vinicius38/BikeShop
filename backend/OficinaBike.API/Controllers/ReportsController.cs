using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OficinaBike.API.Authorization;
using OficinaBike.Application.Common;
using OficinaBike.Application.DTOs;
using OficinaBike.Application.Interfaces;
using OficinaBike.Domain.Enums;

namespace OficinaBike.API.Controllers
{
    [ApiController]
    [Route("api/reports")]
    [RequirePermission("Reports.View")]
    public class ReportsController : BaseApiController
    {
        private readonly IOficinaBikeDbContext _context;
        private readonly IDocumentCompanyInfoService _companyInfoService;

        public ReportsController(IOficinaBikeDbContext context, IDocumentCompanyInfoService companyInfoService)
        {
            _context = context;
            _companyInfoService = companyInfoService;
        }

        [HttpGet("sales")]
        [ProducesResponseType(200)]
        public async Task<IActionResult> GetSalesReport(
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            [FromQuery] int? customerId,
            [FromQuery] SaleStatus? status,
            CancellationToken cancellationToken)
        {
            var company = await _companyInfoService.GetCompanyHeaderAsync(false, cancellationToken);

            var query = _context.Sales
                .AsNoTracking()
                .Include(s => s.Customer)
                .Include(s => s.Payments)
                    .ThenInclude(p => p.PaymentMethod)
                .AsQueryable();

            if (startDate.HasValue)
                query = query.Where(s => s.SaleDate >= startDate.Value);

            if (endDate.HasValue)
                query = query.Where(s => s.SaleDate <= endDate.Value);

            if (customerId.HasValue)
                query = query.Where(s => s.CustomerId == customerId.Value);

            if (status.HasValue)
                query = query.Where(s => s.Status == status.Value);

            var sales = await query
                .OrderByDescending(s => s.SaleDate)
                .ToListAsync(cancellationToken);

            var totalAmount = sales.Sum(s => s.Total);
            var totalSubtotal = sales.Sum(s => s.Subtotal);
            var totalDiscount = sales.Sum(s => s.Discount);
            var count = sales.Count;
            var averageTicket = count > 0 ? totalAmount / count : 0;

            var reportData = new
            {
                Title = "Relatório Gerencial de Vendas",
                GeneratedAt = DateTime.UtcNow,
                Period = new { StartDate = startDate, EndDate = endDate },
                Summary = new
                {
                    TotalSales = count,
                    TotalSubtotal = totalSubtotal,
                    TotalDiscount = totalDiscount,
                    TotalAmount = totalAmount,
                    AverageTicket = averageTicket
                },
                Sales = sales.Select(s => new
                {
                    s.Id,
                    s.Number,
                    s.SaleDate,
                    Status = s.Status.ToString(),
                    CustomerName = s.Customer?.Name ?? string.Empty,
                    CustomerPhone = s.Customer?.CellPhone ?? s.Customer?.Phone,
                    s.Subtotal,
                    s.Discount,
                    s.Total,
                    PaymentMethods = string.Join(", ", s.Payments.Select(p => p.PaymentMethod?.Name).Where(n => !string.IsNullOrEmpty(n)))
                })
            };

            return Ok(new
            {
                company,
                report = reportData
            });
        }

        [HttpGet("stock")]
        [ProducesResponseType(200)]
        public async Task<IActionResult> GetStockReport(
            [FromQuery] int? categoryId,
            [FromQuery] int? supplierId,
            [FromQuery] bool? lowStockOnly,
            CancellationToken cancellationToken)
        {
            var company = await _companyInfoService.GetCompanyHeaderAsync(false, cancellationToken);

            var query = _context.Products
                .AsNoTracking()
                .Include(p => p.ProductCategory)
                .Include(p => p.Supplier)
                .AsQueryable();

            if (categoryId.HasValue)
                query = query.Where(p => p.ProductCategoryId == categoryId.Value);

            if (supplierId.HasValue)
                query = query.Where(p => p.SupplierId == supplierId.Value);

            if (lowStockOnly == true)
                query = query.Where(p => p.StockQuantity <= p.MinimumStock);

            var products = await query
                .OrderBy(p => p.Name)
                .ToListAsync(cancellationToken);

            var totalStockItems = products.Sum(p => p.StockQuantity);
            var totalCostValue = products.Sum(p => p.StockQuantity * p.CostPrice);
            var totalSaleValue = products.Sum(p => p.StockQuantity * p.SalePrice);
            var lowStockCount = products.Count(p => p.StockQuantity <= p.MinimumStock);

            var reportData = new
            {
                Title = "Relatório de Posição de Estoque e Inventário",
                GeneratedAt = DateTime.UtcNow,
                Filters = new { CategoryId = categoryId, SupplierId = supplierId, LowStockOnly = lowStockOnly },
                Summary = new
                {
                    TotalProducts = products.Count,
                    TotalStockItems = totalStockItems,
                    TotalCostValue = totalCostValue,
                    TotalSaleValue = totalSaleValue,
                    PotentialProfit = totalSaleValue - totalCostValue,
                    LowStockCount = lowStockCount
                },
                Products = products.Select(p => new
                {
                    p.Id,
                    p.Sku,
                    p.Barcode,
                    p.Name,
                    Category = p.ProductCategory?.Name,
                    Supplier = p.Supplier?.TradeName,
                    Unit = p.Unit.ToString(),
                    p.StockQuantity,
                    p.MinimumStock,
                    p.CostPrice,
                    p.SalePrice,
                    TotalCost = p.StockQuantity * p.CostPrice,
                    TotalSale = p.StockQuantity * p.SalePrice,
                    IsLowStock = p.StockQuantity <= p.MinimumStock
                })
            };

            return Ok(new
            {
                company,
                report = reportData
            });
        }

        [HttpGet("work-orders")]
        [ProducesResponseType(200)]
        public async Task<IActionResult> GetWorkOrdersReport(
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            [FromQuery] WorkOrderStatus? status,
            [FromQuery] int? technicianId,
            CancellationToken cancellationToken)
        {
            var company = await _companyInfoService.GetCompanyHeaderAsync(false, cancellationToken);

            var query = _context.WorkOrders
                .AsNoTracking()
                .Include(w => w.Customer)
                .Include(w => w.Bicycle)
                .Include(w => w.AssignedToUser)
                .AsQueryable();

            if (startDate.HasValue)
                query = query.Where(w => w.OpeningDate >= startDate.Value);

            if (endDate.HasValue)
                query = query.Where(w => w.OpeningDate <= endDate.Value);

            if (status.HasValue)
                query = query.Where(w => w.Status == status.Value);

            if (technicianId.HasValue)
                query = query.Where(w => w.AssignedToUserId == technicianId.Value);

            var orders = await query
                .OrderByDescending(w => w.OpeningDate)
                .ToListAsync(cancellationToken);

            var totalAmount = orders.Sum(w => w.Total);
            var completedCount = orders.Count(w => w.Status == WorkOrderStatus.Delivered);
            var inProgressCount = orders.Count(w => w.Status == WorkOrderStatus.InProgress);
            var openCount = orders.Count(w => w.Status == WorkOrderStatus.Open);
            var cancelledCount = orders.Count(w => w.Status == WorkOrderStatus.Cancelled);

            var reportData = new
            {
                Title = "Relatório de Ordens de Serviço",
                GeneratedAt = DateTime.UtcNow,
                Period = new { StartDate = startDate, EndDate = endDate },
                Summary = new
                {
                    TotalOrders = orders.Count,
                    OpenCount = openCount,
                    InProgressCount = inProgressCount,
                    CompletedCount = completedCount,
                    CancelledCount = cancelledCount,
                    TotalAmount = totalAmount
                },
                WorkOrders = orders.Select(w => new
                {
                    w.Id,
                    w.Number,
                    w.OpeningDate,
                    w.ExpectedDate,
                    w.CompletionDate,
                    Status = w.Status.ToString(),
                    CustomerName = w.Customer?.Name ?? string.Empty,
                    Bicycle = $"{w.Bicycle?.Brand} {w.Bicycle?.Model}",
                    Technician = w.AssignedToUser?.Name ?? w.AssignedToUser?.Username,
                    w.Description,
                    w.Subtotal,
                    w.Discount,
                    w.Total
                })
            };

            return Ok(new
            {
                company,
                report = reportData
            });
        }
        [HttpGet("financial")]
        [ProducesResponseType(200)]
        public async Task<IActionResult> GetFinancialReport(
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            [FromQuery] int? paymentMethodId,
            CancellationToken cancellationToken)
        {
            var company = await _companyInfoService.GetCompanyHeaderAsync(false, cancellationToken);
            var query = _context.SalePayments
                .Include(p => p.PaymentMethod)
                .Include(p => p.Sale).ThenInclude(s => s.Customer)
                .Include(p => p.Sale).ThenInclude(s => s.WorkOrder)
                .Include(p => p.Sale).ThenInclude(s => s.Payments)
                .AsQueryable();

            if (startDate.HasValue) query = query.Where(p => p.PaidAt >= startDate.Value);
            if (endDate.HasValue) query = query.Where(p => p.PaidAt <= endDate.Value);
            if (paymentMethodId.HasValue) query = query.Where(p => p.PaymentMethodId == paymentMethodId.Value);

            var payments = await query.OrderByDescending(p => p.PaidAt).ToListAsync(cancellationToken);
            
            var summaryByMethod = payments
                .GroupBy(p => p.PaymentMethod?.Name ?? "Desconhecido")
                .Select(g => new { Method = g.Key, TotalAmount = g.Sum(p => p.Amount) })
                .ToList();

            var reportData = new
            {
                Title = "Relatório Financeiro (Recebimentos)",
                GeneratedAt = DateTime.UtcNow,
                Period = new { StartDate = startDate, EndDate = endDate },
                Filters = new { PaymentMethodId = paymentMethodId },
                Summary = new
                {
                    TotalReceived = payments.Sum(p => p.Amount),
                    TotalTransactions = payments.Count,
                    ByMethod = summaryByMethod
                },
                Items = payments.Select(p => new
                {
                    p.Id,
                    Date = p.PaidAt,
                    Method = p.PaymentMethod?.Name ?? "N/A",
                    SaleNumber = p.Sale?.Number,
                    WorkOrderNumber = p.Sale?.WorkOrder?.Number,
                    CustomerName = p.Sale?.Customer?.Name ?? string.Empty,
                    Amount = p.Amount,
                    Change = p.Sale != null && p.Sale.Payments.OrderBy(x => x.Id).FirstOrDefault()?.Id == p.Id 
                        ? Math.Max(0, p.Sale.Payments.Sum(x => x.Amount) - p.Sale.Total) 
                        : 0
                })
            };

            return Ok(new { company, report = reportData });
        }

        [HttpGet("customers")]
        [ProducesResponseType(200)]
        public async Task<IActionResult> GetCustomersReport(
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            CancellationToken cancellationToken)
        {
            var company = await _companyInfoService.GetCompanyHeaderAsync(false, cancellationToken);
            var query = _context.Customers.AsNoTracking().AsQueryable();

            if (startDate.HasValue) query = query.Where(c => c.CreatedAt >= startDate.Value);
            if (endDate.HasValue) query = query.Where(c => c.CreatedAt <= endDate.Value);

            var customers = await query.OrderByDescending(c => c.CreatedAt).ToListAsync(cancellationToken);

            var reportData = new
            {
                Title = "Relatório de Clientes Cadastrados",
                GeneratedAt = DateTime.UtcNow,
                Period = new { StartDate = startDate, EndDate = endDate },
                Summary = new
                {
                    TotalCustomers = customers.Count
                },
                Items = customers.Select(c => new
                {
                    c.Id,
                    c.Name,
                    c.Email,
                    c.Phone,
                    c.CellPhone,
                    c.CreatedAt
                })
            };

            return Ok(new { company, report = reportData });
        }
    }
}
