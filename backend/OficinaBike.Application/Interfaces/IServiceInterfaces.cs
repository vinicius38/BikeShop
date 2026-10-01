using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using OficinaBike.Application.Common;
using OficinaBike.Application.DTOs;
using OficinaBike.Domain.Enums;

namespace OficinaBike.Application.Interfaces
{
    public interface IAuthService
    {
        Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default);
        Task<AuthResponse> RefreshTokenAsync(RefreshTokenRequest request, CancellationToken cancellationToken = default);
        Task ChangePasswordAsync(ChangePasswordRequest request, CancellationToken cancellationToken = default);
        Task<UserResponse> GetCurrentUserAsync(CancellationToken cancellationToken = default);
    }

    public interface IUserService
    {
        Task<PagedResult<UserResponse>> GetUsersAsync(PagedRequest request, CancellationToken cancellationToken = default);
        Task<UserResponse> GetByIdAsync(int id, CancellationToken cancellationToken = default);
        Task<UserResponse> CreateAsync(CreateUserRequest request, CancellationToken cancellationToken = default);
        Task<UserResponse> UpdateAsync(int id, UpdateUserRequest request, CancellationToken cancellationToken = default);
        Task SetActiveStatusAsync(int id, bool isActive, CancellationToken cancellationToken = default);
        Task<List<RoleResponse>> GetRolesAsync(CancellationToken cancellationToken = default);
        Task<RoleResponse> UpdateRolePermissionsAsync(int id, UpdateRolePermissionsRequest request, CancellationToken cancellationToken = default);
        Task<List<PermissionResponse>> GetPermissionsAsync(CancellationToken cancellationToken = default);
    }

    public interface ICustomerService
    {
        Task<PagedResult<CustomerResponse>> GetCustomersAsync(PagedRequest request, string? phone = null, string? cpfCnpj = null, CancellationToken cancellationToken = default);
        Task<CustomerResponse> GetByIdAsync(int id, CancellationToken cancellationToken = default);
        Task<CustomerResponse> CreateAsync(CreateCustomerRequest request, CancellationToken cancellationToken = default);
        Task<CustomerResponse> UpdateAsync(int id, UpdateCustomerRequest request, CancellationToken cancellationToken = default);
        Task DeleteOrDeactivateAsync(int id, CancellationToken cancellationToken = default);
    }

    public interface IBicycleService
    {
        Task<PagedResult<BicycleResponse>> GetBicyclesAsync(PagedRequest request, int? customerId = null, BikeType? bikeType = null, CancellationToken cancellationToken = default);
        Task<BicycleResponse> GetByIdAsync(int id, CancellationToken cancellationToken = default);
        Task<BicycleResponse> CreateAsync(CreateBicycleRequest request, CancellationToken cancellationToken = default);
        Task<BicycleResponse> UpdateAsync(int id, UpdateBicycleRequest request, CancellationToken cancellationToken = default);
        Task DeleteAsync(int id, CancellationToken cancellationToken = default);
    }

    public interface ISupplierService
    {
        Task<PagedResult<SupplierResponse>> GetSuppliersAsync(PagedRequest request, CancellationToken cancellationToken = default);
        Task<SupplierResponse> GetByIdAsync(int id, CancellationToken cancellationToken = default);
        Task<SupplierResponse> CreateAsync(CreateSupplierRequest request, CancellationToken cancellationToken = default);
        Task<SupplierResponse> UpdateAsync(int id, UpdateSupplierRequest request, CancellationToken cancellationToken = default);
        Task DeleteOrDeactivateAsync(int id, CancellationToken cancellationToken = default);
    }

    public interface IProductService
    {
        Task<PagedResult<ProductResponse>> GetProductsAsync(PagedRequest request, int? categoryId = null, int? supplierId = null, bool? activeOnly = null, bool? lowStockOnly = null, CancellationToken cancellationToken = default);
        Task<ProductResponse> GetByIdAsync(int id, CancellationToken cancellationToken = default);
        Task<string> GetNextCodeAsync(CancellationToken cancellationToken = default);
        Task<ProductResponse> CreateAsync(CreateProductRequest request, CancellationToken cancellationToken = default);
        Task<ProductResponse> UpdateAsync(int id, UpdateProductRequest request, CancellationToken cancellationToken = default);
        Task SetActiveStatusAsync(int id, bool isActive, CancellationToken cancellationToken = default);

        Task<List<ProductCategoryDto>> GetCategoriesAsync(CancellationToken cancellationToken = default);
        Task<ProductCategoryDto> CreateCategoryAsync(CreateProductCategoryRequest request, CancellationToken cancellationToken = default);
        Task<ProductCategoryDto> UpdateCategoryAsync(int id, UpdateProductCategoryRequest request, CancellationToken cancellationToken = default);
    }

    public interface IServiceService
    {
        Task<PagedResult<ServiceResponse>> GetServicesAsync(PagedRequest request, bool? activeOnly = null, CancellationToken cancellationToken = default);
        Task<ServiceResponse> GetByIdAsync(int id, CancellationToken cancellationToken = default);
        Task<ServiceResponse> CreateAsync(CreateServiceRequest request, CancellationToken cancellationToken = default);
        Task<ServiceResponse> UpdateAsync(int id, UpdateServiceRequest request, CancellationToken cancellationToken = default);
        Task DeleteOrDeactivateAsync(int id, CancellationToken cancellationToken = default);
    }

    public interface IStockService
    {
        Task<StockMovementResponse> AdjustStockAsync(AdjustStockRequest request, CancellationToken cancellationToken = default);
        Task<PagedResult<StockMovementResponse>> GetMovementsAsync(PagedRequest request, int? productId = null, StockMovementType? type = null, CancellationToken cancellationToken = default);
        Task<decimal> GetProductStockAsync(int productId, CancellationToken cancellationToken = default);
    }

    public interface IWorkOrderService
    {
        Task<PagedResult<WorkOrderResponse>> GetWorkOrdersAsync(PagedRequest request, int? customerId = null, int? bicycleId = null, WorkOrderStatus? status = null, DateTime? startDate = null, DateTime? endDate = null, CancellationToken cancellationToken = default);
        Task<WorkOrderResponse> GetByIdAsync(int id, CancellationToken cancellationToken = default);
        Task<WorkOrderResponse> CreateAsync(CreateWorkOrderRequest request, CancellationToken cancellationToken = default);
        Task<WorkOrderResponse> UpdateAsync(int id, UpdateWorkOrderRequest request, CancellationToken cancellationToken = default);

        Task<WorkOrderResponse> AddItemAsync(int workOrderId, AddWorkOrderItemRequest request, CancellationToken cancellationToken = default);
        Task<WorkOrderResponse> UpdateItemAsync(int workOrderId, int itemId, UpdateWorkOrderItemRequest request, CancellationToken cancellationToken = default);
        Task<WorkOrderResponse> RemoveItemAsync(int workOrderId, int itemId, CancellationToken cancellationToken = default);

        Task<WorkOrderResponse> ChangeStatusAsync(int workOrderId, ChangeWorkOrderStatusRequest request, CancellationToken cancellationToken = default);
        Task<List<WorkOrderStatusHistoryResponse>> GetStatusHistoryAsync(int workOrderId, CancellationToken cancellationToken = default);

        Task<WorkOrderResponse> ApproveAsync(int workOrderId, ApproveWorkOrderRequest request, CancellationToken cancellationToken = default);
        Task<WorkOrderResponse> CancelAsync(int workOrderId, CancelWorkOrderRequest request, CancellationToken cancellationToken = default);

        Task<SaleResponse> ConvertToSaleAsync(int workOrderId, ConvertWorkOrderToSaleRequest request, CancellationToken cancellationToken = default);
    }

    public interface ISaleService
    {
        Task<PagedResult<SaleResponse>> GetSalesAsync(PagedRequest request, int? customerId = null, SaleStatus? status = null, DateTime? startDate = null, DateTime? endDate = null, int? paymentMethodId = null, CancellationToken cancellationToken = default);
        Task<SaleResponse> GetByIdAsync(int id, CancellationToken cancellationToken = default);
        Task<SaleResponse> CreateAsync(CreateSaleRequest request, CancellationToken cancellationToken = default);
        Task<SaleResponse> AddItemAsync(int saleId, AddSaleItemRequest request, CancellationToken cancellationToken = default);
        Task<SaleResponse> RemoveItemAsync(int saleId, int itemId, CancellationToken cancellationToken = default);
        Task<SaleResponse> AddPaymentAsync(int saleId, AddPaymentRequest request, CancellationToken cancellationToken = default);
        Task<SaleResponse> CompleteSaleAsync(int saleId, CancellationToken cancellationToken = default);
        Task<SaleResponse> CancelSaleAsync(int saleId, CancelSaleRequest request, CancellationToken cancellationToken = default);
        Task<SaleResponse> ConvertToSaleAsync(int workOrderId, ConvertWorkOrderToSaleRequest request, CancellationToken cancellationToken = default);
        Task<List<PaymentMethodResponse>> GetPaymentMethodsAsync(CancellationToken cancellationToken = default);
    }

    public interface IPrintService
    {
        Task<WorkOrderPrintDto> GetWorkOrderPrintDataAsync(int workOrderId, CancellationToken cancellationToken = default);
        Task<SalePrintDto> GetSalePrintDataAsync(int saleId, CancellationToken cancellationToken = default);
    }

    public interface IDashboardService
    {
        Task<DashboardMetricsDto> GetDashboardMetricsAsync(CancellationToken cancellationToken = default);
    }

    public interface IAuditService
    {
        Task LogAsync(string entityName, string entityId, string action, object? oldValues = null, object? newValues = null, CancellationToken cancellationToken = default);
        Task<PagedResult<AuditLogDto>> GetLogsAsync(PagedRequest request, string? entityName = null, string? entityId = null, CancellationToken cancellationToken = default);
    }

    public class AuditLogDto
    {
        public int Id { get; set; }
        public int? UserId { get; set; }
        public string? UserName { get; set; }
        public string EntityName { get; set; } = string.Empty;
        public string EntityId { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty;
        public string? OldValues { get; set; }
        public string? NewValues { get; set; }
        public string? IpAddress { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
