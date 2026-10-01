using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using OficinaBike.Application.Interfaces;
using OficinaBike.Domain.Entities;
using OficinaBike.Domain.Enums;

namespace OficinaBike.Infrastructure.Persistence
{
    public class DatabaseSeeder
    {
        public static async Task SeedAsync(OficinaBikeDbContext context, IPasswordHasher passwordHasher)
        {
            // 1. Permissions
            var allPermissions = new List<(string Code, string Name, string Module, string Description)>
            {
                // Users
                ("Users.View", "Visualizar Usuários", "Users", "Permite listar e visualizar detalhes de usuários"),
                ("Users.Create", "Criar Usuário", "Users", "Permite cadastrar novos usuários"),
                ("Users.Update", "Editar Usuário", "Users", "Permite editar usuários"),
                ("Users.Delete", "Excluir Usuário", "Users", "Permite excluir ou inativar usuários"),

                // Customers
                ("Customers.View", "Visualizar Clientes", "Customers", "Permite listar clientes"),
                ("Customers.Create", "Criar Cliente", "Customers", "Permite cadastrar clientes"),
                ("Customers.Update", "Editar Cliente", "Customers", "Permite editar clientes"),
                ("Customers.Delete", "Excluir Cliente", "Customers", "Permite excluir clientes"),

                // Bicycles
                ("Bicycles.View", "Visualizar Bicicletas", "Bicycles", "Permite visualizar bicicletas"),
                ("Bicycles.Create", "Criar Bicicleta", "Bicycles", "Permite cadastrar bicicletas"),
                ("Bicycles.Update", "Editar Bicicleta", "Bicycles", "Permite editar bicicletas"),
                ("Bicycles.Delete", "Excluir Bicicleta", "Bicycles", "Permite excluir bicicletas"),

                // Suppliers
                ("Suppliers.View", "Visualizar Fornecedores", "Suppliers", "Permite listar fornecedores"),
                ("Suppliers.Create", "Criar Fornecedor", "Suppliers", "Permite cadastrar fornecedores"),
                ("Suppliers.Update", "Editar Fornecedor", "Suppliers", "Permite editar fornecedores"),
                ("Suppliers.Delete", "Excluir Fornecedor", "Suppliers", "Permite excluir fornecedores"),

                // Products & Categories
                ("Products.View", "Visualizar Produtos", "Products", "Permite listar produtos e categorias"),
                ("Products.Create", "Criar Produto", "Products", "Permite cadastrar produtos"),
                ("Products.Update", "Editar Produto", "Products", "Permite editar produtos"),
                ("Products.Delete", "Excluir Produto", "Products", "Permite excluir produtos"),

                // Services
                ("Services.View", "Visualizar Serviços", "Services", "Permite listar serviços da oficina"),
                ("Services.Create", "Criar Serviço", "Services", "Permite cadastrar serviços"),
                ("Services.Update", "Editar Serviço", "Services", "Permite editar serviços"),
                ("Services.Delete", "Excluir Serviço", "Services", "Permite excluir serviços"),

                // Work Orders
                ("WorkOrders.View", "Visualizar Ordens de Serviço", "WorkOrders", "Permite listar OS"),
                ("WorkOrders.Create", "Criar Ordem de Serviço", "WorkOrders", "Permite abrir nova OS"),
                ("WorkOrders.Update", "Editar Ordem de Serviço", "WorkOrders", "Permite editar OS e itens"),
                ("WorkOrders.Cancel", "Cancelar Ordem de Serviço", "WorkOrders", "Permite cancelar OS"),
                ("WorkOrders.ChangeStatus", "Alterar Status da OS", "WorkOrders", "Permite avançar fluxo de status da OS"),
                ("WorkOrders.Approve", "Aprovar Orçamento da OS", "WorkOrders", "Permite aprovar ou reprovar orçamentos"),
                ("WorkOrders.Convert", "Converter OS em Venda", "WorkOrders", "Permite faturar e converter OS em venda"),
                ("WorkOrders.Print", "Imprimir Ordem de Serviço", "WorkOrders", "Permite gerar dados de impressão da OS"),

                // Sales
                ("Sales.View", "Visualizar Vendas", "Sales", "Permite visualizar vendas"),
                ("Sales.Create", "Criar Venda", "Sales", "Permite criar vendas diretas"),
                ("Sales.Cancel", "Cancelar Venda", "Sales", "Permite estornar e cancelar vendas"),
                ("Sales.Print", "Imprimir Venda/Recibo", "Sales", "Permite imprimir cupom da venda"),

                // Stock
                ("Stock.View", "Visualizar Estoque", "Stock", "Permite consultar saldo e movimentações"),
                ("Stock.Adjust", "Ajustar Estoque", "Stock", "Permite ajuste manual de inventário"),

                // Dashboard & Reports
                ("Dashboard.View", "Visualizar Painel", "Dashboard", "Permite consultar indicadores gerenciais"),
                ("Reports.View", "Visualizar Relatórios", "Reports", "Permite emitir relatórios"),

                // Workshop Settings
                ("WorkshopSettings.View", "Visualizar Configurações da Oficina", "WorkshopSettings", "Permite visualizar os dados da empresa e logo"),
                ("WorkshopSettings.Create", "Criar Configuração da Oficina", "WorkshopSettings", "Permite cadastrar configuração inicial da oficina"),
                ("WorkshopSettings.Update", "Editar Configurações da Oficina", "WorkshopSettings", "Permite alterar dados institucionais da oficina"),
                ("WorkshopSettings.UpdateLogo", "Alterar Logo da Oficina", "WorkshopSettings", "Permite alterar a logo da oficina"),
                ("WorkshopSettings.DeleteLogo", "Remover Logo da Oficina", "WorkshopSettings", "Permite remover a logo da oficina")
            };

            var existingPermissions = await context.Permissions.ToListAsync();
            foreach (var (code, name, module, desc) in allPermissions)
            {
                if (!existingPermissions.Any(p => p.Code == code))
                {
                    var perm = new Permission
                    {
                        Code = code,
                        Name = name,
                        Module = module,
                        Description = desc
                    };
                    context.Permissions.Add(perm);
                }
            }
            await context.SaveChangesAsync();

            // 2. Roles
            var permissionsInDb = await context.Permissions.ToListAsync();

            var adminRole = await context.Roles.Include(r => r.RolePermissions).FirstOrDefaultAsync(r => r.Name == "Administrador");
            if (adminRole == null)
            {
                adminRole = new Role
                {
                    Name = "Administrador",
                    Description = "Acesso irrestrito a todos os recursos do sistema"
                };
                context.Roles.Add(adminRole);
                await context.SaveChangesAsync();
            }

            foreach (var perm in permissionsInDb)
            {
                if (!adminRole.RolePermissions.Any(rp => rp.PermissionId == perm.Id))
                {
                    adminRole.RolePermissions.Add(new RolePermission { RoleId = adminRole.Id, PermissionId = perm.Id });
                }
            }

            var managerRole = await context.Roles.Include(r => r.RolePermissions).FirstOrDefaultAsync(r => r.Name == "Gerente");
            if (managerRole == null)
            {
                managerRole = new Role { Name = "Gerente", Description = "Gestão operacional e financeira" };
                context.Roles.Add(managerRole);
                await context.SaveChangesAsync();
            }

            var clerkRole = await context.Roles.Include(r => r.RolePermissions).FirstOrDefaultAsync(r => r.Name == "Atendente");
            if (clerkRole == null)
            {
                clerkRole = new Role { Name = "Atendente", Description = "Atendimento a clientes, abertura de OS e vendas" };
                context.Roles.Add(clerkRole);
                await context.SaveChangesAsync();
            }

            var mechanicRole = await context.Roles.Include(r => r.RolePermissions).FirstOrDefaultAsync(r => r.Name == "Mecânico");
            if (mechanicRole == null)
            {
                mechanicRole = new Role { Name = "Mecânico", Description = "Execução de serviços e atualização de status de OS" };
                context.Roles.Add(mechanicRole);
                await context.SaveChangesAsync();
            }

            var financialRole = await context.Roles.Include(r => r.RolePermissions).FirstOrDefaultAsync(r => r.Name == "Financeiro");
            if (financialRole == null)
            {
                financialRole = new Role { Name = "Financeiro", Description = "Gestão de pagamentos, faturamento e relatórios" };
                context.Roles.Add(financialRole);
                await context.SaveChangesAsync();
            }

            // Manager permissions
            var managerPermCodes = new HashSet<string>
            {
                "Users.View", "Customers.View", "Customers.Create", "Customers.Update",
                "Bicycles.View", "Bicycles.Create", "Bicycles.Update",
                "Suppliers.View", "Suppliers.Create", "Suppliers.Update",
                "Products.View", "Products.Create", "Products.Update",
                "Services.View", "Services.Create", "Services.Update",
                "WorkOrders.View", "WorkOrders.Create", "WorkOrders.Update", "WorkOrders.Cancel", "WorkOrders.ChangeStatus", "WorkOrders.Approve", "WorkOrders.Convert", "WorkOrders.Print",
                "Sales.View", "Sales.Create", "Sales.Cancel", "Sales.Print",
                "Stock.View", "Stock.Adjust", "Dashboard.View", "Reports.View",
                "WorkshopSettings.View", "WorkshopSettings.Update", "WorkshopSettings.UpdateLogo", "WorkshopSettings.DeleteLogo"
            };
            foreach (var perm in permissionsInDb.Where(p => managerPermCodes.Contains(p.Code)))
            {
                if (!managerRole.RolePermissions.Any(rp => rp.PermissionId == perm.Id))
                {
                    managerRole.RolePermissions.Add(new RolePermission { RoleId = managerRole.Id, PermissionId = perm.Id });
                }
            }

            // Clerk (Atendente) permissions
            var clerkPermCodes = new HashSet<string>
            {
                "Customers.View", "Customers.Create", "Customers.Update",
                "Bicycles.View", "Bicycles.Create", "Bicycles.Update",
                "Products.View", "Services.View",
                "WorkOrders.View", "WorkOrders.Create", "WorkOrders.Update", "WorkOrders.Print",
                "Sales.View", "Sales.Create", "Sales.Print",
                "Stock.View", "WorkshopSettings.View"
            };
            foreach (var perm in permissionsInDb.Where(p => clerkPermCodes.Contains(p.Code)))
            {
                if (!clerkRole.RolePermissions.Any(rp => rp.PermissionId == perm.Id))
                {
                    clerkRole.RolePermissions.Add(new RolePermission { RoleId = clerkRole.Id, PermissionId = perm.Id });
                }
            }

            // Mechanic permissions
            var mechanicPermCodes = new HashSet<string>
            {
                "Customers.View", "Bicycles.View", "Products.View", "Services.View",
                "WorkOrders.View", "WorkOrders.Update", "WorkOrders.ChangeStatus", "WorkOrders.Print",
                "Stock.View", "WorkshopSettings.View"
            };
            foreach (var perm in permissionsInDb.Where(p => mechanicPermCodes.Contains(p.Code)))
            {
                if (!mechanicRole.RolePermissions.Any(rp => rp.PermissionId == perm.Id))
                {
                    mechanicRole.RolePermissions.Add(new RolePermission { RoleId = mechanicRole.Id, PermissionId = perm.Id });
                }
            }

            await context.SaveChangesAsync();

            // 3. Admin User
            var conflictingUser = await context.Users.FirstOrDefaultAsync(u => u.Email == "vinireis197@gmail.com" && u.Id != 1);
            if (conflictingUser != null)
            {
                conflictingUser.Email = "vinireis197_old_" + conflictingUser.Id + "@gmail.com";
                context.Users.Update(conflictingUser);
                await context.SaveChangesAsync();
            }

            var adminUser = await context.Users.FirstOrDefaultAsync(u => u.Id == 1);
            if (adminUser == null)
            {
                adminUser = new User
                {
                    Name = "Administrador do Sistema",
                    Username = "admin",
                    Email = "vinireis197@gmail.com",
                    PasswordHash = passwordHasher.HashPassword("Silva321*"),
                    RoleId = adminRole.Id,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };
                context.Users.Add(adminUser);
            }
            else
            {
                adminUser.Email = "vinireis197@gmail.com";
                adminUser.PasswordHash = passwordHasher.HashPassword("Silva321*");
                context.Users.Update(adminUser);
            }
            await context.SaveChangesAsync();

            // 4. Payment Methods
            var paymentMethods = new[]
            {
                ("Dinheiro", "CASH"),
                ("Pix", "PIX"),
                ("Cartão de Débito", "DEBIT"),
                ("Cartão de Crédito", "CREDIT"),
                ("Transferência", "TRANSFER"),
                ("Crediário", "INSTALLMENT")
            };

            foreach (var (name, code) in paymentMethods)
            {
                if (!await context.PaymentMethods.AnyAsync(p => p.Code == code))
                {
                    context.PaymentMethods.Add(new PaymentMethod
                    {
                        Name = name,
                        Code = code,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow
                    });
                }
            }
            await context.SaveChangesAsync();

            // 5. Product Categories
            var categories = new[]
            {
                ("Freio", "Sistemas de frenagem, pastilhas, discos, manetes e cabos"),
                ("Câmbio", "Câmbios dianteiro/traseiro, passadores e alavancas"),
                ("Corrente", "Correntes de transmissão e elos de engate rápido"),
                ("Pneu", "Pneus para Mountain Bike, Speed, Urbana e Gravel"),
                ("Câmara", "Câmaras de ar de variadas medidas e válvulas"),
                ("Lubrificante", "Óleos de corrente, graxas especiais e desengraxantes"),
                ("Acessórios", "Suportes de caramanhola, bolsas, campainhas e retrovisores"),
                ("Capacetes", "Equipamentos de proteção individual para ciclistas"),
                ("Iluminação", "Faróis, sinalizadores dianteiros e traseiros recarregáveis"),
                ("Ferramentas", "Chaves Allen, extratores de corrente e bombas de ar")
            };

            foreach (var (name, desc) in categories)
            {
                if (!await context.ProductCategories.AnyAsync(c => c.Name == name))
                {
                    context.ProductCategories.Add(new ProductCategory
                    {
                        Name = name,
                        Description = desc,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow
                    });
                }
            }
            await context.SaveChangesAsync();

            // 6. Workshop Services
            var services = new (string Name, string Description, decimal Cost, decimal Sale, int Minutes)[]
            {
                ("Regulagem de Câmbio", "Ajuste fino de trocas dianteiras e traseiras, limites H/L e tensão", 15.00m, 50.00m, 30),
                ("Troca de Corrente", "Instalação e dimensionamento de corrente nova com elo mestre", 10.00m, 35.00m, 20),
                ("Troca de Pneu e Câmara", "Substituição do pneu ou câmara com conferência de fita de aro", 8.00m, 25.00m, 15),
                ("Revisão Completa Geral", "Desmontagem completa, limpeza por ultrassom, lubrificação de cubos, movimento central e caixa de direção", 60.00m, 220.00m, 180),
                ("Sangria de Freio Hidráulico", "Troca do fluido mineral/DOT e eliminação de bolhas de ar no circuito", 25.00m, 80.00m, 45),
                ("Instalação de Acessórios", "Instalação e fixação segura de bagageiros, suportes ou computadores", 5.00m, 20.00m, 20),
                ("Montagem de Bicicleta na Caixa", "Montagem, lubrificação preventiva e regulagem completa de bike nova", 40.00m, 150.00m, 90),
                ("Alinhamento de Roda / Centralização", "Tensionamento de raios e eliminação de saltos e empenos no aro", 15.00m, 45.00m, 40)
            };

            foreach (var s in services)
            {
                if (!await context.Services.AnyAsync(sv => sv.Name == s.Name))
                {
                    context.Services.Add(new Service
                    {
                        Name = s.Name,
                        Description = s.Description,
                        CostPrice = s.Cost,
                        SalePrice = s.Sale,
                        EstimatedTimeMinutes = s.Minutes,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow
                    });
                }
            }
            await context.SaveChangesAsync();

            // 7. Seed Sample Supplier, Products, Customer & Bicycle
            if (!await context.Suppliers.AnyAsync())
            {
                var supplier = new Supplier
                {
                    CorporateName = "Distribuidora Nacional de Bicicletas e Peças Ltda",
                    TradeName = "Ciclo Peças Brasil",
                    CpfCnpj = "12.345.678/0001-90",
                    Phone = "(11) 3222-1000",
                    Email = "contato@ciclopecas.com.br",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };
                context.Suppliers.Add(supplier);
                await context.SaveChangesAsync();

                var camaraCat = await context.ProductCategories.FirstAsync(c => c.Name == "Câmara");
                var freioCat = await context.ProductCategories.FirstAsync(c => c.Name == "Freio");
                var lubrCat = await context.ProductCategories.FirstAsync(c => c.Name == "Lubrificante");
                var correnteCat = await context.ProductCategories.FirstAsync(c => c.Name == "Corrente");

                var sampleProducts = new[]
                {
                    new Product
                    {
                        Sku = "CAM-29-PV",
                        Barcode = "7891234567890",
                        Name = "Câmara de Ar Aro 29 Válvula Presta 48mm",
                        Description = "Borracha butílica de alta durabilidade para pneus 29x1.95 até 29x2.35",
                        ProductCategoryId = camaraCat.Id,
                        SupplierId = supplier.Id,
                        CostPrice = 14.50m,
                        SalePrice = 35.00m,
                        StockQuantity = 45m,
                        MinimumStock = 10m,
                        Unit = UnitOfMeasure.UN,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow
                    },
                    new Product
                    {
                        Sku = "PAS-SHI-B01S",
                        Barcode = "7891234567891",
                        Name = "Pastilha de Freio a Disco Shimano B01S / B03S / B05S Resina",
                        Description = "Pastilha original Shimano de composto orgânico resinoso com mola",
                        ProductCategoryId = freioCat.Id,
                        SupplierId = supplier.Id,
                        CostPrice = 28.00m,
                        SalePrice = 65.00m,
                        StockQuantity = 25m,
                        MinimumStock = 8m,
                        Unit = UnitOfMeasure.PAR,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow
                    },
                    new Product
                    {
                        Sku = "LUB-CER-120",
                        Barcode = "7891234567892",
                        Name = "Lubrificante de Corrente a Base de Cera 120ml",
                        Description = "Fórmula biodegradável com PTFE para clima seco e tempo chuvoso",
                        ProductCategoryId = lubrCat.Id,
                        SupplierId = supplier.Id,
                        CostPrice = 22.00m,
                        SalePrice = 55.00m,
                        StockQuantity = 18m,
                        MinimumStock = 5m,
                        Unit = UnitOfMeasure.UN,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow
                    },
                    new Product
                    {
                        Sku = "COR-SHI-12V",
                        Barcode = "7891234567893",
                        Name = "Corrente Shimano Deore 12 Velocidades CN-M6100 com Quick-Link",
                        Description = "Corrente de 126 elos tecnologia Dynamic Flow Chain Engagement",
                        ProductCategoryId = correnteCat.Id,
                        SupplierId = supplier.Id,
                        CostPrice = 120.00m,
                        SalePrice = 240.00m,
                        StockQuantity = 12m,
                        MinimumStock = 4m,
                        Unit = UnitOfMeasure.UN,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow
                    }
                };

                context.Products.AddRange(sampleProducts);
                await context.SaveChangesAsync();

                foreach (var p in sampleProducts)
                {
                    context.StockMovements.Add(new StockMovement
                    {
                        ProductId = p.Id,
                        Type = StockMovementType.InitialStock,
                        Quantity = p.StockQuantity,
                        PreviousStock = 0,
                        NewStock = p.StockQuantity,
                        UnitCost = p.CostPrice,
                        ReferenceType = "InitialStock",
                        Description = "Carga inicial de estoque demonstrativo",
                        CreatedByUserId = adminUser.Id,
                        CreatedAt = DateTime.UtcNow
                    });
                }
                await context.SaveChangesAsync();
            }

            // Normalizar todos os produtos existentes para numeração sequencial (1, 2, 3...)
            var allExistingProducts = await context.Products.OrderBy(p => p.Id).ToListAsync();
            bool prodsUpdated = false;
            foreach (var prod in allExistingProducts)
            {
                var expectedCode = prod.Id.ToString();
                if (prod.Sku != expectedCode)
                {
                    prod.Sku = expectedCode;
                    prodsUpdated = true;
                }
            }
            if (prodsUpdated)
            {
                await context.SaveChangesAsync();
            }

            // 8. Sample Customer & Bicycle
            if (!await context.Customers.AnyAsync())
            {
                var customer = new Customer
                {
                    Name = "Carlos Eduardo Ferreira",
                    CpfCnpj = "123.456.789-00",
                    CellPhone = "(11) 98765-4321",
                    Email = "carlos.eduardo@gmail.com",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    Address = new Address
                    {
                        ZipCode = "01310-100",
                        Street = "Avenida Paulista",
                        Number = "1578",
                        Neighborhood = "Bela Vista",
                        City = "São Paulo",
                        State = "SP",
                        CreatedAt = DateTime.UtcNow
                    }
                };
                context.Customers.Add(customer);
                await context.SaveChangesAsync();

                var bike = new Bicycle
                {
                    CustomerId = customer.Id,
                    Brand = "Specialized",
                    Model = "Chisel Comp 29",
                    Color = "Azul Metálico",
                    FrameSize = "L (19\")",
                    SerialNumber = "WSBC604123456X",
                    BikeType = BikeType.MountainBike,
                    Notes = "Grupo Shimano Deore 12v, suspensão RockShox Judy Silver",
                    CreatedAt = DateTime.UtcNow
                };
                context.Bicycles.Add(bike);
                await context.SaveChangesAsync();
            }

            // 9. Initial Workshop Settings (if none exists)
            if (!await context.WorkshopSettings.AnyAsync())
            {
                var address = new Address
                {
                    Street = "Rua Principal",
                    Number = "100",
                    Neighborhood = "Centro",
                    City = "Passos",
                    State = "MG",
                    ZipCode = "37900000",
                    CreatedAt = DateTime.UtcNow
                };
                context.Addresses.Add(address);
                await context.SaveChangesAsync();

                context.WorkshopSettings.Add(new WorkshopSettings
                {
                    CompanyName = "Oficina Bike",
                    TradeName = "Oficina Bike",
                    CorporateName = "Oficina Bike Manutenção e Peças Ltda",
                    CpfCnpj = "12345678000190",
                    Phone = "3535210000",
                    WhatsApp = "35999990000",
                    Email = "contato@oficinabike.com.br",
                    AddressId = address.Id,
                    Address = address,
                    FooterMessage = "Obrigado pela preferência! Volte sempre.",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                });
                await context.SaveChangesAsync();
            }
        }
    }
}
