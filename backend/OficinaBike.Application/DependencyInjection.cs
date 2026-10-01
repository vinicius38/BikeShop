using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using OficinaBike.Application.Interfaces;
using OficinaBike.Application.Services;
using OficinaBike.Application.Validators;

namespace OficinaBike.Application
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddApplication(this IServiceCollection services)
        {
            // Register FluentValidation
            services.AddValidatorsFromAssemblyContaining<CreateCustomerRequestValidator>();

            // In-Memory Cache for settings & print headers
            services.AddMemoryCache();

            // Register Application Services
            services.AddScoped<IAuthService, AuthService>();
            services.AddScoped<IUserService, UserService>();
            services.AddScoped<ICustomerService, CustomerService>();
            services.AddScoped<IBicycleService, BicycleService>();
            services.AddScoped<ISupplierService, SupplierService>();
            services.AddScoped<IProductService, ProductService>();
            services.AddScoped<IServiceService, ServiceService>();
            services.AddScoped<IStockService, StockService>();
            services.AddScoped<IWorkOrderService, WorkOrderService>();
            services.AddScoped<ISaleService, SaleService>();
            services.AddScoped<IPrintService, PrintService>();
            services.AddScoped<IDashboardService, DashboardService>();
            services.AddScoped<IAuditService, AuditService>();
            services.AddScoped<IWorkshopSettingsService, WorkshopSettingsService>();
            services.AddScoped<IDocumentCompanyInfoService, DocumentCompanyInfoService>();

            return services;
        }
    }
}
