using FunMcp.Host.Scalar;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.Configure<AIOptions>(builder.Configuration.GetSection("AIConfig"));

builder.Services.AddDbContext<FunMcpDbContext>(options =>
{
    options.UseSqlite("Data Source=fun-mcp.db");
});

builder.Services.AddExceptionHandler<ExceptionHandler>();
builder.Services.AddProblemDetails();

builder.Services.AddSingleton<McpServerState>();
builder.Services.AddSingleton<IAIClientFactory, AIClientFactory>();

builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
});

builder.Services.AddDistributedMemoryCache();
builder.Services.AddHttpContextAccessor();
builder.Services.AddTransient<ChatService>();
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

builder.Services.AddCors();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi()
        .CacheOutput();
    app.MapScalarApiReference("/doc");
}

app.UseCors(app =>
{
    app.SetIsOriginAllowed(_ => true)
        .AllowAnyOrigin()
       .AllowAnyMethod()
       .AllowAnyHeader();
});

app.UseExceptionHandler();

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapPost("/api/chat", (ChatRequestDto chatRequest, ChatService chatService, CancellationToken cancellationToken) => 
{
   return TypedResults.ServerSentEvents(chatService.ChatAsync(chatRequest));
});

app.MapControllers();

app.Run();
