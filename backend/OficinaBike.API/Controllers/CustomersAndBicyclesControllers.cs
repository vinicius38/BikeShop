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
    public class CustomersController : BaseApiController
    {
        private readonly ICustomerService _customerService;

        public CustomersController(ICustomerService customerService)
        {
            _customerService = customerService;
        }

        [HttpGet]
        [Authorize(Policy = "Customers.View")]
        [ProducesResponseType(typeof(ApiResponse<PagedResult<CustomerResponse>>), 200)]
        public async Task<ActionResult<ApiResponse<PagedResult<CustomerResponse>>>> GetCustomers(
            [FromQuery] PagedRequest request,
            [FromQuery] string? phone,
            [FromQuery] string? cpfCnpj,
            CancellationToken cancellationToken)
        {
            var result = await _customerService.GetCustomersAsync(request, phone, cpfCnpj, cancellationToken);
            return HandleOk(result);
        }

        [HttpGet("{id:int}")]
        [Authorize(Policy = "Customers.View")]
        [ProducesResponseType(typeof(ApiResponse<CustomerResponse>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 404)]
        public async Task<ActionResult<ApiResponse<CustomerResponse>>> GetById(int id, CancellationToken cancellationToken)
        {
            var customer = await _customerService.GetByIdAsync(id, cancellationToken);
            return HandleOk(customer);
        }

        [HttpPost]
        [Authorize(Policy = "Customers.Create")]
        [ProducesResponseType(typeof(ApiResponse<CustomerResponse>), 201)]
        [ProducesResponseType(typeof(ApiResponse<object>), 400)]
        [ProducesResponseType(typeof(ApiResponse<object>), 422)]
        public async Task<ActionResult<ApiResponse<CustomerResponse>>> Create([FromBody] CreateCustomerRequest request, CancellationToken cancellationToken)
        {
            var customer = await _customerService.CreateAsync(request, cancellationToken);
            return StatusCode(201, ApiResponse<CustomerResponse>.Ok(customer, "Cliente cadastrado com sucesso."));
        }

        [HttpPut("{id:int}")]
        [Authorize(Policy = "Customers.Update")]
        [ProducesResponseType(typeof(ApiResponse<CustomerResponse>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 404)]
        [ProducesResponseType(typeof(ApiResponse<object>), 422)]
        public async Task<ActionResult<ApiResponse<CustomerResponse>>> Update(int id, [FromBody] UpdateCustomerRequest request, CancellationToken cancellationToken)
        {
            var customer = await _customerService.UpdateAsync(id, request, cancellationToken);
            return HandleOk(customer, "Cliente atualizado com sucesso.");
        }

        [HttpDelete("{id:int}")]
        [Authorize(Policy = "Customers.Delete")]
        [ProducesResponseType(typeof(ApiResponse<string>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 404)]
        public async Task<ActionResult<ApiResponse<string>>> Delete(int id, CancellationToken cancellationToken)
        {
            await _customerService.DeleteOrDeactivateAsync(id, cancellationToken);
            return HandleOk("Cliente removido/inativado com sucesso.");
        }
    }

    [Authorize]
    public class BicyclesController : BaseApiController
    {
        private readonly IBicycleService _bicycleService;

        public BicyclesController(IBicycleService bicycleService)
        {
            _bicycleService = bicycleService;
        }

        [HttpGet]
        [Authorize(Policy = "Bicycles.View")]
        [ProducesResponseType(typeof(ApiResponse<PagedResult<BicycleResponse>>), 200)]
        public async Task<ActionResult<ApiResponse<PagedResult<BicycleResponse>>>> GetBicycles(
            [FromQuery] PagedRequest request,
            [FromQuery] int? customerId,
            [FromQuery] BikeType? bikeType,
            CancellationToken cancellationToken)
        {
            var result = await _bicycleService.GetBicyclesAsync(request, customerId, bikeType, cancellationToken);
            return HandleOk(result);
        }

        [HttpGet("{id:int}")]
        [Authorize(Policy = "Bicycles.View")]
        [ProducesResponseType(typeof(ApiResponse<BicycleResponse>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 404)]
        public async Task<ActionResult<ApiResponse<BicycleResponse>>> GetById(int id, CancellationToken cancellationToken)
        {
            var bike = await _bicycleService.GetByIdAsync(id, cancellationToken);
            return HandleOk(bike);
        }

        [HttpPost]
        [Authorize(Policy = "Bicycles.Create")]
        [ProducesResponseType(typeof(ApiResponse<BicycleResponse>), 201)]
        [ProducesResponseType(typeof(ApiResponse<object>), 422)]
        public async Task<ActionResult<ApiResponse<BicycleResponse>>> Create([FromBody] CreateBicycleRequest request, CancellationToken cancellationToken)
        {
            var bike = await _bicycleService.CreateAsync(request, cancellationToken);
            return StatusCode(201, ApiResponse<BicycleResponse>.Ok(bike, "Bicicleta cadastrada com sucesso."));
        }

        [HttpPut("{id:int}")]
        [Authorize(Policy = "Bicycles.Update")]
        [ProducesResponseType(typeof(ApiResponse<BicycleResponse>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 404)]
        public async Task<ActionResult<ApiResponse<BicycleResponse>>> Update(int id, [FromBody] UpdateBicycleRequest request, CancellationToken cancellationToken)
        {
            var bike = await _bicycleService.UpdateAsync(id, request, cancellationToken);
            return HandleOk(bike, "Bicicleta atualizada com sucesso.");
        }

        [HttpDelete("{id:int}")]
        [Authorize(Policy = "Bicycles.Delete")]
        [ProducesResponseType(typeof(ApiResponse<string>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 404)]
        [ProducesResponseType(typeof(ApiResponse<object>), 422)]
        public async Task<ActionResult<ApiResponse<string>>> Delete(int id, CancellationToken cancellationToken)
        {
            await _bicycleService.DeleteAsync(id, cancellationToken);
            return HandleOk("Bicicleta removida com sucesso.");
        }
    }
}
