using System;
using System.Collections.Generic;
using OficinaBike.Domain.Enums;

namespace OficinaBike.Application.DTOs
{
    public class WorkOrderResponse
    {
        public int Id { get; set; }
        public string Number { get; set; } = string.Empty;

        public int CustomerId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public string? CustomerPhone { get; set; }

        public int BicycleId { get; set; }
        public string BicycleSummary { get; set; } = string.Empty;
        public string BicycleBrand { get; set; } = string.Empty;
        public string BicycleModel { get; set; } = string.Empty;
        public string? BicycleSerialNumber { get; set; }

        public DateTime OpeningDate { get; set; }
        public DateTime? ExpectedDate { get; set; }
        public DateTime? CompletionDate { get; set; }

        public WorkOrderStatus Status { get; set; }
        public string StatusName => Status switch
        {
            WorkOrderStatus.Open => "Aberta",
            WorkOrderStatus.WaitingApproval => "Aguardando Aprovação",
            WorkOrderStatus.Approved => "Aprovada",
            WorkOrderStatus.InProgress => "Em Andamento",
            WorkOrderStatus.WaitingParts => "Aguardando Peças",
            WorkOrderStatus.Ready => "Pronta",
            WorkOrderStatus.Delivered => "Entregue",
            WorkOrderStatus.Cancelled => "Cancelada",
            _ => Status.ToString()
        };

        public string Description { get; set; } = string.Empty;
        public string? CustomerComplaint { get; set; }
        public string? TechnicalEvaluation { get; set; }
        public string? TechnicalNotes { get; set; }

        public decimal Discount { get; set; }
        public decimal AdditionalCharge { get; set; }
        public decimal Subtotal { get; set; }
        public decimal Total { get; set; }

        public decimal? RequestedTotal { get; set; }
        public decimal? ApprovedTotal { get; set; }
        public WorkOrderApprovalStatus ApprovalStatus { get; set; }
        public string ApprovalStatusName => ApprovalStatus.ToString();
        public DateTime? ApprovalDate { get; set; }
        public string? ApprovedByUserName { get; set; }
        public string? ApprovalNotes { get; set; }

        public int? AssignedToUserId { get; set; }
        public string? AssignedToUserName { get; set; }
        public string? CreatedByUserName { get; set; }

        public int? SaleId { get; set; }
        public string? SaleNumber { get; set; }

        public List<WorkOrderItemResponse> Items { get; set; } = new();
        public List<WorkOrderStatusHistoryResponse> StatusHistory { get; set; } = new();

        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class WorkOrderItemResponse
    {
        public int Id { get; set; }
        public int WorkOrderId { get; set; }
        public ItemType ItemType { get; set; }
        public string ItemTypeName => ItemType.ToString();
        public int? ProductId { get; set; }
        public string? ProductName { get; set; }
        public string? ProductSku { get; set; }
        public int? ServiceId { get; set; }
        public string? ServiceName { get; set; }
        public string Description { get; set; } = string.Empty;
        public decimal Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal Discount { get; set; }
        public decimal Total { get; set; }
    }

    public class WorkOrderStatusHistoryResponse
    {
        public int Id { get; set; }
        public WorkOrderStatus PreviousStatus { get; set; }
        public string PreviousStatusName => FormatStatus(PreviousStatus);
        public WorkOrderStatus NewStatus { get; set; }
        public string NewStatusName => FormatStatus(NewStatus);
        public string? Reason { get; set; }
        public string? ChangedByUserName { get; set; }
        public DateTime ChangedAt { get; set; }

        private static string FormatStatus(WorkOrderStatus status) => status switch
        {
            WorkOrderStatus.Open => "Aberta",
            WorkOrderStatus.WaitingApproval => "Aguardando Aprovação",
            WorkOrderStatus.Approved => "Aprovada",
            WorkOrderStatus.InProgress => "Em Andamento",
            WorkOrderStatus.WaitingParts => "Aguardando Peças",
            WorkOrderStatus.Ready => "Pronta",
            WorkOrderStatus.Delivered => "Entregue",
            WorkOrderStatus.Cancelled => "Cancelada",
            _ => status.ToString()
        };
    }

    public class CreateWorkOrderRequest
    {
        public int CustomerId { get; set; }
        public int BicycleId { get; set; }
        public DateTime? ExpectedDate { get; set; }
        public string Description { get; set; } = string.Empty;
        public string? CustomerComplaint { get; set; }
        public string? TechnicalEvaluation { get; set; }
        public string? TechnicalNotes { get; set; }
        public int? AssignedToUserId { get; set; }
        public decimal Discount { get; set; } = 0;
        public decimal AdditionalCharge { get; set; } = 0;
        public List<AddWorkOrderItemRequest>? Items { get; set; }
    }

    public class UpdateWorkOrderRequest
    {
        public DateTime? ExpectedDate { get; set; }
        public string Description { get; set; } = string.Empty;
        public string? CustomerComplaint { get; set; }
        public string? TechnicalEvaluation { get; set; }
        public string? TechnicalNotes { get; set; }
        public int? AssignedToUserId { get; set; }
        public decimal Discount { get; set; }
        public decimal AdditionalCharge { get; set; }
    }

    public class AddWorkOrderItemRequest
    {
        public ItemType ItemType { get; set; }
        public int? ProductId { get; set; }
        public int? ServiceId { get; set; }
        public string? Description { get; set; }
        public decimal Quantity { get; set; } = 1;
        public decimal? UnitPrice { get; set; } // If null, fetches from Product/Service catalog
        public decimal Discount { get; set; } = 0;
    }

    public class UpdateWorkOrderItemRequest
    {
        public decimal Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal Discount { get; set; }
        public string? Description { get; set; }
    }

    public class ChangeWorkOrderStatusRequest
    {
        public WorkOrderStatus Status { get; set; }
        public string? Reason { get; set; }
        public bool IsAdministrativeOverride { get; set; } = false;
    }

    public class ApproveWorkOrderRequest
    {
        public bool Approved { get; set; }
        public decimal? ApprovedTotal { get; set; }
        public string? ApprovalNotes { get; set; }
    }

    public class CancelWorkOrderRequest
    {
        public string Reason { get; set; } = string.Empty;
    }
}
