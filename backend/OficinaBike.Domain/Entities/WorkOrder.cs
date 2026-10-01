using System;
using System.Collections.Generic;
using System.Linq;
using OficinaBike.Domain.Enums;
using OficinaBike.Domain.Exceptions;

namespace OficinaBike.Domain.Entities
{
    public class WorkOrder : BaseEntity
    {
        public string Number { get; set; } = string.Empty; // e.g. "OS-000001"

        public int CustomerId { get; set; }
        public virtual Customer Customer { get; set; } = null!;

        public int BicycleId { get; set; }
        public virtual Bicycle Bicycle { get; set; } = null!;

        public DateTime OpeningDate { get; set; } = DateTime.UtcNow;
        public DateTime? ExpectedDate { get; set; }
        public DateTime? CompletionDate { get; set; }

        public WorkOrderStatus Status { get; set; } = WorkOrderStatus.Open;

        public string Description { get; set; } = string.Empty;
        public string? CustomerComplaint { get; set; }
        public string? TechnicalEvaluation { get; set; }
        public string? TechnicalNotes { get; set; }

        public decimal Discount { get; set; }
        public decimal AdditionalCharge { get; set; }

        public decimal Subtotal { get; set; }
        public decimal Total { get; set; }

        // Budget Approval Tracking
        public decimal? RequestedTotal { get; set; }
        public decimal? ApprovedTotal { get; set; }
        public WorkOrderApprovalStatus ApprovalStatus { get; set; } = WorkOrderApprovalStatus.Pending;
        public DateTime? ApprovalDate { get; set; }
        public int? ApprovedByUserId { get; set; }
        public virtual User? ApprovedByUser { get; set; }
        public string? ApprovalNotes { get; set; }

        public int? AssignedToUserId { get; set; }
        public virtual User? AssignedToUser { get; set; }

        public int? CreatedByUserFkId { get; set; }
        public virtual User? CreatedByUser { get; set; }

        public virtual ICollection<WorkOrderItem> Items { get; set; } = new List<WorkOrderItem>();
        public virtual ICollection<WorkOrderStatusHistory> StatusHistory { get; set; } = new List<WorkOrderStatusHistory>();

        public virtual Sale? Sale { get; set; }

        public void RecalculateTotals()
        {
            Subtotal = Items.Sum(i => i.Total);
            Total = Math.Max(0, Subtotal - Discount + AdditionalCharge);
        }

        public void ChangeStatus(WorkOrderStatus newStatus, int? changedByUserId, string? reason = null, bool isAdministrativeOverride = false)
        {
            if (Status == newStatus)
                return;

            var oldStatus = Status;
            Status = newStatus;
            UpdatedAt = DateTime.UtcNow;
            UpdatedByUserId = changedByUserId;

            if (newStatus == WorkOrderStatus.Ready || newStatus == WorkOrderStatus.Delivered)
            {
                CompletionDate ??= DateTime.UtcNow;
            }
            else
            {
                CompletionDate = null;
            }

            StatusHistory.Add(new WorkOrderStatusHistory
            {
                WorkOrderId = Id,
                PreviousStatus = oldStatus,
                NewStatus = newStatus,
                Reason = reason,
                ChangedByUserId = changedByUserId,
                ChangedAt = DateTime.UtcNow
            });
        }

        public static bool IsValidTransition(WorkOrderStatus current, WorkOrderStatus next)
        {
            return true;
        }
    }

    public class WorkOrderItem
    {
        public int Id { get; set; }

        public int WorkOrderId { get; set; }
        public virtual WorkOrder WorkOrder { get; set; } = null!;

        public ItemType ItemType { get; set; }

        public int? ProductId { get; set; }
        public virtual Product? Product { get; set; }

        public int? ServiceId { get; set; }
        public virtual Service? Service { get; set; }

        public string Description { get; set; } = string.Empty;

        public decimal Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal Discount { get; set; }
        public decimal Total { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public void CalculateTotal()
        {
            var subtotal = Quantity * UnitPrice;
            Total = Math.Max(0, subtotal - Discount);
        }
    }

    public class WorkOrderStatusHistory
    {
        public int Id { get; set; }

        public int WorkOrderId { get; set; }
        public virtual WorkOrder WorkOrder { get; set; } = null!;

        public WorkOrderStatus PreviousStatus { get; set; }
        public WorkOrderStatus NewStatus { get; set; }

        public string? Reason { get; set; }

        public int? ChangedByUserId { get; set; }
        public virtual User? ChangedByUser { get; set; }

        public DateTime ChangedAt { get; set; } = DateTime.UtcNow;
    }
}
