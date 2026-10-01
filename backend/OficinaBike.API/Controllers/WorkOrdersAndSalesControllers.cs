using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OficinaBike.Application.Common;
using OficinaBike.Application.DTOs;
using OficinaBike.Application.Interfaces;
using OficinaBike.Domain.Enums;

namespace OficinaBike.API.Controllers
{
    [Authorize]
    [Route("api/work-orders")]
    [Route("api/workorders")]
    public class WorkOrdersController : BaseApiController
    {
        private readonly IWorkOrderService _workOrderService;
        private readonly IPrintService _printService;

        public WorkOrdersController(IWorkOrderService workOrderService, IPrintService printService)
        {
            _workOrderService = workOrderService;
            _printService = printService;
        }

        [HttpGet]
        [Authorize(Policy = "WorkOrders.View")]
        [ProducesResponseType(typeof(ApiResponse<PagedResult<WorkOrderResponse>>), 200)]
        public async Task<ActionResult<ApiResponse<PagedResult<WorkOrderResponse>>>> GetWorkOrders(
            [FromQuery] PagedRequest request,
            [FromQuery] int? customerId,
            [FromQuery] int? bicycleId,
            [FromQuery] WorkOrderStatus? status,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            CancellationToken cancellationToken)
        {
            var result = await _workOrderService.GetWorkOrdersAsync(request, customerId, bicycleId, status, startDate, endDate, cancellationToken);
            return HandleOk(result);
        }

