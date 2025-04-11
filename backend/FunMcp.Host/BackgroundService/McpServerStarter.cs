namespace FunMcp.Host.BackgroundService;

public class McpServerStarter(IServiceProvider serviceProvider, McpServerState mcpServerState, ILogger<McpServerStarter> logger) : IHostedService
{
    public async Task StartAsync(CancellationToken cancellationToken)
    {
        logger.LogInformation("Starting McpServerStarter...");
        using var scope = serviceProvider.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<FunMcpDbContext>();
        var mcpServerInfos = await dbContext.McpServers.Where(x => x.Enable).ToListAsync();

        foreach (var mcpServerInfo in mcpServerInfos)
        {
            try
            {
                if (mcpServerInfo.TransportType.Equals("stdio", StringComparison.OrdinalIgnoreCase))
                {
                    var (client, tools) = await mcpServerState.CreateStdioAsync(mcpServerInfo.Id, new StdioClientTransport(new StdioClientTransportOptions
                    {
                        Name = mcpServerInfo.Name,
                        Command = mcpServerInfo.Command!,
                        Arguments = mcpServerInfo.Arguments,
                        EnvironmentVariables = mcpServerInfo.EnvironmentVariables,
                    }), cancellationToken: cancellationToken);

                    logger.LogInformation("Connected to stdio server {ServerId} : {ServerName} with tools: {Tools}", mcpServerInfo.Id, mcpServerInfo.Name, string.Join(",", tools.Select(x => x.Name)));

                }
                else if (mcpServerInfo.TransportType.Equals("sse", StringComparison.OrdinalIgnoreCase))
                {
                    var (client, tools) = await mcpServerState.CreateSseAsync(mcpServerInfo.Id, new SseClientTransport(new SseClientTransportOptions
                    {
                        Name = mcpServerInfo.Name,
                        Endpoint = new Uri(mcpServerInfo.Endpoint!),
                        AdditionalHeaders = mcpServerInfo.AdditionalHeaders,
                        MaxReconnectAttempts = mcpServerInfo.MaxReconnectAttempts ?? 3,
                        ReconnectDelay = mcpServerInfo.ReconnectDelay.HasValue ? TimeSpan.FromSeconds(mcpServerInfo.ReconnectDelay.Value) : TimeSpan.FromSeconds(5),
                        ConnectionTimeout = mcpServerInfo.ConnectionTimeout.HasValue ? TimeSpan.FromSeconds(mcpServerInfo.ConnectionTimeout.Value) : TimeSpan.FromSeconds(30),
                    }), cancellationToken: cancellationToken);

                    logger.LogInformation("Connected to sse server {ServerId} : {ServerName} with tools: {Tools}", mcpServerInfo.Id, mcpServerInfo.Name, string.Join(",", tools.Select(x => x.Name)));
                }
            }
            catch(Exception ex)
            {
                logger.LogError(ex, "Failed to start server {ServerId} : {ServerName}", mcpServerInfo.Id, mcpServerInfo.Name);
            }
        }
        logger.LogInformation("McpServerStarter started with {Count} servers", mcpServerInfos.Count);
    }

    public async Task StopAsync(CancellationToken cancellationToken)
    {
        foreach (var server in mcpServerState.McpServers.Values)
        {
            await server.DisposeAsync();
        }
    }
}
