using System;
using FluentAssertions;
using OficinaBike.Domain.Entities;
using OficinaBike.Domain.Enums;
using OficinaBike.Domain.Exceptions;
using Xunit;

namespace OficinaBike.UnitTests
{
    public class WorkOrderDomainTests
    {
        [Fact]
        public void RecalculateTotals_ShouldCalculateSubtotalAndTotalAccurately()
        {
            // Arrange
            var workOrder = new WorkOrder
            {
                Discount = 20.00m,
                AdditionalCharge = 10.00m
            };

            var item1 = new WorkOrderItem
            {
                ItemType = ItemType.Service,
                Quantity = 1,
                UnitPrice = 150.00m,
                Discount = 10.00m
            };
            item1.CalculateTotal(); // 140.00

            var item2 = new WorkOrderItem
            {
                ItemType = ItemType.Product,
                Quantity = 2,
                UnitPrice = 40.00m,
                Discount = 5.00m
            };
            item2.CalculateTotal(); // (2 * 40) - 5 = 75.00

            workOrder.Items.Add(item1);
            workOrder.Items.Add(item2);

            // Act
            workOrder.RecalculateTotals();

            // Assert
            // Subtotal = 140.00 + 75.00 = 215.00
            // Total = 215.00 - 20.00 (discount) + 10.00 (additional) = 205.00
            workOrder.Subtotal.Should().Be(215.00m);
            workOrder.Total.Should().Be(205.00m);
        }

        [Fact]
        public void ChangeStatus_ValidFlow_ShouldTransitionThroughAllLifecycleStages()
        {
            // Arrange
            var workOrder = new WorkOrder { Status = WorkOrderStatus.Open };

            // Act & Assert
            // Open -> WaitingApproval
            workOrder.ChangeStatus(WorkOrderStatus.WaitingApproval, 1, "Aguardando aprovação do cliente");
            workOrder.Status.Should().Be(WorkOrderStatus.WaitingApproval);

            // WaitingApproval -> Approved
            workOrder.ChangeStatus(WorkOrderStatus.Approved, 1, "Cliente aprovou orçamento");
            workOrder.Status.Should().Be(WorkOrderStatus.Approved);

            // Approved -> InProgress
            workOrder.ChangeStatus(WorkOrderStatus.InProgress, 2, "Mecânico iniciou o serviço");
            workOrder.Status.Should().Be(WorkOrderStatus.InProgress);

            // InProgress -> WaitingParts
            workOrder.ChangeStatus(WorkOrderStatus.WaitingParts, 2, "Aguardando chegada de peças");
            workOrder.Status.Should().Be(WorkOrderStatus.WaitingParts);

            // WaitingParts -> InProgress
            workOrder.ChangeStatus(WorkOrderStatus.InProgress, 2, "Peça recebida, retomando");
            workOrder.Status.Should().Be(WorkOrderStatus.InProgress);

            // InProgress -> Ready
            workOrder.ChangeStatus(WorkOrderStatus.Ready, 2, "Bicicleta pronta para retirada");
            workOrder.Status.Should().Be(WorkOrderStatus.Ready);
            workOrder.CompletionDate.Should().NotBeNull();

            // Ready -> Delivered
            workOrder.ChangeStatus(WorkOrderStatus.Delivered, 1, "Cliente retirou a bicicleta");
            workOrder.Status.Should().Be(WorkOrderStatus.Delivered);

            workOrder.StatusHistory.Should().HaveCount(7);
        }

        [Fact]
        public void ChangeStatus_OpenToDelivered_ShouldSucceed()
        {
            // Arrange
            var workOrder = new WorkOrder { Status = WorkOrderStatus.Open };

            // Act
            workOrder.ChangeStatus(WorkOrderStatus.Delivered, 1);

            // Assert
            workOrder.Status.Should().Be(WorkOrderStatus.Delivered);
            workOrder.CompletionDate.Should().NotBeNull();
        }

        [Fact]
        public void ChangeStatus_DeliveredToInProgress_ShouldSucceed()
        {
            // Arrange
            var workOrder = new WorkOrder { Status = WorkOrderStatus.Delivered };

            // Act
            workOrder.ChangeStatus(WorkOrderStatus.InProgress, 1);

            // Assert
            workOrder.Status.Should().Be(WorkOrderStatus.InProgress);
            workOrder.CompletionDate.Should().BeNull();
        }

        [Fact]
        public void ChangeStatus_CancelledOrder_ShouldSucceed()
        {
            // Arrange
            var workOrder = new WorkOrder { Status = WorkOrderStatus.Cancelled };

            // Act
            workOrder.ChangeStatus(WorkOrderStatus.Approved, 1);

            // Assert
            workOrder.Status.Should().Be(WorkOrderStatus.Approved);
        }
    }
}
