using System;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using FluentValidation;
using OficinaBike.Application.DTOs;

namespace OficinaBike.Application.Validators
{
    public class CreateWorkshopSettingsRequestValidator : AbstractValidator<CreateWorkshopSettingsRequest>
    {
        private static readonly string[] ValidUfs = new[]
        {
            "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
            "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
            "RS", "RO", "RR", "SC", "SP", "SE", "TO"
        };

        public CreateWorkshopSettingsRequestValidator()
        {
            RuleFor(x => x.CompanyName)
                .NotEmpty().WithMessage("O nome da oficina é obrigatório.")
                .MaximumLength(150).WithMessage("O nome da oficina não pode exceder 150 caracteres.");

            RuleFor(x => x.TradeName)
                .NotEmpty().WithMessage("O nome fantasia é obrigatório.")
                .MaximumLength(150).WithMessage("O nome fantasia não pode exceder 150 caracteres.");

            RuleFor(x => x.CorporateName)
                .NotEmpty().WithMessage("A razão social é obrigatória.")
                .MaximumLength(150).WithMessage("A razão social não pode exceder 150 caracteres.");

            RuleFor(x => x.CpfCnpj)
                .Must(BeValidCpfOrCnpj).When(x => !string.IsNullOrWhiteSpace(x.CpfCnpj))
                .WithMessage("CPF ou CNPJ informado é inválido.");

            RuleFor(x => x.Email)
                .EmailAddress().When(x => !string.IsNullOrWhiteSpace(x.Email))
                .WithMessage("O e-mail informado possui formato inválido.")
                .MaximumLength(150).WithMessage("O e-mail não pode exceder 150 caracteres.");

            RuleFor(x => x.Phone)
                .Must(BeValidPhone).When(x => !string.IsNullOrWhiteSpace(x.Phone))
                .WithMessage("O telefone informado é inválido (deve conter 10 ou 11 dígitos numéricos).");

            RuleFor(x => x.WhatsApp)
                .Must(BeValidPhone).When(x => !string.IsNullOrWhiteSpace(x.WhatsApp))
                .WithMessage("O WhatsApp informado é inválido (deve conter 10 ou 11 dígitos numéricos).");

            RuleFor(x => x.ZipCode)
                .Must(BeValidZipCode).When(x => !string.IsNullOrWhiteSpace(x.ZipCode))
                .WithMessage("O CEP informado deve conter 8 dígitos.");

            RuleFor(x => x.State)
                .Must(BeValidState).When(x => !string.IsNullOrWhiteSpace(x.State))
                .WithMessage("O Estado (UF) informado é inválido.");

            RuleFor(x => x.FooterMessage)
                .MaximumLength(500).WithMessage("A mensagem de rodapé não pode exceder 500 caracteres.");

            RuleFor(x => x.AdditionalInformation)
                .MaximumLength(1000).WithMessage("As informações adicionais não podem exceder 1000 caracteres.");
        }

        private static bool BeValidCpfOrCnpj(string? value)
        {
            if (string.IsNullOrWhiteSpace(value)) return true;
            var clean = Regex.Replace(value, @"\D", "");
            if (clean.Length == 11) return IsValidCpf(clean);
            if (clean.Length == 14) return IsValidCnpj(clean);
            return false;
        }

        private static bool BeValidPhone(string? value)
        {
            if (string.IsNullOrWhiteSpace(value)) return true;
            var clean = Regex.Replace(value, @"\D", "");
            return clean.Length == 10 || clean.Length == 11;
        }

        private static bool BeValidZipCode(string? value)
        {
            if (string.IsNullOrWhiteSpace(value)) return true;
            var clean = Regex.Replace(value, @"\D", "");
            return clean.Length == 8;
        }

        private static bool BeValidState(string? value)
        {
            if (string.IsNullOrWhiteSpace(value)) return true;
            return ValidUfs.Contains(value.Trim().ToUpperInvariant());
        }

        private static bool IsValidCpf(string cpf)
        {
            if (cpf.Length != 11 || cpf.Distinct().Count() == 1) return false;
            int[] mult1 = { 10, 9, 8, 7, 6, 5, 4, 3, 2 };
            int[] mult2 = { 11, 10, 9, 8, 7, 6, 5, 4, 3, 2 };
            var temp = cpf.Substring(0, 9);
            var sum = 0;
            for (var i = 0; i < 9; i++) sum += (temp[i] - '0') * mult1[i];
            var rem = sum % 11;
            rem = rem < 2 ? 0 : 11 - rem;
            var digit = rem.ToString();
            temp += digit;
            sum = 0;
            for (var i = 0; i < 10; i++) sum += (temp[i] - '0') * mult2[i];
            rem = sum % 11;
            rem = rem < 2 ? 0 : 11 - rem;
            digit += rem.ToString();
            return cpf.EndsWith(digit);
        }

