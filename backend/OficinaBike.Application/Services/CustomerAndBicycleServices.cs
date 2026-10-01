using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using OficinaBike.Application.Common;
using OficinaBike.Application.DTOs;
using OficinaBike.Application.Interfaces;
using OficinaBike.Domain.Entities;
using OficinaBike.Domain.Enums;
using OficinaBike.Domain.Exceptions;

namespace OficinaBike.Application.Services
{
    public class CustomerService : ICustomerService
    {
        private readonly IOficinaBikeDbContext _context;
        private readonly ICurrentUserService _currentUserService;
        private readonly IAuditService _auditService;

        public CustomerService(IOficinaBikeDbContext context, ICurrentUserService currentUserService, IAuditService auditService)
        {
            _context = context;
            _currentUserService = currentUserService;
            _auditService = auditService;
        }

        public async Task<PagedResult<CustomerResponse>> GetCustomersAsync(
            PagedRequest request,
            string? phone = null,
            string? cpfCnpj = null,
            CancellationToken cancellationToken = default)
        {
            var query = _context.Customers
                .AsNoTracking()
                .Include(c => c.Address)
                .Include(c => c.Bicycles)
                .Include(c => c.WorkOrders)
                .Include(c => c.Sales)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(request.Search))
            {
                var term = request.Search.Trim().ToLower();
                query = query.Where(c => c.Name.ToLower().Contains(term) ||
                                         (c.CpfCnpj != null && c.CpfCnpj.Contains(term)) ||
                                         (c.Email != null && c.Email.ToLower().Contains(term)) ||
                                         (c.Phone != null && c.Phone.Contains(term)) ||
                                         (c.CellPhone != null && c.CellPhone.Contains(term)));
            }

            if (!string.IsNullOrWhiteSpace(phone))
            {
                var term = phone.Trim();
                query = query.Where(c => (c.Phone != null && c.Phone.Contains(term)) ||
                                         (c.CellPhone != null && c.CellPhone.Contains(term)));
            }

            if (!string.IsNullOrWhiteSpace(cpfCnpj))
            {
                var term = cpfCnpj.Trim();
                query = query.Where(c => c.CpfCnpj != null && c.CpfCnpj.Contains(term));
            }

            var totalItems = await query.CountAsync(cancellationToken);
            var page = Math.Max(1, request.Page);
            var pageSize = Math.Clamp(request.PageSize, 1, 100);

            var customers = await query
                .OrderBy(c => c.Name)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(cancellationToken);

            var dtos = customers.Select(MapToResponse).ToList();
            return new PagedResult<CustomerResponse>(dtos, totalItems, page, pageSize);
        }

        public async Task<CustomerResponse> GetByIdAsync(int id, CancellationToken cancellationToken = default)
        {
            var customer = await _context.Customers
                .AsNoTracking()
                .Include(c => c.Address)
                .Include(c => c.Bicycles)
                .Include(c => c.WorkOrders)
                .Include(c => c.Sales)
                .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

            if (customer == null)
                throw new NotFoundException("Cliente", id);

            return MapToResponse(customer);
        }

        public async Task<CustomerResponse> CreateAsync(CreateCustomerRequest request, CancellationToken cancellationToken = default)
        {
            if (!string.IsNullOrWhiteSpace(request.CpfCnpj))
            {
                var exists = await _context.Customers.AnyAsync(c => c.CpfCnpj == request.CpfCnpj.Trim(), cancellationToken);
                if (exists)
                    throw new BusinessRuleException($"Já existe um cliente cadastrado com o CPF/CNPJ '{request.CpfCnpj}'.");
            }

            Address? address = null;
            if (request.Address != null && 
                (!string.IsNullOrWhiteSpace(request.Address.Street) || 
                 !string.IsNullOrWhiteSpace(request.Address.City) || 
                 !string.IsNullOrWhiteSpace(request.Address.ZipCode) ||
                 !string.IsNullOrWhiteSpace(request.Address.Neighborhood)))
            {
                address = new Address
                {
                    ZipCode = request.Address.ZipCode?.Trim() ?? string.Empty,
                    Street = request.Address.Street?.Trim() ?? string.Empty,
                    Number = request.Address.Number?.Trim() ?? string.Empty,
                    Complement = request.Address.Complement?.Trim(),
                    Neighborhood = request.Address.Neighborhood?.Trim() ?? string.Empty,
                    City = request.Address.City?.Trim() ?? string.Empty,
                    State = request.Address.State?.Trim() ?? string.Empty,
                    CreatedAt = DateTime.UtcNow
                };
            }

            var customer = new Customer
            {
                Name = request.Name.Trim(),
                CpfCnpj = string.IsNullOrWhiteSpace(request.CpfCnpj) ? null : request.CpfCnpj.Trim(),
                Phone = request.Phone?.Trim(),
                CellPhone = request.CellPhone?.Trim(),
                Email = string.IsNullOrWhiteSpace(request.Email) ? null : request.Email.Trim().ToLower(),
                BirthDate = request.BirthDate,
                Notes = request.Notes?.Trim(),
                Address = address,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                CreatedByUserId = _currentUserService.UserId
            };

            _context.Customers.Add(customer);
            await _context.SaveChangesAsync(cancellationToken);

            await _auditService.LogAsync("Customer", customer.Id.ToString(), "Create", null, new { customer.Name, customer.CpfCnpj }, cancellationToken);

            return await GetByIdAsync(customer.Id, cancellationToken);
        }

