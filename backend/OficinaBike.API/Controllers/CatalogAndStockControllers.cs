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
    public class SuppliersController : BaseApiController
    {
        private readonly ISupplierService _supplierService;

        public SuppliersController(ISupplierService supplierService)
        {
            _supplierService = supplierService;
        }

        [HttpGet]
        [Authorize(Policy = "Suppliers.View")]
        [ProducesResponseType(typeof(ApiResponse<PagedResult<SupplierResponse>>), 200)]
        public async Task<ActionResult<ApiResponse<PagedResult<SupplierResponse>>>> GetSuppliers([FromQuery] PagedRequest request, CancellationToken cancellationToken)
        {
            var result = await _supplierService.GetSuppliersAsync(request, cancellationToken);
            return HandleOk(result);
        }

        [HttpGet("{id:int}")]
        [Authorize(Policy = "Suppliers.View")]
        [ProducesResponseType(typeof(ApiResponse<SupplierResponse>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 404)]
        public async Task<ActionResult<ApiResponse<SupplierResponse>>> GetById(int id, CancellationToken cancellationToken)
        {
            var supplier = await _supplierService.GetByIdAsync(id, cancellationToken);
            return HandleOk(supplier);
        }

        [HttpPost]
        [Authorize(Policy = "Suppliers.Create")]
        [ProducesResponseType(typeof(ApiResponse<SupplierResponse>), 201)]
        [ProducesResponseType(typeof(ApiResponse<object>), 422)]
        public async Task<ActionResult<ApiResponse<SupplierResponse>>> Create([FromBody] CreateSupplierRequest request, CancellationToken cancellationToken)
        {
            var supplier = await _supplierService.CreateAsync(request, cancellationToken);
            return StatusCode(201, ApiResponse<SupplierResponse>.Ok(supplier, "Fornecedor cadastrado com sucesso."));
        }

        [HttpPut("{id:int}")]
        [Authorize(Policy = "Suppliers.Update")]
        [ProducesResponseType(typeof(ApiResponse<SupplierResponse>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 404)]
        [ProducesResponseType(typeof(ApiResponse<object>), 422)]
        public async Task<ActionResult<ApiResponse<SupplierResponse>>> Update(int id, [FromBody] UpdateSupplierRequest request, CancellationToken cancellationToken)
        {
            var supplier = await _supplierService.UpdateAsync(id, request, cancellationToken);
            return HandleOk(supplier, "Fornecedor atualizado com sucesso.");
        }

        [HttpDelete("{id:int}")]
        [Authorize(Policy = "Suppliers.Delete")]
        [ProducesResponseType(typeof(ApiResponse<string>), 200)]
        public async Task<ActionResult<ApiResponse<string>>> Delete(int id, CancellationToken cancellationToken)
        {
            await _supplierService.DeleteOrDeactivateAsync(id, cancellationToken);
            return HandleOk("Fornecedor removido/inativado com sucesso.");
        }
    }

    [Authorize]
    [Route("api/product-categories")]
    [Route("api/productcategories")]
    public class ProductCategoriesController : BaseApiController
    {
        private readonly IProductService _productService;

        public ProductCategoriesController(IProductService productService)
        {
            _productService = productService;
        }

        [HttpGet]
        [Authorize(Policy = "Products.View")]
        [ProducesResponseType(typeof(ApiResponse<List<ProductCategoryDto>>), 200)]
        public async Task<ActionResult<ApiResponse<List<ProductCategoryDto>>>> GetCategories(CancellationToken cancellationToken)
        {
            var categories = await _productService.GetCategoriesAsync(cancellationToken);
            return HandleOk(categories);
        }

        [HttpPost]
        [Authorize(Policy = "Products.Create")]
        [ProducesResponseType(typeof(ApiResponse<ProductCategoryDto>), 201)]
        [ProducesResponseType(typeof(ApiResponse<object>), 422)]
        public async Task<ActionResult<ApiResponse<ProductCategoryDto>>> CreateCategory([FromBody] CreateProductCategoryRequest request, CancellationToken cancellationToken)
        {
            var category = await _productService.CreateCategoryAsync(request, cancellationToken);
            return StatusCode(201, ApiResponse<ProductCategoryDto>.Ok(category, "Categoria cadastrada com sucesso."));
        }

        [HttpPut("{id:int}")]
        [Authorize(Policy = "Products.Update")]
        [ProducesResponseType(typeof(ApiResponse<ProductCategoryDto>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 404)]
        public async Task<ActionResult<ApiResponse<ProductCategoryDto>>> UpdateCategory(int id, [FromBody] UpdateProductCategoryRequest request, CancellationToken cancellationToken)
        {
            var category = await _productService.UpdateCategoryAsync(id, request, cancellationToken);
            return HandleOk(category, "Categoria atualizada com sucesso.");
        }
    }

    [Authorize]
    public class ProductsController : BaseApiController
    {
        private readonly IProductService _productService;
        private readonly IStockService _stockService;

        public ProductsController(IProductService productService, IStockService stockService)
        {
            _productService = productService;
            _stockService = stockService;
        }

        [HttpGet]
        [Authorize(Policy = "Products.View")]
        [ProducesResponseType(typeof(ApiResponse<PagedResult<ProductResponse>>), 200)]
        public async Task<ActionResult<ApiResponse<PagedResult<ProductResponse>>>> GetProducts(
            [FromQuery] PagedRequest request,
            [FromQuery] int? categoryId,
            [FromQuery] int? supplierId,
            [FromQuery] bool? activeOnly,
            [FromQuery] bool? lowStockOnly,
            CancellationToken cancellationToken)
        {
            var result = await _productService.GetProductsAsync(request, categoryId, supplierId, activeOnly, lowStockOnly, cancellationToken);
            return HandleOk(result);
        }

        [HttpGet("next-code")]
        [Authorize(Policy = "Products.View")]
        [ProducesResponseType(typeof(ApiResponse<string>), 200)]
        public async Task<ActionResult<ApiResponse<string>>> GetNextCode(CancellationToken cancellationToken)
        {
            var nextCode = await _productService.GetNextCodeAsync(cancellationToken);
            return HandleOk(nextCode);
        }

        [HttpGet("{id:int}")]
        [Authorize(Policy = "Products.View")]
        [ProducesResponseType(typeof(ApiResponse<ProductResponse>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 404)]
        public async Task<ActionResult<ApiResponse<ProductResponse>>> GetById(int id, CancellationToken cancellationToken)
        {
            var product = await _productService.GetByIdAsync(id, cancellationToken);
            return HandleOk(product);
        }

        [HttpPost]
        [Authorize(Policy = "Products.Create")]
        [ProducesResponseType(typeof(ApiResponse<ProductResponse>), 201)]
        [ProducesResponseType(typeof(ApiResponse<object>), 400)]
        [ProducesResponseType(typeof(ApiResponse<object>), 422)]
        public async Task<ActionResult<ApiResponse<ProductResponse>>> Create([FromBody] CreateProductRequest request, CancellationToken cancellationToken)
        {
            var product = await _productService.CreateAsync(request, cancellationToken);
            return StatusCode(201, ApiResponse<ProductResponse>.Ok(product, "Produto cadastrado com sucesso."));
        }

        [HttpPut("{id:int}")]
        [Authorize(Policy = "Products.Update")]
        [ProducesResponseType(typeof(ApiResponse<ProductResponse>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 404)]
        [ProducesResponseType(typeof(ApiResponse<object>), 422)]
        public async Task<ActionResult<ApiResponse<ProductResponse>>> Update(int id, [FromBody] UpdateProductRequest request, CancellationToken cancellationToken)
        {
            var product = await _productService.UpdateAsync(id, request, cancellationToken);
            return HandleOk(product, "Produto atualizado com sucesso.");
        }

        [HttpPatch("{id:int}/activate")]
        [Authorize(Policy = "Products.Update")]
        [ProducesResponseType(typeof(ApiResponse<string>), 200)]
        public async Task<ActionResult<ApiResponse<string>>> Activate(int id, CancellationToken cancellationToken)
        {
            await _productService.SetActiveStatusAsync(id, true, cancellationToken);
            return HandleOk("Produto ativado com sucesso.");
        }

        [HttpPatch("{id:int}/deactivate")]
        [Authorize(Policy = "Products.Update")]
        [ProducesResponseType(typeof(ApiResponse<string>), 200)]
        public async Task<ActionResult<ApiResponse<string>>> Deactivate(int id, CancellationToken cancellationToken)
        {
            await _productService.SetActiveStatusAsync(id, false, cancellationToken);
            return HandleOk("Produto inativado com sucesso.");
        }

        [HttpGet("{id:int}/stock")]
        [Authorize(Policy = "Stock.View")]
        [ProducesResponseType(typeof(ApiResponse<decimal>), 200)]
        public async Task<ActionResult<ApiResponse<decimal>>> GetStock(int id, CancellationToken cancellationToken)
        {
            var stock = await _stockService.GetProductStockAsync(id, cancellationToken);
            return HandleOk(stock);
        }

        [HttpGet("{id:int}/stock-history")]
        [Authorize(Policy = "Stock.View")]
        [ProducesResponseType(typeof(ApiResponse<PagedResult<StockMovementResponse>>), 200)]
        public async Task<ActionResult<ApiResponse<PagedResult<StockMovementResponse>>>> GetStockHistory(int id, [FromQuery] PagedRequest request, CancellationToken cancellationToken)
        {
            var movements = await _stockService.GetMovementsAsync(request, productId: id, cancellationToken: cancellationToken);
            return HandleOk(movements);
        }

        [HttpPost("{id:int}/stock")]
        [Authorize(Policy = "Stock.Adjust")]
        [ProducesResponseType(typeof(ApiResponse<StockMovementResponse>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 400)]
        [ProducesResponseType(typeof(ApiResponse<object>), 422)]
        public async Task<ActionResult<ApiResponse<StockMovementResponse>>> AdjustStock(int id, [FromBody] AdjustStockRequest request, CancellationToken cancellationToken)
        {
            request.ProductId = id;
            var movement = await _stockService.AdjustStockAsync(request, cancellationToken);
            return HandleOk(movement, "Ajuste de estoque realizado com sucesso.");
        }
    }

    [Authorize]
    public class ServicesController : BaseApiController
    {
        private readonly IServiceService _serviceService;

        public ServicesController(IServiceService serviceService)
        {
            _serviceService = serviceService;
        }

        [HttpGet]
        [Authorize(Policy = "Services.View")]
        [ProducesResponseType(typeof(ApiResponse<PagedResult<ServiceResponse>>), 200)]
        public async Task<ActionResult<ApiResponse<PagedResult<ServiceResponse>>>> GetServices(
            [FromQuery] PagedRequest request,
            [FromQuery] bool? activeOnly,
            CancellationToken cancellationToken)
        {
            var result = await _serviceService.GetServicesAsync(request, activeOnly, cancellationToken);
            return HandleOk(result);
        }

        [HttpGet("{id:int}")]
        [Authorize(Policy = "Services.View")]
        [ProducesResponseType(typeof(ApiResponse<ServiceResponse>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 404)]
        public async Task<ActionResult<ApiResponse<ServiceResponse>>> GetById(int id, CancellationToken cancellationToken)
        {
            var service = await _serviceService.GetByIdAsync(id, cancellationToken);
            return HandleOk(service);
        }

        [HttpPost]
        [Authorize(Policy = "Services.Create")]
        [ProducesResponseType(typeof(ApiResponse<ServiceResponse>), 201)]
        [ProducesResponseType(typeof(ApiResponse<object>), 422)]
        public async Task<ActionResult<ApiResponse<ServiceResponse>>> Create([FromBody] CreateServiceRequest request, CancellationToken cancellationToken)
        {
            var service = await _serviceService.CreateAsync(request, cancellationToken);
            return StatusCode(201, ApiResponse<ServiceResponse>.Ok(service, "Serviço cadastrado com sucesso."));
        }

        [HttpPut("{id:int}")]
        [Authorize(Policy = "Services.Update")]
        [ProducesResponseType(typeof(ApiResponse<ServiceResponse>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 404)]
        public async Task<ActionResult<ApiResponse<ServiceResponse>>> Update(int id, [FromBody] UpdateServiceRequest request, CancellationToken cancellationToken)
        {
            var service = await _serviceService.UpdateAsync(id, request, cancellationToken);
            return HandleOk(service, "Serviço atualizado com sucesso.");
        }

        [HttpDelete("{id:int}")]
        [Authorize(Policy = "Services.Delete")]
        [ProducesResponseType(typeof(ApiResponse<string>), 200)]
        public async Task<ActionResult<ApiResponse<string>>> Delete(int id, CancellationToken cancellationToken)
        {
            await _serviceService.DeleteOrDeactivateAsync(id, cancellationToken);
            return HandleOk("Serviço removido/inativado com sucesso.");
        }
    }

    [Authorize]
    public class StockController : BaseApiController
    {
        private readonly IStockService _stockService;

        public StockController(IStockService stockService)
        {
            _stockService = stockService;
        }

        [HttpPost("adjust")]
        [Authorize(Policy = "Stock.Adjust")]
        [ProducesResponseType(typeof(ApiResponse<StockMovementResponse>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 400)]
        [ProducesResponseType(typeof(ApiResponse<object>), 422)]
        public async Task<ActionResult<ApiResponse<StockMovementResponse>>> AdjustStock([FromBody] AdjustStockRequest request, CancellationToken cancellationToken)
        {
            var movement = await _stockService.AdjustStockAsync(request, cancellationToken);
            return HandleOk(movement, "Ajuste de estoque realizado com sucesso.");
        }

        [HttpGet("movements")]
        [Authorize(Policy = "Stock.View")]
        [ProducesResponseType(typeof(ApiResponse<PagedResult<StockMovementResponse>>), 200)]
        public async Task<ActionResult<ApiResponse<PagedResult<StockMovementResponse>>>> GetMovements(
            [FromQuery] PagedRequest request,
            [FromQuery] int? productId,
            [FromQuery] StockMovementType? type,
            CancellationToken cancellationToken)
        {
            var result = await _stockService.GetMovementsAsync(request, productId, type, cancellationToken);
            return HandleOk(result);
        }
    }
}
