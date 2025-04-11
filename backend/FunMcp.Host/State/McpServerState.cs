namespace FunMcp.Host.State;

public class McpServerState(ILoggerFactory loggerFactory)
{
    public readonly IDictionary<string, IMcpClient> McpServers = new Dictionary<string, IMcpClient>();

    public readonly IDictionary<string, IList<McpClientTool>> McpServerTools = new Dictionary<string, IList<McpClientTool>>();

    public async Task<(IMcpClient, IList<McpClientTool>)> CreateStdioAsync(string id, StdioClientTransport stdioClientTransport, CancellationToken cancellationToken = default)
    {
        if (McpServers.ContainsKey(id))
        {
            return (McpServers[id], McpServerTools[id]);
        }

        var client = await McpClientFactory.CreateAsync(stdioClientTransport, loggerFactory: loggerFactory, cancellationToken: cancellationToken);

        var tools = await client.ListToolsAsync();

        McpServers[id] = client;
        McpServerTools[id] = tools;

        return (client, tools);
    }

    public async Task<(IMcpClient, IList<McpClientTool>)> CreateSseAsync(string id, SseClientTransport sseClientTransport, CancellationToken cancellationToken = default)
    {
        if (McpServers.ContainsKey(id))
        {
            return (McpServers[id], McpServerTools[id]);
        }

        var client = await McpClientFactory.CreateAsync(sseClientTransport, loggerFactory: loggerFactory, cancellationToken: cancellationToken);

        var tools = await client.ListToolsAsync();

        McpServers[id] = client;
        McpServerTools[id] = tools;

        return (client, tools);
    }

    public async Task RemoveAsync(string id)
    {
        if (McpServers.TryGetValue(id, out var client))
        {
            await client.DisposeAsync();
            McpServers.Remove(id);
            McpServerTools.Remove(id);
        }
    }
}