        [HttpGet("{id:int}")]
        [Authorize(Policy = "WorkOrders.View")]
        [ProducesResponseType(typeof(ApiResponse<WorkOrderResponse>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 404)]
        public async Task<ActionResult<ApiResponse<WorkOrderResponse>>> GetById(int id, CancellationToken cancellationToken)
        {
            var order = await _workOrderService.GetByIdAsync(id, cancellationToken);
            return HandleOk(order);
        }

        [HttpPost]
        [Authorize(Policy = "WorkOrders.Create")]
        [ProducesResponseType(typeof(ApiResponse<WorkOrderResponse>), 201)]
        [ProducesResponseType(typeof(ApiResponse<object>), 400)]
        [ProducesResponseType(typeof(ApiResponse<object>), 422)]
        public async Task<ActionResult<ApiResponse<WorkOrderResponse>>> Create([FromBody] CreateWorkOrderRequest request, CancellationToken cancellationToken)
        {
            var order = await _workOrderService.CreateAsync(request, cancellationToken);
            return StatusCode(201, ApiResponse<WorkOrderResponse>.Ok(order, "Ordem de Serviço aberta com sucesso."));
        }

        [HttpPut("{id:int}")]
        [Authorize(Policy = "WorkOrders.Update")]
        [ProducesResponseType(typeof(ApiResponse<WorkOrderResponse>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 404)]
        [ProducesResponseType(typeof(ApiResponse<object>), 422)]
        public async Task<ActionResult<ApiResponse<WorkOrderResponse>>> Update(int id, [FromBody] UpdateWorkOrderRequest request, CancellationToken cancellationToken)
        {
            var order = await _workOrderService.UpdateAsync(id, request, cancellationToken);
            return HandleOk(order, "Ordem de Serviço atualizada com sucesso.");
        }

        [HttpPost("{id:int}/items")]
        [Authorize(Policy = "WorkOrders.Update")]
        [ProducesResponseType(typeof(ApiResponse<WorkOrderResponse>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 400)]
        [ProducesResponseType(typeof(ApiResponse<object>), 422)]
        public async Task<ActionResult<ApiResponse<WorkOrderResponse>>> AddItem(int id, [FromBody] AddWorkOrderItemRequest request, CancellationToken cancellationToken)
        {
            var order = await _workOrderService.AddItemAsync(id, request, cancellationToken);
            return HandleOk(order, "Item adicionado à Ordem de Serviço com sucesso.");
        }

        [HttpPut("{id:int}/items/{itemId:int}")]
        [Authorize(Policy = "WorkOrders.Update")]
        [ProducesResponseType(typeof(ApiResponse<WorkOrderResponse>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 404)]
        public async Task<ActionResult<ApiResponse<WorkOrderResponse>>> UpdateItem(int id, int itemId, [FromBody] UpdateWorkOrderItemRequest request, CancellationToken cancellationToken)
        {
            var order = await _workOrderService.UpdateItemAsync(id, itemId, request, cancellationToken);
            return HandleOk(order, "Item da Ordem de Serviço atualizado com sucesso.");
        }

        [HttpDelete("{id:int}/items/{itemId:int}")]
        [Authorize(Policy = "WorkOrders.Update")]
        [ProducesResponseType(typeof(ApiResponse<WorkOrderResponse>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 404)]
        public async Task<ActionResult<ApiResponse<WorkOrderResponse>>> RemoveItem(int id, int itemId, CancellationToken cancellationToken)
        {
            var order = await _workOrderService.RemoveItemAsync(id, itemId, cancellationToken);
            return HandleOk(order, "Item removido da Ordem de Serviço com sucesso.");
        }

        [HttpPost("{id:int}/status")]
        [Authorize(Policy = "WorkOrders.ChangeStatus")]
        [ProducesResponseType(typeof(ApiResponse<WorkOrderResponse>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 422)]
        public async Task<ActionResult<ApiResponse<WorkOrderResponse>>> ChangeStatus(int id, [FromBody] ChangeWorkOrderStatusRequest request, CancellationToken cancellationToken)
        {
            var order = await _workOrderService.ChangeStatusAsync(id, request, cancellationToken);
            return HandleOk(order, $"Status alterado para '{request.Status}' com sucesso.");
        }

        [HttpGet("{id:int}/status-history")]
        [Authorize(Policy = "WorkOrders.View")]
        [ProducesResponseType(typeof(ApiResponse<List<WorkOrderStatusHistoryResponse>>), 200)]
        public async Task<ActionResult<ApiResponse<List<WorkOrderStatusHistoryResponse>>>> GetStatusHistory(int id, CancellationToken cancellationToken)
        {
            var history = await _workOrderService.GetStatusHistoryAsync(id, cancellationToken);
            return HandleOk(history);
        }

        [HttpPost("{id:int}/approve")]
        [Authorize(Policy = "WorkOrders.Approve")]
        [ProducesResponseType(typeof(ApiResponse<WorkOrderResponse>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 422)]
        public async Task<ActionResult<ApiResponse<WorkOrderResponse>>> Approve(int id, [FromBody] ApproveWorkOrderRequest request, CancellationToken cancellationToken)
        {
            var order = await _workOrderService.ApproveAsync(id, request, cancellationToken);
            var actionText = request.Approved ? "aprovada" : "reprovada";
            return HandleOk(order, $"Ordem de Serviço {actionText} com sucesso.");
        }

        [HttpPost("{id:int}/cancel")]
        [Authorize(Policy = "WorkOrders.Cancel")]
        [ProducesResponseType(typeof(ApiResponse<WorkOrderResponse>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 422)]
        public async Task<ActionResult<ApiResponse<WorkOrderResponse>>> Cancel(int id, [FromBody] CancelWorkOrderRequest request, CancellationToken cancellationToken)
        {
            var order = await _workOrderService.CancelAsync(id, request, cancellationToken);
            return HandleOk(order, "Ordem de Serviço cancelada com sucesso.");
        }

        [HttpPost("{id:int}/convert-to-sale")]
        [Authorize(Policy = "WorkOrders.Convert")]
        [ProducesResponseType(typeof(ApiResponse<SaleResponse>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 422)]
        public async Task<ActionResult<ApiResponse<SaleResponse>>> ConvertToSale(int id, [FromBody] ConvertWorkOrderToSaleRequest request, CancellationToken cancellationToken)
        {
            var sale = await _workOrderService.ConvertToSaleAsync(id, request, cancellationToken);
            return HandleOk(sale, $"Ordem de Serviço convertida com sucesso na venda {sale.Number}.");
        }

        [HttpGet("{id:int}/print")]
        [Authorize(Policy = "WorkOrders.Print")]
        [ProducesResponseType(typeof(ApiResponse<WorkOrderPrintDto>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 404)]
        public async Task<ActionResult<ApiResponse<WorkOrderPrintDto>>> Print(int id, CancellationToken cancellationToken)
        {
            var printData = await _printService.GetWorkOrderPrintDataAsync(id, cancellationToken);
            return HandleOk(printData);
        }
    }

    [Authorize]
    public class SalesController : BaseApiController
    {
        private readonly ISaleService _saleService;
        private readonly IPrintService _printService;

        public SalesController(ISaleService saleService, IPrintService printService)
        {
            _saleService = saleService;
            _printService = printService;
        }

        [HttpGet]
        [Authorize(Policy = "Sales.View")]
        [ProducesResponseType(typeof(ApiResponse<PagedResult<SaleResponse>>), 200)]
        public async Task<ActionResult<ApiResponse<PagedResult<SaleResponse>>>> GetSales(
            [FromQuery] PagedRequest request,
            [FromQuery] int? customerId,
            [FromQuery] SaleStatus? status,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            [FromQuery] int? paymentMethodId,
            CancellationToken cancellationToken)
        {
            var result = await _saleService.GetSalesAsync(request, customerId, status, startDate, endDate, paymentMethodId, cancellationToken);
            return HandleOk(result);
        }

        [HttpGet("{id:int}")]
        [Authorize(Policy = "Sales.View")]
        [ProducesResponseType(typeof(ApiResponse<SaleResponse>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 404)]
        public async Task<ActionResult<ApiResponse<SaleResponse>>> GetById(int id, CancellationToken cancellationToken)
        {
            var sale = await _saleService.GetByIdAsync(id, cancellationToken);
            return HandleOk(sale);
        }

        [HttpPost]
        [Authorize(Policy = "Sales.Create")]
        [ProducesResponseType(typeof(ApiResponse<SaleResponse>), 201)]
        [ProducesResponseType(typeof(ApiResponse<object>), 400)]
        [ProducesResponseType(typeof(ApiResponse<object>), 422)]
        public async Task<ActionResult<ApiResponse<SaleResponse>>> Create([FromBody] CreateSaleRequest request, CancellationToken cancellationToken)
        {
            var sale = await _saleService.CreateAsync(request, cancellationToken);
            return StatusCode(201, ApiResponse<SaleResponse>.Ok(sale, "Venda criada com sucesso."));
        }

        [HttpPost("{id:int}/items")]
        [Authorize(Policy = "Sales.Create")]
        [ProducesResponseType(typeof(ApiResponse<SaleResponse>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 422)]
        public async Task<ActionResult<ApiResponse<SaleResponse>>> AddItem(int id, [FromBody] AddSaleItemRequest request, CancellationToken cancellationToken)
        {
            var sale = await _saleService.AddItemAsync(id, request, cancellationToken);
            return HandleOk(sale, "Item adicionado à venda com sucesso.");
        }

        [HttpDelete("{id:int}/items/{itemId:int}")]
        [Authorize(Policy = "Sales.Create")]
        [ProducesResponseType(typeof(ApiResponse<SaleResponse>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 404)]
        public async Task<ActionResult<ApiResponse<SaleResponse>>> RemoveItem(int id, int itemId, CancellationToken cancellationToken)
        {
            var sale = await _saleService.RemoveItemAsync(id, itemId, cancellationToken);
            return HandleOk(sale, "Item removido da venda com sucesso.");
        }

        [HttpPost("{id:int}/payments")]
        [Authorize(Policy = "Sales.Create")]
        [ProducesResponseType(typeof(ApiResponse<SaleResponse>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 422)]
        public async Task<ActionResult<ApiResponse<SaleResponse>>> AddPayment(int id, [FromBody] AddPaymentRequest request, CancellationToken cancellationToken)
        {
            var sale = await _saleService.AddPaymentAsync(id, request, cancellationToken);
            return HandleOk(sale, "Pagamento registrado com sucesso.");
        }

        [HttpPost("{id:int}/complete")]
        [Authorize(Policy = "Sales.Create")]
        [ProducesResponseType(typeof(ApiResponse<SaleResponse>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 422)]
        public async Task<ActionResult<ApiResponse<SaleResponse>>> Complete(int id, CancellationToken cancellationToken)
        {
            var sale = await _saleService.CompleteSaleAsync(id, cancellationToken);
            return HandleOk(sale, "Venda finalizada com sucesso.");
        }

        [HttpPost("{id:int}/cancel")]
        [Authorize(Policy = "Sales.Cancel")]
        [ProducesResponseType(typeof(ApiResponse<SaleResponse>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 422)]
        public async Task<ActionResult<ApiResponse<SaleResponse>>> Cancel(int id, [FromBody] CancelSaleRequest request, CancellationToken cancellationToken)
        {
            var sale = await _saleService.CancelSaleAsync(id, request, cancellationToken);
            return HandleOk(sale, "Venda cancelada e estoque estornado com sucesso.");
        }

        [HttpGet("{id:int}/print")]
        [Authorize(Policy = "Sales.Print")]
        [ProducesResponseType(typeof(ApiResponse<SalePrintDto>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 404)]
        public async Task<ActionResult<ApiResponse<SalePrintDto>>> Print(int id, CancellationToken cancellationToken)
        {
            var printData = await _printService.GetSalePrintDataAsync(id, cancellationToken);
            return HandleOk(printData);
        }

        [HttpGet("payment-methods")]
        [Authorize]
        [ProducesResponseType(typeof(ApiResponse<List<PaymentMethodResponse>>), 200)]
        public async Task<ActionResult<ApiResponse<List<PaymentMethodResponse>>>> GetPaymentMethods(CancellationToken cancellationToken)
        {
            var methods = await _saleService.GetPaymentMethodsAsync(cancellationToken);
            return HandleOk(methods);
        }
    }

    [Authorize]
    public class DashboardController : BaseApiController
    {
        private readonly IDashboardService _dashboardService;

        public DashboardController(IDashboardService dashboardService)
        {
            _dashboardService = dashboardService;
        }

        [HttpGet]
        [Authorize(Policy = "Dashboard.View")]
        [ProducesResponseType(typeof(ApiResponse<DashboardMetricsDto>), 200)]
        public async Task<ActionResult<ApiResponse<DashboardMetricsDto>>> GetDashboard(CancellationToken cancellationToken)
        {
            var metrics = await _dashboardService.GetDashboardMetricsAsync(cancellationToken);
            return HandleOk(metrics);
        }
    }

    [Authorize]
    public class AuditController : BaseApiController
    {
        private readonly IAuditService _auditService;

        public AuditController(IAuditService auditService)
        {
            _auditService = auditService;
        }

        [HttpGet]
        [Authorize(Policy = "Reports.View")]
        [ProducesResponseType(typeof(ApiResponse<PagedResult<AuditLogDto>>), 200)]
        public async Task<ActionResult<ApiResponse<PagedResult<AuditLogDto>>>> GetAuditLogs(
            [FromQuery] PagedRequest request,
            [FromQuery] string? entityName,
            [FromQuery] string? entityId,
            CancellationToken cancellationToken)
        {
            var logs = await _auditService.GetLogsAsync(request, entityName, entityId, cancellationToken);
            return HandleOk(logs);
        }
    }
}
