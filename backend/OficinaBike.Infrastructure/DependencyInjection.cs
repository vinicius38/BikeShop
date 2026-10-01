using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using OficinaBike.Application.Interfaces;
using OficinaBike.Infrastructure.Persistence;
using OficinaBike.Infrastructure.Security;
using OficinaBike.Infrastructure.Storage;

namespace OficinaBike.Infrastructure
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
        {
            var provider = configuration["Database:Provider"] ?? "Sqlite";
            var connectionString = configuration.GetConnectionString("DefaultConnection");

            if (provider.Equals("PostgreSql", StringComparison.OrdinalIgnoreCase) || provider.Equals("Supabase", StringComparison.OrdinalIgnoreCase))
            {
                var postgresConn = configuration.GetConnectionString("SupabaseConnection") ?? configuration.GetConnectionString("PostgreSqlConnection") ?? connectionString;
                services.AddDbContext<OficinaBikeDbContext>(options =>
                    options.UseNpgsql(postgresConn, b =>
                    {
                        b.MigrationsAssembly(typeof(OficinaBikeDbContext).Assembly.FullName);
                    }));
            }
            else if (provider.Equals("SqlServer", StringComparison.OrdinalIgnoreCase))
            {
                var sqlServerConn = configuration.GetConnectionString("SqlServerConnection") ?? connectionString;
                services.AddDbContext<OficinaBikeDbContext>(options =>
                    options.UseSqlServer(sqlServerConn, b =>
                    {
                        b.MigrationsAssembly(typeof(OficinaBikeDbContext).Assembly.FullName);
                    }));
            }
            else
            {
                // SQLite provider - ideal for development, self-contained demonstration and container testing
                var sqliteConn = connectionString ?? "Data Source=oficinabike.db";
                services.AddDbContext<OficinaBikeDbContext>(options =>
                    options.UseSqlite(sqliteConn, b =>
                    {
                        b.MigrationsAssembly(typeof(OficinaBikeDbContext).Assembly.FullName);
                    }));
            }

            services.AddScoped<IOficinaBikeDbContext>(providerService => providerService.GetRequiredService<OficinaBikeDbContext>());

            // Register Security Services
            services.AddSingleton<IPasswordHasher, BCryptPasswordHasher>();
            services.AddScoped<ITokenService, JwtTokenService>();

            // Register Logo Storage Service
            services.AddScoped<ILogoStorageService, FileLogoStorageService>();

            return services;
        }
    }
}
