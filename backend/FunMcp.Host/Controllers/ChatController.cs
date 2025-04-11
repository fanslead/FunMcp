namespace FunMcp.Host.Controllers;

[Route("api/[controller]")]
[ApiController]
public class ChatController(FunMcpDbContext dbContext, McpServerState mcpServerState, IMemoryCache memoryCache, IAIClientFactory aiClientFactory) : ControllerBase
{
    [HttpPost]
    public async Task<IAsyncEnumerable<ChatResponseUpdate>> ChatAsync([FromBody] ChatRequestDto chatRequest)
    {
        var application = await CheckApiKey();

        var agent = await GetAgentAsync(chatRequest.AgentId, application!.Id);

        var mcpServerIds = await GetMcpServerIds(agent!.Id);

        var tools = mcpServerIds?.SelectMany(x => mcpServerState.McpServerTools[x]).ToList();

        var chatClient = aiClientFactory.CreateChatClient(agent!.AIServer);

        var chatMessages = new List<ChatMessage>()
        {
            new(ChatRole.System, agent.SystemPrompt)
        };

        chatMessages.AddRange([.. chatRequest.ChatMessages
            .Where(x => !x.Role.Equals("system", StringComparison.OrdinalIgnoreCase))
            .Select(x => new ChatMessage(new ChatRole(x.Role), x.Content))]);

        var chatOptions = new ChatOptions
        {
            ModelId = agent.ModelId,
            Tools = [.. tools ?? []]
        };

        return chatClient.GetStreamingResponseAsync(chatMessages, chatOptions);
    }

    private async Task<List<string>> GetMcpServerIds(string agentId)
    {
        var mcpServerIds = await memoryCache.GetOrCreateAsync(agentId, async entry =>
        {
            entry.SetAbsoluteExpiration(TimeSpan.FromMinutes(5));
            var agentMcpServers = await dbContext.AgentMcpServers
                .Where(x => x.AgentId == agentId)
                .Select(x => x.McpServerId)
                .ToListAsync();
            return agentMcpServers;
        });
        return mcpServerIds ?? [];
    }

    private async Task<Agent?> GetAgentAsync(string agentId, string applicationId)
    {
        var agent = await memoryCache.GetOrCreateAsync($"{applicationId}-{agentId}", async entry =>
        {
            entry.SetAbsoluteExpiration(TimeSpan.FromMinutes(5));
            var agent = await dbContext.Agents.FirstOrDefaultAsync(x => x.Id == agentId && x.ApplicationId == applicationId);
            if (agent == null)
            {
                throw new UnauthorizedAccessException();
            }
            return agent;
        });

        return agent;
    }

    private async Task<Application?> CheckApiKey()
    {
        var apiKey = HttpContext.Request.Headers["api-key"].ToString();

        var application = await memoryCache.GetOrCreateAsync(apiKey, async entry =>
        {
            entry.SetAbsoluteExpiration(TimeSpan.FromMinutes(5));
            var application = await dbContext.Applications.FirstOrDefaultAsync(x => x.ApiKey == apiKey);
            if (application == null)
            {
                throw new UnauthorizedAccessException();
            }
            return application;
        });

        return application;
    }
}
