using System;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using OficinaBike.API.Authorization;
using OficinaBike.API.Middlewares;
using OficinaBike.API.Services;
using OficinaBike.Application;
using OficinaBike.Application.Interfaces;
using OficinaBike.Infrastructure;
using OficinaBike.Infrastructure.Persistence;
using Serilog;

AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);

builder.WebHost.ConfigureKestrel(serverOptions =>
{
    serverOptions.ListenAnyIP(5005);
});

// 1. Configure Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .CreateLogger();

builder.Host.UseSerilog();

// 2. Add services to the container
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
        options.JsonSerializerOptions.Converters.Add(new NullableDateTimeJsonConverter());
        options.JsonSerializerOptions.Converters.Add(new DateTimeJsonConverter());
    });

builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();

// Application and Infrastructure Layer DI
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

// 3. JWT Bearer Authentication
var jwtSecretKey = builder.Configuration["Jwt:SecretKey"] ?? "OficinaBikePro_UltraSecure_JwtSuperSecretKey_2026!#$_EnterpriseBackendOficinaDeBicicletas";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "OficinaBikeAPI";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "OficinaBikeClients";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecretKey)),
        ValidateIssuer = true,
        ValidIssuer = jwtIssuer,
        ValidateAudience = true,
        ValidAudience = jwtAudience,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

// 4. Permission-based Authorization
builder.Services.AddSingleton<IAuthorizationPolicyProvider, PermissionPolicyProvider>();
builder.Services.AddScoped<IAuthorizationHandler, PermissionAuthorizationHandler>();

// 5. CORS Policy
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// 6. Swagger / OpenAPI Documentation with JWT Bearer Support
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "OficinaBike API - Sistema de Gestão para Oficina de Bicicletas",
        Version = "v1",
        Description = "API RESTful profissional para gerenciamento completo de oficinas de bicicletas, ordens de serviço, clientes, estoque, vendas e controle financeiro."
    });

    // Configure JWT Bearer in Swagger
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "Insira o token JWT no formato: Bearer {seu_token}",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// 7. Auto-migration & Database Seeding on startup
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var dbContext = services.GetRequiredService<OficinaBikeDbContext>();
        var passwordHasher = services.GetRequiredService<IPasswordHasher>();

        // Ensure database tables are created (works across SQLite, PostgreSQL/Supabase and SQL Server)
        var databaseCreator = dbContext.Database.GetService<IDatabaseCreator>() as IRelationalDatabaseCreator;
        if (databaseCreator != null)
        {
            try
            {
                var script = databaseCreator.GenerateCreateScript();
                await System.IO.File.WriteAllTextAsync("schema_supabase.sql", script);
                Log.Information("Script DDL gerado com sucesso em schema_supabase.sql (Tamanho: {Length}).", script.Length);
                await databaseCreator.CreateTablesAsync();
                Log.Information("Tabelas do banco de dados criadas com sucesso via CreateTablesAsync.");
            }
            catch (Exception ex)
            {
                Log.Error(ex, "CreateTablesAsync falhou com erro: {Message}", ex.Message);
            }
        }
        else
        {
            await dbContext.Database.EnsureCreatedAsync();
        }

        // Seed initial standard roles, permissions, admin user, payment methods, categories and catalog
        await DatabaseSeeder.SeedAsync(dbContext, passwordHasher);

        Log.Information("Banco de dados verificado e dados iniciais (Seeds) aplicados com sucesso.");
    }
    catch (Exception ex)
    {
        Log.Fatal(ex, "Erro fatal ao inicializar o banco de dados.");
    }
}

// 8. Configure HTTP Request Pipeline
app.UseMiddleware<GlobalExceptionMiddleware>();

app.UseSerilogRequestLogging();

app.UseCors("AllowAll");

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "OficinaBike API v1");
    c.RoutePrefix = "swagger";
});

app.UseAuthentication();
app.UseAuthorization();

// Health Check Endpoint
app.MapGet("/health", () => Results.Ok(new
{
    status = "Healthy",
    timestamp = DateTime.UtcNow,
    system = "OficinaBike.API",
    version = "1.0.0"
}));

// Route to Swagger UI from root if desired
app.MapGet("/", () => Results.Redirect("/swagger"));

app.MapControllers();

try
{
    Log.Information("Iniciando OficinaBike API...");
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "A aplicação encerrou inesperadamente.");
}
finally
{
    Log.CloseAndFlush();
}

public partial class Program { }

public class NullableDateTimeJsonConverter : System.Text.Json.Serialization.JsonConverter<DateTime?>
{
    public override DateTime? Read(ref System.Text.Json.Utf8JsonReader reader, Type typeToConvert, System.Text.Json.JsonSerializerOptions options)
    {
        if (reader.TokenType == System.Text.Json.JsonTokenType.Null)
            return null;

        if (reader.TokenType == System.Text.Json.JsonTokenType.String)
        {
            var str = reader.GetString();
            if (string.IsNullOrWhiteSpace(str))
                return null;

            if (DateTime.TryParse(str, System.Globalization.CultureInfo.InvariantCulture, System.Globalization.DateTimeStyles.RoundtripKind, out var dt))
                return dt;

            if (DateTime.TryParse(str, out var dtFallback))
                return dtFallback;
        }

        return reader.GetDateTime();
    }

    public override void Write(System.Text.Json.Utf8JsonWriter writer, DateTime? value, System.Text.Json.JsonSerializerOptions options)
    {
        if (value.HasValue)
            writer.WriteStringValue(value.Value.ToString("o"));
        else
            writer.WriteNullValue();
    }
}

public class DateTimeJsonConverter : System.Text.Json.Serialization.JsonConverter<DateTime>
{
    public override DateTime Read(ref System.Text.Json.Utf8JsonReader reader, Type typeToConvert, System.Text.Json.JsonSerializerOptions options)
    {
        if (reader.TokenType == System.Text.Json.JsonTokenType.String)
        {
            var str = reader.GetString();
            if (string.IsNullOrWhiteSpace(str))
                return default;

            if (DateTime.TryParse(str, System.Globalization.CultureInfo.InvariantCulture, System.Globalization.DateTimeStyles.RoundtripKind, out var dt))
                return dt;

            if (DateTime.TryParse(str, out var dtFallback))
                return dtFallback;
        }

        return reader.GetDateTime();
    }

    public override void Write(System.Text.Json.Utf8JsonWriter writer, DateTime value, System.Text.Json.JsonSerializerOptions options)
    {
        writer.WriteStringValue(value.ToString("o"));
    }
}