        public async Task<CustomerResponse> UpdateAsync(int id, UpdateCustomerRequest request, CancellationToken cancellationToken = default)
        {
            var customer = await _context.Customers
                .Include(c => c.Address)
                .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

            if (customer == null)
                throw new NotFoundException("Cliente", id);

            if (!string.IsNullOrWhiteSpace(request.CpfCnpj))
            {
                var exists = await _context.Customers.AnyAsync(c => c.CpfCnpj == request.CpfCnpj.Trim() && c.Id != id, cancellationToken);
                if (exists)
                    throw new BusinessRuleException($"Já existe outro cliente com o CPF/CNPJ '{request.CpfCnpj}'.");
            }

            var oldValues = new { customer.Name, customer.CpfCnpj, customer.Phone, customer.CellPhone, customer.Email, customer.IsActive };

            customer.Name = request.Name.Trim();
            customer.CpfCnpj = string.IsNullOrWhiteSpace(request.CpfCnpj) ? null : request.CpfCnpj.Trim();
            customer.Phone = request.Phone?.Trim();
            customer.CellPhone = request.CellPhone?.Trim();
            customer.Email = string.IsNullOrWhiteSpace(request.Email) ? null : request.Email.Trim().ToLower();
            customer.BirthDate = request.BirthDate;
            customer.Notes = request.Notes?.Trim();
            customer.IsActive = request.IsActive;
            customer.UpdatedAt = DateTime.UtcNow;
            customer.UpdatedByUserId = _currentUserService.UserId;

            if (request.Address != null)
            {
                if (customer.Address == null)
                {
                    customer.Address = new Address
                    {
                        ZipCode = request.Address.ZipCode?.Trim() ?? string.Empty,
                        Street = request.Address.Street?.Trim() ?? string.Empty,
                        Number = request.Address.Number?.Trim() ?? string.Empty,
                        Complement = request.Address.Complement?.Trim(),
                        Neighborhood = request.Address.Neighborhood?.Trim() ?? string.Empty,
                        City = request.Address.City?.Trim() ?? string.Empty,
                        State = request.Address.State?.Trim() ?? string.Empty,
                        CreatedAt = DateTime.UtcNow
                    };
                }
                else
                {
                    customer.Address.ZipCode = request.Address.ZipCode?.Trim() ?? string.Empty;
                    customer.Address.Street = request.Address.Street?.Trim() ?? string.Empty;
                    customer.Address.Number = request.Address.Number?.Trim() ?? string.Empty;
                    customer.Address.Complement = request.Address.Complement?.Trim();
                    customer.Address.Neighborhood = request.Address.Neighborhood?.Trim() ?? string.Empty;
                    customer.Address.City = request.Address.City?.Trim() ?? string.Empty;
                    customer.Address.State = request.Address.State?.Trim() ?? string.Empty;
                    customer.Address.UpdatedAt = DateTime.UtcNow;
                }
            }

            await _context.SaveChangesAsync(cancellationToken);
            await _auditService.LogAsync("Customer", customer.Id.ToString(), "Update", oldValues, new { customer.Name, customer.CpfCnpj, customer.IsActive }, cancellationToken);

            return await GetByIdAsync(customer.Id, cancellationToken);
        }