        private static bool IsValidCnpj(string cnpj)
        {
            if (cnpj.Length != 14 || cnpj.Distinct().Count() == 1) return false;
            int[] mult1 = { 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2 };
            int[] mult2 = { 6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2 };
            var temp = cnpj.Substring(0, 12);
            var sum = 0;
            for (var i = 0; i < 12; i++) sum += (temp[i] - '0') * mult1[i];
            var rem = sum % 11;
            rem = rem < 2 ? 0 : 11 - rem;
            var digit = rem.ToString();
            temp += digit;
            sum = 0;
            for (var i = 0; i < 13; i++) sum += (temp[i] - '0') * mult2[i];
            rem = sum % 11;
            rem = rem < 2 ? 0 : 11 - rem;
            digit += rem.ToString();
            return cnpj.EndsWith(digit);
        }
    }

    public class UpdateWorkshopSettingsRequestValidator : AbstractValidator<UpdateWorkshopSettingsRequest>
    {
        private static readonly string[] ValidUfs = new[]
        {
            "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
            "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
            "RS", "RO", "RR", "SC", "SP", "SE", "TO"
        };

        public UpdateWorkshopSettingsRequestValidator()
        {
            RuleFor(x => x.CompanyName)
                .NotEmpty().WithMessage("O nome da oficina é obrigatório.")
                .MaximumLength(150).WithMessage("O nome da oficina não pode exceder 150 caracteres.");

            RuleFor(x => x.TradeName)
                .NotEmpty().WithMessage("O nome fantasia é obrigatório.")
                .MaximumLength(150).WithMessage("O nome fantasia não pode exceder 150 caracteres.");

            RuleFor(x => x.CorporateName)
                .NotEmpty().WithMessage("A razão social é obrigatória.")
                .MaximumLength(150).WithMessage("A razão social não pode exceder 150 caracteres.");

            RuleFor(x => x.CpfCnpj)
                .Must(BeValidCpfOrCnpj).When(x => !string.IsNullOrWhiteSpace(x.CpfCnpj))
                .WithMessage("CPF ou CNPJ informado é inválido.");

            RuleFor(x => x.Email)
                .EmailAddress().When(x => !string.IsNullOrWhiteSpace(x.Email))
                .WithMessage("O e-mail informado possui formato inválido.")
                .MaximumLength(150).WithMessage("O e-mail não pode exceder 150 caracteres.");

            RuleFor(x => x.Phone)
                .Must(BeValidPhone).When(x => !string.IsNullOrWhiteSpace(x.Phone))
                .WithMessage("O telefone informado é inválido (deve conter 10 ou 11 dígitos numéricos).");

            RuleFor(x => x.WhatsApp)
                .Must(BeValidPhone).When(x => !string.IsNullOrWhiteSpace(x.WhatsApp))
                .WithMessage("O WhatsApp informado é inválido (deve conter 10 ou 11 dígitos numéricos).");

            RuleFor(x => x.ZipCode)
                .Must(BeValidZipCode).When(x => !string.IsNullOrWhiteSpace(x.ZipCode))
                .WithMessage("O CEP informado deve conter 8 dígitos.");

            RuleFor(x => x.State)
                .Must(BeValidState).When(x => !string.IsNullOrWhiteSpace(x.State))
                .WithMessage("O Estado (UF) informado é inválido.");

            RuleFor(x => x.FooterMessage)
                .MaximumLength(500).WithMessage("A mensagem de rodapé não pode exceder 500 caracteres.");

            RuleFor(x => x.AdditionalInformation)
                .MaximumLength(1000).WithMessage("As informações adicionais não podem exceder 1000 caracteres.");
        }

        private static bool BeValidCpfOrCnpj(string? value)
        {
            if (string.IsNullOrWhiteSpace(value)) return true;
            var clean = Regex.Replace(value, @"\D", "");
            if (clean.Length == 11) return IsValidCpf(clean);
            if (clean.Length == 14) return IsValidCnpj(clean);
            return false;
        }

        private static bool BeValidPhone(string? value)
        {
            if (string.IsNullOrWhiteSpace(value)) return true;
            var clean = Regex.Replace(value, @"\D", "");
            return clean.Length == 10 || clean.Length == 11;
        }

        private static bool BeValidZipCode(string? value)
        {
            if (string.IsNullOrWhiteSpace(value)) return true;
            var clean = Regex.Replace(value, @"\D", "");
            return clean.Length == 8;
        }

