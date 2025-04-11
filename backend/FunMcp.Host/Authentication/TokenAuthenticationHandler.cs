namespace FunMcp.Host.Authentication;

public class TokenAuthenticationHandler(ILogger<TokenAuthenticationHandler> logger, IConfiguration configuration) : IAuthenticationHandler
{
    private AuthenticationScheme _scheme;

    private HttpContext _context;

    public Task<AuthenticateResult> AuthenticateAsync()
    {
        string token = _context.Request.Headers["Authorization"];
        if (!string.IsNullOrEmpty(token))
        {
            var accessToken = configuration.GetSection("AccessToken").Get<string>();
            if(token.Replace("Bearer ", "").Equals(accessToken))
            {
                ClaimsIdentity identity = new("fun");

                identity.AddClaims([
                        new Claim(ClaimTypes.Name, "admin"),
                        new Claim(ClaimTypes.NameIdentifier,"9AC0565D-778F-45FB-BE0F-2BE8A380D5B5")
                    ]);
                var claimsPrincipal = new ClaimsPrincipal(identity);
                return Task.FromResult(AuthenticateResult.Success(new AuthenticationTicket(claimsPrincipal, null, _scheme.Name)));
            }
        }
        return Task.FromResult(AuthenticateResult.Fail("Authorization Fail."));
    }

    public Task ChallengeAsync(AuthenticationProperties? properties)
    {
        _context.Response.StatusCode = 401;
        return Task.CompletedTask;
    }

    public Task ForbidAsync(AuthenticationProperties? properties)
    {
        _context.Response.StatusCode = 403;
        return Task.CompletedTask;
    }

    public Task InitializeAsync(AuthenticationScheme scheme, HttpContext context)
    {
        logger.LogInformation(string.Format("Initialize scheme:{0}", scheme.DisplayName));
        _scheme = scheme;
        _context = context;
        return Task.CompletedTask;
    }
}