        public async Task DeleteOrDeactivateAsync(int id, CancellationToken cancellationToken = default)
        {
            var customer = await _context.Customers
                .Include(c => c.WorkOrders)
                .Include(c => c.Sales)
                .Include(c => c.Bicycles)
                .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

            if (customer == null)
                throw new NotFoundException("Cliente", id);

            // Soft delete if related records exist to maintain audit integrity
            if (customer.WorkOrders.Any() || customer.Sales.Any() || customer.Bicycles.Any())
            {
                customer.IsActive = false;
                customer.UpdatedAt = DateTime.UtcNow;
                customer.UpdatedByUserId = _currentUserService.UserId;
                await _context.SaveChangesAsync(cancellationToken);
                await _auditService.LogAsync("Customer", customer.Id.ToString(), "Deactivate", null, new { IsActive = false }, cancellationToken);
            }
            else
            {
                _context.Customers.Remove(customer);
                await _context.SaveChangesAsync(cancellationToken);
                await _auditService.LogAsync("Customer", customer.Id.ToString(), "Delete", null, null, cancellationToken);
            }
        }

        private static CustomerResponse MapToResponse(Customer c)
        {
            return new CustomerResponse
            {
                Id = c.Id,
                Name = c.Name,
                CpfCnpj = c.CpfCnpj,
                Phone = c.Phone,
                CellPhone = c.CellPhone,
                Email = c.Email,
                BirthDate = c.BirthDate,
                Notes = c.Notes,
                IsActive = c.IsActive,
                BicyclesCount = c.Bicycles.Count,
                WorkOrdersCount = c.WorkOrders.Count,
                SalesCount = c.Sales.Count,
                CreatedAt = c.CreatedAt,
                UpdatedAt = c.UpdatedAt,
                Address = c.Address == null ? null : new AddressDto
                {
                    Id = c.Address.Id,
                    ZipCode = c.Address.ZipCode,
                    Street = c.Address.Street,
                    Number = c.Address.Number,
                    Complement = c.Address.Complement,
                    Neighborhood = c.Address.Neighborhood,
                    City = c.Address.City,
                    State = c.Address.State
                }
            };
        }
    }

    public class BicycleService : IBicycleService
    {
        private readonly IOficinaBikeDbContext _context;
        private readonly ICurrentUserService _currentUserService;
        private readonly IAuditService _auditService;

        public BicycleService(IOficinaBikeDbContext context, ICurrentUserService currentUserService, IAuditService auditService)
        {
            _context = context;
            _currentUserService = currentUserService;
            _auditService = auditService;
        }

        public async Task<PagedResult<BicycleResponse>> GetBicyclesAsync(
            PagedRequest request,
            int? customerId = null,
            BikeType? bikeType = null,
            CancellationToken cancellationToken = default)
        {
            var query = _context.Bicycles
                .AsNoTracking()
                .Include(b => b.Customer)
                .AsQueryable();

            if (customerId.HasValue)
                query = query.Where(b => b.CustomerId == customerId.Value);

            if (bikeType.HasValue)
                query = query.Where(b => b.BikeType == bikeType.Value);

            if (!string.IsNullOrWhiteSpace(request.Search))
            {
                var term = request.Search.Trim().ToLower();
                query = query.Where(b => b.Brand.ToLower().Contains(term) ||
                                         b.Model.ToLower().Contains(term) ||
                                         (b.SerialNumber != null && b.SerialNumber.ToLower().Contains(term)) ||
                                         b.Customer.Name.ToLower().Contains(term));
            }

            var totalItems = await query.CountAsync(cancellationToken);
            var page = Math.Max(1, request.Page);
            var pageSize = Math.Clamp(request.PageSize, 1, 100);

            var bicycles = await query
                .OrderBy(b => b.Brand)
                .ThenBy(b => b.Model)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(cancellationToken);

            var dtos = bicycles.Select(b => new BicycleResponse
            {
                Id = b.Id,
                CustomerId = b.CustomerId,
                CustomerName = b.Customer.Name,
                Brand = b.Brand,
                Model = b.Model,
                Color = b.Color,
                FrameSize = b.FrameSize,
                SerialNumber = b.SerialNumber,
                BikeType = b.BikeType,
                Notes = b.Notes,
                CreatedAt = b.CreatedAt
            }).ToList();

            return new PagedResult<BicycleResponse>(dtos, totalItems, page, pageSize);
        }

        public async Task<BicycleResponse> GetByIdAsync(int id, CancellationToken cancellationToken = default)
        {
            var b = await _context.Bicycles
                .AsNoTracking()
                .Include(b => b.Customer)
                .FirstOrDefaultAsync(b => b.Id == id, cancellationToken);

            if (b == null)
                throw new NotFoundException("Bicicleta", id);

            return new BicycleResponse
            {
                Id = b.Id,
                CustomerId = b.CustomerId,
                CustomerName = b.Customer.Name,
                Brand = b.Brand,
                Model = b.Model,
                Color = b.Color,
                FrameSize = b.FrameSize,
                SerialNumber = b.SerialNumber,
                BikeType = b.BikeType,
                Notes = b.Notes,
                CreatedAt = b.CreatedAt
            };
        }

        public async Task<BicycleResponse> CreateAsync(CreateBicycleRequest request, CancellationToken cancellationToken = default)
        {
            var customer = await _context.Customers.FindAsync(new object[] { request.CustomerId }, cancellationToken);
            if (customer == null)
                throw new NotFoundException("Cliente", request.CustomerId);

            var bicycle = new Bicycle
            {
                CustomerId = request.CustomerId,
                Brand = request.Brand.Trim(),
                Model = request.Model.Trim(),
                Color = request.Color?.Trim(),
                FrameSize = request.FrameSize?.Trim(),
                SerialNumber = request.SerialNumber?.Trim(),
                BikeType = request.BikeType,
                Notes = request.Notes?.Trim(),
                CreatedAt = DateTime.UtcNow,
                CreatedByUserId = _currentUserService.UserId
            };

            _context.Bicycles.Add(bicycle);
            await _context.SaveChangesAsync(cancellationToken);

            await _auditService.LogAsync("Bicycle", bicycle.Id.ToString(), "Create", null, new { bicycle.Brand, bicycle.Model, bicycle.CustomerId }, cancellationToken);

            return await GetByIdAsync(bicycle.Id, cancellationToken);
        }

        public async Task<BicycleResponse> UpdateAsync(int id, UpdateBicycleRequest request, CancellationToken cancellationToken = default)
        {
            var bicycle = await _context.Bicycles.FindAsync(new object[] { id }, cancellationToken);
            if (bicycle == null)
                throw new NotFoundException("Bicicleta", id);

            var oldValues = new { bicycle.Brand, bicycle.Model, bicycle.Color, bicycle.FrameSize, bicycle.SerialNumber, bicycle.BikeType };

            bicycle.Brand = request.Brand.Trim();
            bicycle.Model = request.Model.Trim();
            bicycle.Color = request.Color?.Trim();
            bicycle.FrameSize = request.FrameSize?.Trim();
            bicycle.SerialNumber = request.SerialNumber?.Trim();
            bicycle.BikeType = request.BikeType;
            bicycle.Notes = request.Notes?.Trim();
            bicycle.UpdatedAt = DateTime.UtcNow;
            bicycle.UpdatedByUserId = _currentUserService.UserId;

            await _context.SaveChangesAsync(cancellationToken);

            await _auditService.LogAsync("Bicycle", bicycle.Id.ToString(), "Update", oldValues, new { bicycle.Brand, bicycle.Model }, cancellationToken);

            return await GetByIdAsync(bicycle.Id, cancellationToken);
        }

        public async Task DeleteAsync(int id, CancellationToken cancellationToken = default)
        {
            var bicycle = await _context.Bicycles
                .Include(b => b.WorkOrders)
                .FirstOrDefaultAsync(b => b.Id == id, cancellationToken);

            if (bicycle == null)
                throw new NotFoundException("Bicicleta", id);

            if (bicycle.WorkOrders.Any())
                throw new BusinessRuleException("Não é possível excluir esta bicicleta pois existem Ordens de Serviço associadas a ela.");

            _context.Bicycles.Remove(bicycle);
            await _context.SaveChangesAsync(cancellationToken);

            await _auditService.LogAsync("Bicycle", bicycle.Id.ToString(), "Delete", null, null, cancellationToken);
        }
    }
}
