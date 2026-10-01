using System;
using FluentAssertions;
using OficinaBike.Domain.Entities;
using OficinaBike.Domain.Enums;
using OficinaBike.Domain.Exceptions;
using Xunit;

namespace OficinaBike.UnitTests
{
    public class SaleDomainTests
    {
        [Fact]
        public void CompleteSale_ShouldSucceed_WhenPaymentsMatchTotalExactly()
        {
            // Arrange
            var sale = new Sale { Status = SaleStatus.Open };

            var item = new SaleItem
            {
                ItemType = ItemType.Product,
                Quantity = 2,
                UnitPrice = 100.00m,
                Discount = 0
            };
            item.CalculateTotal(); // 200.00
            sale.Items.Add(item);
            sale.RecalculateTotals(); // Total = 200.00

            // Multiple payments: Pix R$ 120,00 + Dinheiro R$ 80,00 = R$ 200,00
            sale.Payments.Add(new SalePayment { PaymentMethodId = 1, Amount = 120.00m });
            sale.Payments.Add(new SalePayment { PaymentMethodId = 2, Amount = 80.00m });

            // Act
            sale.CompleteSale();

            // Assert
            sale.Status.Should().Be(SaleStatus.Completed);
        }

        [Fact]
        public void CompleteSale_ShouldThrow_WhenPaymentsAreLowerThanTotal()
        {
            // Arrange
            var sale = new Sale { Status = SaleStatus.Open };

            var item = new SaleItem
            {
                ItemType = ItemType.Service,
                Quantity = 1,
                UnitPrice = 300.00m,
                Discount = 0
            };
            item.CalculateTotal();
            sale.Items.Add(item);
            sale.RecalculateTotals();

            // Paid 250, but total is 300
            sale.Payments.Add(new SalePayment { PaymentMethodId = 1, Amount = 250.00m });

            // Act
            Action act = () => sale.CompleteSale();

            // Assert
            act.Should().Throw<BusinessRuleException>()
               .WithMessage("*deve ser exatamente igual ao total da venda*");
        }

        [Fact]
        public void CompleteSale_ShouldThrow_WhenNoItemsExist()
        {
            // Arrange
            var sale = new Sale { Status = SaleStatus.Open };

            // Act
            Action act = () => sale.CompleteSale();

            // Assert
            act.Should().Throw<BusinessRuleException>()
               .WithMessage("*deve conter pelo menos um item*");
        }

        [Fact]
        public void CancelSale_ShouldUpdateStatusAndStoreReasonAndUser()
        {
            // Arrange
            var sale = new Sale { Status = SaleStatus.Completed };

            // Act
            sale.CancelSale(cancelledByUserId: 42, reason: "Desistência do cliente antes da entrega");

            // Assert
            sale.Status.Should().Be(SaleStatus.Cancelled);
            sale.CancelledByUserId.Should().Be(42);
            sale.CancellationReason.Should().Be("Desistência do cliente antes da entrega");
            sale.CancelledAt.Should().NotBeNull();
        }

        [Fact]
        public void CancelSale_ShouldThrow_WhenReasonIsEmpty()
        {
            // Arrange
            var sale = new Sale { Status = SaleStatus.Completed };

            // Act
            Action act = () => sale.CancelSale(cancelledByUserId: 42, reason: "");

            // Assert
            act.Should().Throw<BusinessRuleException>()
               .WithMessage("*motivo do cancelamento é obrigatório*");
        }
    }
}
