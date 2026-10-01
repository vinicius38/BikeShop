using System;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Moq;
using OficinaBike.Application.DTOs;
using OficinaBike.Application.Interfaces;
using OficinaBike.Application.Services;
using OficinaBike.Domain.Entities;
using OficinaBike.Domain.Enums;
using OficinaBike.Domain.Exceptions;
using OficinaBike.Infrastructure.Persistence;
using Xunit;

namespace OficinaBike.UnitTests
{
    public class WorkOrderToSaleConversionServiceTests
    {
        private (OficinaBikeDbContext Context, Mock<ICurrentUserService> CurrentUserMock, Mock<IAuditService> AuditMock) CreateTestContext()
        {
            var options = new DbContextOptionsBuilder<OficinaBikeDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning))
                .Options;

            var currentUserMock = new Mock<ICurrentUserService>();
            currentUserMock.Setup(u => u.UserId).Returns(1);
            currentUserMock.Setup(u => u.Username).Returns("admin");

            var auditMock = new Mock<IAuditService>();

            var context = new OficinaBikeDbContext(options, currentUserMock.Object);
            return (context, currentUserMock, auditMock);
        }

        [Fact]
        public async Task ConvertToSale_ShouldSucceed_WhenStockIsAvailable()
        {
            // Arrange
            var (context, currentUserMock, auditMock) = CreateTestContext();
            var saleService = new SaleService(context, currentUserMock.Object, auditMock.Object);

            var customer = new Customer { Name = "Cliente Teste", IsActive = true };
            context.Customers.Add(customer);

            var category = new ProductCategory { Name = "Câmara", IsActive = true };
            context.ProductCategories.Add(category);

            var product = new Product
            {
                Sku = "CAM-29",
                Name = "Câmara 29",
                CostPrice = 15m,
                SalePrice = 30m,
                StockQuantity = 10m,
                MinimumStock = 2m,
                ProductCategory = category,
                IsActive = true
            };
            context.Products.Add(product);

            var bicycle = new Bicycle { Customer = customer, Brand = "Caloi", Model = "Elite" };
            context.Bicycles.Add(bicycle);

            var workOrder = new WorkOrder
            {
                Number = "OS-000001",
                Customer = customer,
                Bicycle = bicycle,
                Status = WorkOrderStatus.Ready,
                Description = "Revisão e troca de câmara"
            };

            var item = new WorkOrderItem
            {
                WorkOrder = workOrder,
                ItemType = ItemType.Product,
                Product = product,
                ProductId = product.Id,
                Description = product.Name,
                Quantity = 2m,
                UnitPrice = 30m,
                Discount = 0
            };
            item.CalculateTotal();
            workOrder.Items.Add(item);
            workOrder.RecalculateTotals();

            context.WorkOrders.Add(workOrder);
            await context.SaveChangesAsync();

            // Act: Convert OS (needing 2 units) to Sale
            var request = new ConvertWorkOrderToSaleRequest();
            var saleResponse = await saleService.ConvertToSaleAsync(workOrder.Id, request);

            // Assert
            saleResponse.Should().NotBeNull();
            saleResponse.Total.Should().Be(60m);
            saleResponse.WorkOrderId.Should().Be(workOrder.Id);

            // Inventory must have decreased from 10 to 8
            var productAfter = await context.Products.FindAsync(product.Id);
            productAfter!.StockQuantity.Should().Be(8m);

            // Stock movement must be recorded
            var movement = await context.StockMovements.FirstOrDefaultAsync(m => m.ProductId == product.Id);
            movement.Should().NotBeNull();
            movement!.Type.Should().Be(StockMovementType.WorkOrder);
            movement.Quantity.Should().Be(-2m);
            movement.PreviousStock.Should().Be(10m);
            movement.NewStock.Should().Be(8m);

            // OS status should now be Delivered
            var woAfter = await context.WorkOrders.FindAsync(workOrder.Id);
            woAfter!.Status.Should().Be(WorkOrderStatus.Delivered);
        }

        [Fact]
        public async Task ConvertToSale_ShouldThrowAndNotModifyStock_WhenStockIsInsufficient()
        {
            // Arrange
            var (context, currentUserMock, auditMock) = CreateTestContext();
            var saleService = new SaleService(context, currentUserMock.Object, auditMock.Object);

            var customer = new Customer { Name = "Cliente Teste", IsActive = true };
            context.Customers.Add(customer);

            var category = new ProductCategory { Name = "Pneu", IsActive = true };
            context.ProductCategories.Add(category);

            var product = new Product
            {
                Sku = "PNEU-29",
                Name = "Pneu 29 Maxxis",
                CostPrice = 100m,
                SalePrice = 200m,
                StockQuantity = 1m, // Only 1 in stock!
                MinimumStock = 2m,
                ProductCategory = category,
                IsActive = true
            };
            context.Products.Add(product);

            var bicycle = new Bicycle { Customer = customer, Brand = "Trek", Model = "Marlin" };
            context.Bicycles.Add(bicycle);

            var workOrder = new WorkOrder
            {
                Number = "OS-000002",
                Customer = customer,
                Bicycle = bicycle,
                Status = WorkOrderStatus.Ready,
                Description = "Troca de 2 pneus"
            };

            var item = new WorkOrderItem
            {
                WorkOrder = workOrder,
                ItemType = ItemType.Product,
                Product = product,
                ProductId = product.Id,
                Description = product.Name,
                Quantity = 2m, // Needs 2!
                UnitPrice = 200m,
                Discount = 0
            };
            item.CalculateTotal();
            workOrder.Items.Add(item);
            workOrder.RecalculateTotals();

            context.WorkOrders.Add(workOrder);
            await context.SaveChangesAsync();

            // Act
            Func<Task> act = async () => await saleService.ConvertToSaleAsync(workOrder.Id, new ConvertWorkOrderToSaleRequest());

            // Assert
            await act.Should().ThrowAsync<BusinessRuleException>()
                .WithMessage("*Estoque insuficiente*Operação cancelada sem alterações de estoque*");

            // Verify stock remained intact
            var productAfter = await context.Products.FindAsync(product.Id);
            productAfter!.StockQuantity.Should().Be(1m);

            // Verify no sale was created
            var salesCount = await context.Sales.CountAsync();
            salesCount.Should().Be(0);
        }

        [Fact]
        public async Task ConvertToSale_ShouldThrow_WhenWorkOrderIsAlreadyConverted()
        {
            // Arrange
            var (context, currentUserMock, auditMock) = CreateTestContext();
            var saleService = new SaleService(context, currentUserMock.Object, auditMock.Object);

            var customer = new Customer { Name = "Cliente Teste", IsActive = true };
            context.Customers.Add(customer);

            var bicycle = new Bicycle { Customer = customer, Brand = "Scott", Model = "Scale" };
            context.Bicycles.Add(bicycle);

            var workOrder = new WorkOrder
            {
                Number = "OS-000003",
                Customer = customer,
                Bicycle = bicycle,
                Status = WorkOrderStatus.Ready,
                Description = "Revisão"
            };

            var serviceItem = new Service { Name = "Revisão", CostPrice = 50m, SalePrice = 150m, IsActive = true };
            context.Services.Add(serviceItem);

            var item = new WorkOrderItem
            {
                WorkOrder = workOrder,
                ItemType = ItemType.Service,
                Service = serviceItem,
                ServiceId = serviceItem.Id,
                Description = serviceItem.Name,
                Quantity = 1m,
                UnitPrice = 150m,
                Discount = 0
            };
            item.CalculateTotal();
            workOrder.Items.Add(item);
            workOrder.RecalculateTotals();

            context.WorkOrders.Add(workOrder);
            await context.SaveChangesAsync();

            // Convert first time
            await saleService.ConvertToSaleAsync(workOrder.Id, new ConvertWorkOrderToSaleRequest());

            // Act: Attempt to convert a second time
            Func<Task> act = async () => await saleService.ConvertToSaleAsync(workOrder.Id, new ConvertWorkOrderToSaleRequest());

            // Assert
            await act.Should().ThrowAsync<BusinessRuleException>()
                .WithMessage("*já foi convertida*");
        }

        [Fact]
        public async Task CancelSale_ShouldRevertProductStockAndRecordMovement()
        {
            // Arrange
            var (context, currentUserMock, auditMock) = CreateTestContext();
            var saleService = new SaleService(context, currentUserMock.Object, auditMock.Object);

            var customer = new Customer { Name = "Cliente Teste", IsActive = true };
            context.Customers.Add(customer);

            var category = new ProductCategory { Name = "Lubrificante", IsActive = true };
            context.ProductCategories.Add(category);

            var product = new Product
            {
                Sku = "LUB-01",
                Name = "Lubrificante Cera",
                CostPrice = 20m,
                SalePrice = 50m,
                StockQuantity = 10m,
                ProductCategory = category,
                IsActive = true
            };
            context.Products.Add(product);
            await context.SaveChangesAsync();

            // Direct Sale of 3 units -> Stock drops to 7
            var createSaleReq = new CreateSaleRequest
            {
                CustomerId = customer.Id,
                Items = new System.Collections.Generic.List<AddSaleItemRequest>
                {
                    new AddSaleItemRequest
                    {
                        ItemType = ItemType.Product,
                        ProductId = product.Id,
                        Quantity = 3m
                    }
                }
            };

            var sale = await saleService.CreateAsync(createSaleReq);
            var productAfterSale = await context.Products.FindAsync(product.Id);
            productAfterSale!.StockQuantity.Should().Be(7m);

            // Act: Cancel the sale
            var cancelReq = new CancelSaleRequest { Reason = "Cliente desistiu da compra" };
            var cancelledSale = await saleService.CancelSaleAsync(sale.Id, cancelReq);

            // Assert
            cancelledSale.Status.Should().Be(SaleStatus.Cancelled);
            cancelledSale.CancellationReason.Should().Be("Cliente desistiu da compra");

            // Product stock must be restored to 10
            var productAfterCancel = await context.Products.FindAsync(product.Id);
            productAfterCancel!.StockQuantity.Should().Be(10m);

            // Stock movement of type Cancellation must exist
            var cancelMovement = await context.StockMovements
                .FirstOrDefaultAsync(m => m.ProductId == product.Id && m.Type == StockMovementType.Cancellation);
            cancelMovement.Should().NotBeNull();
            cancelMovement!.Quantity.Should().Be(3m);
            cancelMovement.PreviousStock.Should().Be(7m);
            cancelMovement.NewStock.Should().Be(10m);
        }
    }
}
