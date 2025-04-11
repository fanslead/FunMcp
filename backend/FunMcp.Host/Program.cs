using FunMcp.Host.Scalar;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.Configure<AIConfigOptions>(config => builder.Configuration.GetSection("AIConfig").Bind(config));

builder.Services.AddDbContext<FunMcpDbContext>(options =>
{
    options.UseInMemoryDatabase("FunMcpDb");
});

builder.Services.AddExceptionHandler<ExceptionHandler>();
builder.Services.AddProblemDetails();

builder.Services.AddSingleton<McpServerState>();
builder.Services.AddSingleton<IAIClientFactory, AIClientFactory>();

builder.Services.AddMemoryCache();
builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi(opt =>
{
    opt.AddDocumentTransformer<BearerSecuritySchemeTransformer>();
});

builder.Services.AddAuthentication(option => {
    option.AddScheme<TokenAuthenticationHandler>("Bearer", "Bearer Token");
    option.DefaultAuthenticateScheme = "Bearer";
    option.DefaultForbidScheme = "Bearer";
    option.DefaultChallengeScheme = "Bearer";
});

builder.Services.AddHostedService<McpServerStarter>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi()
        .CacheOutput();
    app.MapScalarApiReference("/doc");
}

app.UseExceptionHandler();

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
