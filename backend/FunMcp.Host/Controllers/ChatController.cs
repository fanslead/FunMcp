namespace FunMcp.Host.Controllers;

[Route("api/[controller]")]
[ApiController]
public class ChatController(FunMcpDbContext dbContext, McpServerState mcpServerState, IMemoryCache memoryCache, IAIClientFactory aiClientFactory) : ControllerBase
{
    [HttpPost]
    public async Task<IAsyncEnumerable<ChatResponseUpdate>> ChatAsync([FromBody] ChatRequestDto chatRequest, CancellationToken cancellationToken = default)
    {
        var application = await CheckApiKey();

        var agent = await GetAgentAsync(chatRequest.AgentId, application!.Id);

        var dbMcpServers = await GetMcpServers(agent!.Id);

        var tools = new List<McpClientTool>(); 

        foreach (var dbMcpServer in dbMcpServers)
        {
            var mcpTools = mcpServerState.McpServerTools[dbMcpServer.McpServerId].ToList();
            if(dbMcpServer.McpServerTools.Count > 0)
            {
                mcpTools = mcpTools.Where(t => dbMcpServer.McpServerTools.Contains(t.Name)).ToList();
            }
            tools.AddRange(mcpTools);
        }

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
            Temperature = agent.Temperature,
            TopP = agent.TopP,
            MaxOutputTokens = agent.MaxOutputTokens,
            Tools = [.. tools ?? []]
        };

        return chatClient.GetStreamingResponseAsync(chatMessages, chatOptions, cancellationToken);
    }

    [HttpGet]
    [Route("agent/tools/{agentId}")]
    public async Task<Dictionary<string, IList<McpClientToolDto>>> GetAgentTools(string agentId)
    {
        var application = await CheckApiKey();

        var agent = await GetAgentAsync(agentId, application!.Id);

        var dbMcpServers = await GetMcpServers(agent!.Id);

        var mcpServerIds = dbMcpServers.Select(x => x.McpServerId);

        var mcpServers = (await dbContext.McpServers.Where(x => mcpServerIds.Contains(x.Id)).ToListAsync())
            .ToDictionary(x => x.Id, x => x);

        var toolsDic = new Dictionary<string, IList<McpClientToolDto>>();
        foreach (var mcpServerId in mcpServerIds)
        {
            if (mcpServerState.McpServerTools.TryGetValue(mcpServerId, out var tools))
            {
                var dbMcpServer = dbMcpServers.First(x => x.McpServerId == mcpServerId);

                if (dbMcpServer.McpServerTools.Count > 0)
                {
                    tools = tools.Where(t => dbMcpServer.McpServerTools.Contains(t.Name)).ToList();
                }

                toolsDic[mcpServers[mcpServerId].Name] = tools.Select(x => new McpClientToolDto { Name = x.Name, Description = x.Description }).ToList();
            }
        }

        return toolsDic;
    }

    [HttpGet]
    [Route("agent/tools/{agentId}/{mcpId}")]
    public async Task<IList<McpClientToolDto>> GetAgentTools(string agentId, string mcpId)
    {
        var application = await CheckApiKey();

        var agent = await GetAgentAsync(agentId, application!.Id);

        var dbMcpServers = await GetMcpServers(agent!.Id);

        var mcpServerIds = dbMcpServers.Select(x => x.McpServerId);

        if (mcpServerIds.Contains(mcpId))
        {
            if (mcpServerState.McpServerTools.TryGetValue(mcpId, out var tools))
            {
                var dbMcpServer = dbMcpServers.First(x => x.McpServerId == mcpId);

                if (dbMcpServer.McpServerTools.Count > 0)
                {
                    tools = tools.Where(t => dbMcpServer.McpServerTools.Contains(t.Name)).ToList();
                }

                return [.. tools.Select(x => new McpClientToolDto { Name = x.Name, Description = x.Description })];
            }

        }

        return [];
    }

    [HttpGet]
    [Route("agent/mcp/{agentId}")]
    public async Task<Dictionary<string, McpServerInfoDto>> GetAgentMcp(string agentId)
    {
        var application = await CheckApiKey();

        var agent = await GetAgentAsync(agentId, application!.Id);

        var dbMcpServers = await GetMcpServers(agent!.Id);

        var mcpServerIds = dbMcpServers.Select(x => x.McpServerId);

        var mcpServers = (await dbContext.McpServers.Where(x => mcpServerIds.Contains(x.Id)).ToListAsync())
            .ToDictionary(x => x.Id, x => x);

        var mcpDic = new Dictionary<string, McpServerInfoDto>();
        foreach (var dbMcpServer in dbMcpServers)
        {
            if (mcpServerState.McpServers.TryGetValue(dbMcpServer.McpServerId, out var mcpServer))
            {
                mcpDic[mcpServers[dbMcpServer.McpServerId].Name] = new McpServerInfoDto { Id = mcpServers[dbMcpServer.McpServerId].Id, Name = mcpServer.ServerInfo.Name, Version = mcpServer.ServerInfo.Version };
            }
        }

        return mcpDic;
    }

    private async Task<List<AgentMcpServer>> GetMcpServers(string agentId)
    {
        var mcpServers = await memoryCache.GetOrCreateAsync(agentId, async entry =>
        {
            entry.SetSlidingExpiration(TimeSpan.FromMinutes(5));
            var agentMcpServers = await dbContext.AgentMcpServers
                .Where(x => x.AgentId == agentId)
                .ToListAsync();
            return agentMcpServers;
        });
        return mcpServers ?? [];
    }

    private async Task<Agent?> GetAgentAsync(string agentId, string applicationId)
    {
        var agent = await memoryCache.GetOrCreateAsync($"{applicationId}-{agentId}", async entry =>
        {
            entry.SetSlidingExpiration(TimeSpan.FromMinutes(5));
            var agent = await dbContext.Agents.FirstOrDefaultAsync(x => x.Id == agentId && x.ApplicationId == applicationId);
            
            return agent;
        });

        return agent ?? throw new UnauthorizedAccessException();
    }

    private async Task<Application?> CheckApiKey()
    {
        var apiKey = HttpContext.Request.Headers["api-key"].ToString();

        var application = await memoryCache.GetOrCreateAsync(apiKey, async entry =>
        {
            entry.SetSlidingExpiration(TimeSpan.FromMinutes(5));
            var application = await dbContext.Applications.FirstOrDefaultAsync(x => x.ApiKey == apiKey);
            
            return application;
        });

        return application ?? throw new UnauthorizedAccessException();
    }
}
