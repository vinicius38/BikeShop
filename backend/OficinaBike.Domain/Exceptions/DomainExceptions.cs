using System;

namespace OficinaBike.Domain.Exceptions
{
    public class DomainException : Exception
    {
        public DomainException(string message) : base(message) { }
        public DomainException(string message, Exception innerException) : base(message, innerException) { }
    }

    public class NotFoundException : DomainException
    {
        public NotFoundException(string entityName, object key)
            : base($"{entityName} com identificador '{key}' não foi encontrado(a).") { }

        public NotFoundException(string message) : base(message) { }
    }

    public class BusinessRuleException : DomainException
    {
        public string? Code { get; }

        public BusinessRuleException(string message, string? code = null) : base(message)
        {
            Code = code;
        }
    }

    public class ConcurrencyException : DomainException
    {
        public ConcurrencyException(string message) : base(message) { }
    }
}
