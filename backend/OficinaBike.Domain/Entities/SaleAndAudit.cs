using System;
using System.Collections.Generic;
using System.Linq;
using OficinaBike.Domain.Enums;
using OficinaBike.Domain.Exceptions;

namespace OficinaBike.Domain.Entities
{
    public class Sale : BaseEntity
    {
        public string Number { get; set; } = string.Empty; // e.g. "VENDA-000001"

        public int CustomerId { get; set; }
        public virtual Customer Customer { get; set; } = null!;

        public int? WorkOrderId { get; set; }
        public virtual WorkOrder? WorkOrder { get; set; }

        public DateTime SaleDate { get; set; } = DateTime.UtcNow;

        public decimal Subtotal { get; set; }
        public decimal Discount { get; set; }
        public decimal AdditionalCharge { get; set; }
        public decimal Total { get; set; }

        public SaleStatus Status { get; set; } = SaleStatus.Open;

        public virtual User? CreatedByUser { get; set; }

        public int? CancelledByUserId { get; set; }
        public virtual User? CancelledByUser { get; set; }
        public DateTime? CancelledAt { get; set; }
        public string? CancellationReason { get; set; }

        public virtual ICollection<SaleItem> Items { get; set; } = new List<SaleItem>();
        public virtual ICollection<SalePayment> Payments { get; set; } = new List<SalePayment>();

        public void RecalculateTotals()
        {
            Subtotal = Items.Sum(i => i.Total);
            Total = Math.Max(0, Subtotal - Discount + AdditionalCharge);
        }

        public void CompleteSale()
        {
            if (Status == SaleStatus.Completed)
                throw new BusinessRuleException("A venda já está finalizada.");

            if (Status == SaleStatus.Cancelled)
                throw new BusinessRuleException("Uma venda cancelada não pode ser finalizada.");

            if (!Items.Any())
                throw new BusinessRuleException("A venda deve conter pelo menos um item.");

            var paidAmount = Payments.Sum(p => p.Amount);
            if (Math.Round(paidAmount, 2) < Math.Round(Total, 2))
            {
                throw new BusinessRuleException($"O valor total dos pagamentos (R$ {paidAmount:N2}) deve ser exatamente igual ao total da venda (R$ {Total:N2}).");
            }

            Status = SaleStatus.Completed;
            UpdatedAt = DateTime.UtcNow;
        }

        public void CancelSale(int cancelledByUserId, string reason)
        {
            if (Status == SaleStatus.Cancelled)
                throw new BusinessRuleException("A venda já está cancelada.");

            if (string.IsNullOrWhiteSpace(reason))
                throw new BusinessRuleException("O motivo do cancelamento é obrigatório.");

            Status = SaleStatus.Cancelled;
            CancelledByUserId = cancelledByUserId;
            CancelledAt = DateTime.UtcNow;
            CancellationReason = reason;
            UpdatedAt = DateTime.UtcNow;
            UpdatedByUserId = cancelledByUserId;
        }
    }

    public class SaleItem
    {
        public int Id { get; set; }

        public int SaleId { get; set; }
        public virtual Sale Sale { get; set; } = null!;

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

    public class PaymentMethod
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty; // Dinheiro, Pix, Cartão de Débito, etc.
        public string Code { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public virtual ICollection<SalePayment> SalePayments { get; set; } = new List<SalePayment>();
    }

    public class SalePayment
    {
        public int Id { get; set; }

        public int SaleId { get; set; }
        public virtual Sale Sale { get; set; } = null!;

        public int PaymentMethodId { get; set; }
        public virtual PaymentMethod PaymentMethod { get; set; } = null!;

        public decimal Amount { get; set; }
        public int Installments { get; set; } = 1;
        public string? TransactionCode { get; set; }
        public DateTime PaidAt { get; set; } = DateTime.UtcNow;
    }

    public class AuditLog
    {
        public int Id { get; set; }

        public int? UserId { get; set; }
        public virtual User? User { get; set; }

        public string EntityName { get; set; } = string.Empty;
        public string EntityId { get; set; } = string.Empty;

        public string Action { get; set; } = string.Empty; // "Create", "Update", "Delete", "ChangeStatus", "ConvertToSale", "Cancel", "StockAdjustment", "Login"

        public string? OldValues { get; set; }
        public string? NewValues { get; set; }

        public string? IpAddress { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