        private static bool BeValidState(string? value)
        {
            if (string.IsNullOrWhiteSpace(value)) return true;
            return ValidUfs.Contains(value.Trim().ToUpperInvariant());
        }

        private static bool IsValidCpf(string cpf)
        {
            if (cpf.Length != 11 || cpf.Distinct().Count() == 1) return false;
            int[] mult1 = { 10, 9, 8, 7, 6, 5, 4, 3, 2 };
            int[] mult2 = { 11, 10, 9, 8, 7, 6, 5, 4, 3, 2 };
            var temp = cpf.Substring(0, 9);
            var sum = 0;
            for (var i = 0; i < 9; i++) sum += (temp[i] - '0') * mult1[i];
            var rem = sum % 11;
            rem = rem < 2 ? 0 : 11 - rem;
            var digit = rem.ToString();
            temp += digit;
            sum = 0;
            for (var i = 0; i < 10; i++) sum += (temp[i] - '0') * mult2[i];
            rem = sum % 11;
            rem = rem < 2 ? 0 : 11 - rem;
            digit += rem.ToString();
            return cpf.EndsWith(digit);
        }

        private static bool IsValidCnpj(string cnpj)
        {
            if (cnpj.Length != 14 || cnpj.Distinct().Count() == 1) return false;
            int[] mult1 = { 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2 };
            int[] mult2 = { 6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2 };
            var temp = cnpj.Substring(0, 12);
            var sum = 0;
            for (var i = 0; i < 12; i++) sum += (temp[i] - '0') * mult1[i];
            var rem = sum % 11;
            rem = rem < 2 ? 0 : 11 - rem;
            var digit = rem.ToString();
            temp += digit;
            sum = 0;
            for (var i = 0; i < 13; i++) sum += (temp[i] - '0') * mult2[i];
            rem = sum % 11;
            rem = rem < 2 ? 0 : 11 - rem;
            digit += rem.ToString();
            return cnpj.EndsWith(digit);
        }
    }

    public static class LogoFileValidator
    {
        public const long MaxSizeBytes = 5 * 1024 * 1024; // 5 MB
        private static readonly string[] AllowedExtensions = { ".png", ".jpg", ".jpeg", ".webp" };
        private static readonly string[] AllowedContentTypes = { "image/png", "image/jpeg", "image/pjpeg", "image/webp" };

        public static (bool IsValid, string? ErrorMessage) Validate(Stream stream, string fileName, string contentType, long fileLength)
        {
            if (stream == null || fileLength <= 0)
            {
                return (false, "Nenhum arquivo de imagem foi enviado.");
            }

            if (fileLength > MaxSizeBytes)
            {
                return (false, "O tamanho da imagem excede o limite máximo permitido de 5 MB.");
            }

            var extension = Path.GetExtension(fileName).ToLowerInvariant();
            if (!AllowedExtensions.Contains(extension))
            {
                return (false, "Formato de arquivo não suportado. Utilize apenas imagens PNG, JPG, JPEG ou WEBP.");
            }

            if (!AllowedContentTypes.Contains(contentType.ToLowerInvariant()))
            {
                return (false, "Content-Type do arquivo não é permitido para upload de imagens.");
            }

            // Verify Magic Bytes
            var headerBytes = new byte[12];
            var originalPosition = stream.Position;
            if (stream.CanSeek)
            {
                stream.Position = 0;
            }
            var bytesRead = stream.Read(headerBytes, 0, headerBytes.Length);
            if (stream.CanSeek)
            {
                stream.Position = originalPosition;
            }

            if (bytesRead < 4)
            {
                return (false, "Arquivo corrompido ou inválido.");
            }

            // PNG check: 89 50 4E 47
            var isPng = headerBytes[0] == 0x89 && headerBytes[1] == 0x50 && headerBytes[2] == 0x4E && headerBytes[3] == 0x47;

            // JPEG check: FF D8 FF
            var isJpeg = headerBytes[0] == 0xFF && headerBytes[1] == 0xD8 && headerBytes[2] == 0xFF;

            // WEBP check: "RIFF" .... "WEBP"
            var isWebp = bytesRead >= 12 &&
                         headerBytes[0] == 0x52 && headerBytes[1] == 0x49 && headerBytes[2] == 0x46 && headerBytes[3] == 0x46 && // RIFF
                         headerBytes[8] == 0x57 && headerBytes[9] == 0x45 && headerBytes[10] == 0x42 && headerBytes[11] == 0x50; // WEBP

            if (!isPng && !isJpeg && !isWebp)
            {
                return (false, "O conteúdo do arquivo não corresponde a uma imagem válida nos formatos permitidos (PNG, JPEG ou WEBP).");
            }

            return (true, null);
        }
    }
}
