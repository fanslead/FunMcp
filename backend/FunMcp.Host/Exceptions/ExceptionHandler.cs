namespace FunMcp.Host.Exceptions;

public class ExceptionHandler : IExceptionHandler
{
    public ValueTask<bool> TryHandleAsync(HttpContext httpContext, System.Exception exception, CancellationToken cancellationToken)
    {
        if(exception is UnauthorizedAccessException)
        {
            httpContext.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return ValueTask.FromResult(true);
        }
        
        return ValueTask.FromResult(false);
    }
}
