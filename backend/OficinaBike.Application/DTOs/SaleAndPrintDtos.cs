using System;
using System.Collections.Generic;
using OficinaBike.Domain.Enums;

namespace OficinaBike.Application.DTOs
{
    public class SaleResponse
    {
        public int Id { get; set; }
        public string Number { get; set; } = string.Empty;

        public int CustomerId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public string? CustomerPhone { get; set; }

        public int? WorkOrderId { get; set; }
        public string? WorkOrderNumber { get; set; }

        public DateTime SaleDate { get; set; }

        public decimal Subtotal { get; set; }
        public decimal Discount { get; set; }
        public decimal AdditionalCharge { get; set; }
        public decimal Total { get; set; }

        public SaleStatus Status { get; set; }
        public string StatusName => Status switch
        {
            SaleStatus.Open => "Em Aberto",
            SaleStatus.Completed => "Concluída",
            SaleStatus.Cancelled => "Cancelada",
            _ => Status.ToString()
        };

        public string? CreatedByUserName { get; set; }
        public string? CancelledByUserName { get; set; }
        public DateTime? CancelledAt { get; set; }
        public string? CancellationReason { get; set; }

        public List<SaleItemResponse> Items { get; set; } = new();
        public List<SalePaymentResponse> Payments { get; set; } = new();

        public decimal TotalPaid { get; set; }
        public decimal RemainingBalance => Math.Max(0, Total - TotalPaid);

        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class SaleItemResponse
    {
        public int Id { get; set; }
        public int SaleId { get; set; }
        public ItemType ItemType { get; set; }
        public string ItemTypeName => ItemType.ToString();
        public int? ProductId { get; set; }
        public string? ProductSku { get; set; }
        public int? ServiceId { get; set; }
        public string Description { get; set; } = string.Empty;
        public decimal Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal Discount { get; set; }
        public decimal Total { get; set; }
    }

    public class SalePaymentResponse
    {
        public int Id { get; set; }
        public int PaymentMethodId { get; set; }
        public string PaymentMethodName { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public int Installments { get; set; }
        public string? TransactionCode { get; set; }
        public DateTime PaidAt { get; set; }
    }

    public class PaymentMethodResponse
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public bool IsActive { get; set; }
    }

    public class CreateSaleRequest
    {
        public int? CustomerId { get; set; }
        public decimal Discount { get; set; } = 0;
        public decimal AdditionalCharge { get; set; } = 0;
        public List<AddSaleItemRequest> Items { get; set; } = new();
        public List<AddPaymentRequest>? Payments { get; set; }
    }

    public class AddSaleItemRequest
    {
        public ItemType ItemType { get; set; }
        public int? ProductId { get; set; }
        public int? ServiceId { get; set; }
        public string? Description { get; set; }
        public decimal Quantity { get; set; } = 1;
        public decimal? UnitPrice { get; set; }
        public decimal Discount { get; set; } = 0;
    }

    public class AddPaymentRequest
    {
        public int PaymentMethodId { get; set; }
        public string? PaymentMethod { get; set; }
        public decimal Amount { get; set; }
        public int Installments { get; set; } = 1;
        public string? TransactionCode { get; set; }
    }

    public class ConvertWorkOrderToSaleRequest
    {
        public decimal? AdditionalDiscount { get; set; }
        public decimal? Discount { get; set; }
        public decimal? AdditionalCharge { get; set; }
        public List<AddPaymentRequest>? Payments { get; set; }
    }

    public class CancelSaleRequest
    {
        public string Reason { get; set; } = string.Empty;
    }

    public class DashboardMetricsDto
    {
        public int OpenWorkOrders { get; set; }
        public int WaitingApprovalWorkOrders { get; set; }
        public int InProgressWorkOrders { get; set; }
        public int WaitingPartsWorkOrders { get; set; }
        public int ReadyWorkOrders { get; set; }
        public int DeliveredWorkOrders { get; set; }
        public int TotalActiveWorkOrders { get; set; }

        public int SalesTodayCount { get; set; }
        public decimal SalesTodayAmount { get; set; }

        public int SalesThisMonthCount { get; set; }
        public decimal SalesThisMonthAmount { get; set; }

        public int LowStockProductsCount { get; set; }
        public List<LowStockProductSummaryDto> LowStockProducts { get; set; } = new();
    }

    public class LowStockProductSummaryDto
    {
        public int ProductId { get; set; }
        public string Sku { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public decimal CurrentStock { get; set; }
        public decimal MinimumStock { get; set; }
    }

    public class WorkOrderPrintDto
    {
        public string DocumentType => "ORDEM DE SERVIÇO";
        public DocumentCompanyHeader? Company { get; set; }
        public string WorkOrderNumber { get; set; } = string.Empty;
        public DateTime IssueDate { get; set; }
        public DateTime? ExpectedDate { get; set; }
        public string Status { get; set; } = string.Empty;

        // Customer Info
        public string CustomerName { get; set; } = string.Empty;
        public string? CustomerCpfCnpj { get; set; }
        public string? CustomerPhone { get; set; }
        public string? CustomerEmail { get; set; }
        public string? CustomerAddress { get; set; }

        // Bicycle Info
        public string BicycleBrand { get; set; } = string.Empty;
        public string BicycleModel { get; set; } = string.Empty;
        public string? BicycleColor { get; set; }
        public string? BicycleFrameSize { get; set; }
        public string? BicycleSerialNumber { get; set; }
        public string BikeType { get; set; } = string.Empty;

        // Problem & Technical Info
        public string Description { get; set; } = string.Empty;
        public string? CustomerComplaint { get; set; }
        public string? TechnicalEvaluation { get; set; }
        public string? TechnicalNotes { get; set; }

        public string? AssignedTechnician { get; set; }

        // Items
        public List<PrintItemDto> Services { get; set; } = new();
        public List<PrintItemDto> Products { get; set; } = new();

        // Totals
        public decimal SubtotalServices { get; set; }
        public decimal SubtotalProducts { get; set; }
        public decimal Subtotal { get; set; }
        public decimal Discount { get; set; }
        public decimal AdditionalCharge { get; set; }
        public decimal Total { get; set; }

        // Formatted previews for thermal receipts / text printers
        public string AsciiThermal58mm { get; set; } = string.Empty;
        public string AsciiThermal80mm { get; set; } = string.Empty;
    }

    public class SalePrintDto
    {
        public string DocumentType => "CUPOM DE VENDA / RECIBO";
        public DocumentCompanyHeader? Company { get; set; }
        public string SaleNumber { get; set; } = string.Empty;
        public string? WorkOrderNumber { get; set; }
        public DateTime SaleDate { get; set; }
        public string Status { get; set; } = string.Empty;

        // Customer Info
        public string CustomerName { get; set; } = string.Empty;
        public string? CustomerCpfCnpj { get; set; }
        public string? CustomerPhone { get; set; }

        public string? OperatorName { get; set; }

        // Items
        public List<PrintItemDto> Items { get; set; } = new();

        // Totals
        public decimal Subtotal { get; set; }
        public decimal Discount { get; set; }
        public decimal AdditionalCharge { get; set; }
        public decimal Total { get; set; }

        // Payments
        public List<SalePaymentResponse> Payments { get; set; } = new();
        public decimal TotalPaid { get; set; }
        public decimal ChangeDue { get; set; }

        // Formatted previews for thermal receipts / text printers
        public string AsciiThermal58mm { get; set; } = string.Empty;
        public string AsciiThermal80mm { get; set; } = string.Empty;
    }

    public class PrintItemDto
    {
        public string Code { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal Discount { get; set; }
        public decimal Total { get; set; }
    }
}
