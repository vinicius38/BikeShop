using System.Linq;
using FluentValidation;
using OficinaBike.Application.DTOs;
using OficinaBike.Domain.Enums;

namespace OficinaBike.Application.Validators
{
    public class CreateCustomerRequestValidator : AbstractValidator<CreateCustomerRequest>
    {
        public CreateCustomerRequestValidator()
        {
            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("O nome do cliente é obrigatório.")
                .MaximumLength(150).WithMessage("O nome não pode exceder 150 caracteres.");

            When(x => !string.IsNullOrWhiteSpace(x.Email), () =>
            {
                RuleFor(x => x.Email)
                    .EmailAddress().WithMessage("O e-mail informado é inválido.")
                    .MaximumLength(100).WithMessage("O e-mail não pode exceder 100 caracteres.");
            });

            When(x => !string.IsNullOrWhiteSpace(x.CpfCnpj), () =>
            {
                RuleFor(x => x.CpfCnpj)
                    .Must(IsValidCpfOrCnpj).WithMessage("CPF ou CNPJ inválido.");
            });
        }

        private static bool IsValidCpfOrCnpj(string? cpfCnpj)
        {
            if (string.IsNullOrWhiteSpace(cpfCnpj)) return true;
            var clean = new string(cpfCnpj.Where(char.IsDigit).ToArray());
            return clean.Length == 11 || clean.Length == 14;
        }
    }

    public class CreateProductRequestValidator : AbstractValidator<CreateProductRequest>
    {
        public CreateProductRequestValidator()
        {
            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("O nome do produto é obrigatório.")
                .MaximumLength(150).WithMessage("O nome não pode exceder 150 caracteres.");

            RuleFor(x => x.ProductCategoryId)
                .GreaterThan(0).WithMessage("A categoria do produto é obrigatória.");

            RuleFor(x => x.CostPrice)
                .GreaterThanOrEqualTo(0).WithMessage("O preço de custo não pode ser negativo.");

            RuleFor(x => x.SalePrice)
                .GreaterThanOrEqualTo(0).WithMessage("O preço de venda não pode ser negativo.");

            RuleFor(x => x.InitialStock)
                .GreaterThanOrEqualTo(0).WithMessage("O estoque inicial não pode ser negativo.");

            RuleFor(x => x.MinimumStock)
                .GreaterThanOrEqualTo(0).WithMessage("O estoque mínimo não pode ser negativo.");
        }
    }

    public class CreateServiceRequestValidator : AbstractValidator<CreateServiceRequest>
    {
        public CreateServiceRequestValidator()
        {
            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("O nome do serviço é obrigatório.")
                .MaximumLength(150).WithMessage("O nome não pode exceder 150 caracteres.");

            RuleFor(x => x.CostPrice)
                .GreaterThanOrEqualTo(0).WithMessage("O preço de custo não pode ser negativo.");

            RuleFor(x => x.SalePrice)
                .GreaterThanOrEqualTo(0).WithMessage("O preço de venda não pode ser negativo.");

            RuleFor(x => x.EstimatedTimeMinutes)
                .GreaterThanOrEqualTo(0).WithMessage("O tempo estimado não pode ser negativo.");
        }
    }

    public class CreateWorkOrderRequestValidator : AbstractValidator<CreateWorkOrderRequest>
    {
        public CreateWorkOrderRequestValidator()
        {
            RuleFor(x => x.CustomerId)
                .GreaterThan(0).WithMessage("O cliente da Ordem de Serviço é obrigatório.");

            RuleFor(x => x.BicycleId)
                .GreaterThan(0).WithMessage("A bicicleta da Ordem de Serviço é obrigatória.");

            RuleFor(x => x.Description)
                .NotEmpty().WithMessage("A descrição ou relato inicial da Ordem de Serviço é obrigatória.")
                .MaximumLength(500).WithMessage("A descrição não pode exceder 500 caracteres.");

            RuleFor(x => x.Discount)
                .GreaterThanOrEqualTo(0).WithMessage("O desconto não pode ser negativo.");

            RuleFor(x => x.AdditionalCharge)
                .GreaterThanOrEqualTo(0).WithMessage("O acréscimo não pode ser negativo.");

            RuleForEach(x => x.Items).SetValidator(new AddWorkOrderItemRequestValidator());
        }
    }

    public class AddWorkOrderItemRequestValidator : AbstractValidator<AddWorkOrderItemRequest>
    {
        public AddWorkOrderItemRequestValidator()
        {
            RuleFor(x => x.Quantity)
                .GreaterThan(0).WithMessage("A quantidade do item deve ser estritamente maior que zero.");

            RuleFor(x => x.Discount)
                .GreaterThanOrEqualTo(0).WithMessage("O desconto do item não pode ser negativo.");

            When(x => x.ItemType == ItemType.Product, () =>
            {
                RuleFor(x => x.ProductId)
                    .NotNull().GreaterThan(0).WithMessage("O produto deve ser informado.");
            });

            When(x => x.ItemType == ItemType.Service, () =>
            {
                RuleFor(x => x.ServiceId)
                    .NotNull().GreaterThan(0).WithMessage("O serviço deve ser informado.");
            });
        }
    }

    public class CreateSaleRequestValidator : AbstractValidator<CreateSaleRequest>
    {
        public CreateSaleRequestValidator()
        {
            RuleFor(x => x.CustomerId)
                .GreaterThan(0)
                .When(x => x.CustomerId.HasValue)
                .WithMessage("O cliente informado é inválido.");

            RuleFor(x => x.Items)
                .NotEmpty().WithMessage("A venda deve possuir pelo menos um item.");

            RuleForEach(x => x.Items).ChildRules(item =>
            {
                item.RuleFor(i => i.Quantity)
                    .GreaterThan(0).WithMessage("A quantidade do item deve ser maior que zero.");
                item.RuleFor(i => i.Discount)
                    .GreaterThanOrEqualTo(0).WithMessage("O desconto não pode ser negativo.");
            });

            RuleFor(x => x.Discount)
                .GreaterThanOrEqualTo(0).WithMessage("O desconto da venda não pode ser negativo.");

            RuleFor(x => x.AdditionalCharge)
                .GreaterThanOrEqualTo(0).WithMessage("O acréscimo da venda não pode ser negativo.");
        }
    }

    public class AdjustStockRequestValidator : AbstractValidator<AdjustStockRequest>
    {
        public AdjustStockRequestValidator()
        {
            RuleFor(x => x.ProductId)
                .GreaterThan(0).WithMessage("O produto é obrigatório.");

            RuleFor(x => x.Quantity)
                .NotEqual(0).WithMessage("A quantidade de ajuste não pode ser zero.");

            RuleFor(x => x.Reason)
                .NotEmpty().WithMessage("O motivo do ajuste de estoque é obrigatório.")
                .MaximumLength(250).WithMessage("O motivo não pode exceder 250 caracteres.");
        }
    }
}
