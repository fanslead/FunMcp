namespace FunMcp.Host.Services;

public class ChatService(FunMcpDbContext dbContext, McpServerState mcpServerState, IMemoryCache memoryCache, IAIClientFactory aiClientFactory, IHttpContextAccessor httpContextAccessor)
{
    private static string MCP_PROMPT = """

        ## 工具调用规则
        1. 请持续调用工具直至完美完成用户的任务，停止调用工具后，系统会自动交还控制权给用户。请只有在确定问题已解决后才终止调用工具。
        2. 请善加利用你的工具收集相关信息，绝对不要猜测或编造答案。
        3. 「思考和规划」是一个系统工具，在每次调用其他任务工具之前，你必须**首先调用思考和规划工具**：针对用户的任务详细思考和规划，并对之前工具调用的结果进行深入反思（如有），输出的顺序是thought, plan, action, thoughtNumber。
        - 「思考和规划」工具不会获取新信息或更改数据库，只会将你的想法保存到记忆中。
        - 思考完成之后不需要等待工具返回，你可以继续调用其他任务工具，你一次可以调用多个任务工具。
        
        """;

    public async IAsyncEnumerable<ChatResponseUpdate> ChatAsync(ChatRequestDto chatRequest, CancellationToken cancellationToken = default)
    {
        var application = await CheckApiKey();
        var agent = await GetAgentAsync(chatRequest.AgentId, application!.Id);

        var dbMcpServers = await GetMcpServers(agent!.Id);

        var tools = new List<McpClientTool>();

        var systemPrompt = new StringBuilder(agent!.SystemPrompt);
        foreach (var dbMcpServer in dbMcpServers)
        {
            var mcpTools = mcpServerState.McpServerTools[dbMcpServer.McpServerId].ToList();
            if (dbMcpServer.McpServerTools.Count > 0)
            {
                mcpTools = mcpTools.Where(t => dbMcpServer.McpServerTools.Contains(t.Name)).ToList();
            }
            tools.AddRange(mcpTools);
        }

        if (tools.Count > 0)
        {
            systemPrompt.AppendLine(MCP_PROMPT);
        }

        var chatClient = aiClientFactory.CreateChatClient(agent!.AIServer);

        var chatMessages = new List<ChatMessage>()
        {
            new(ChatRole.System, systemPrompt.ToString())
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
            Tools = [.. tools ?? [], Thinking.GetTool()]
        };

        var response = chatClient.GetStreamingResponseAsync(chatMessages, chatOptions, cancellationToken);

        await foreach (var update in response.WithCancellation(cancellationToken))
        {
            yield return update;
        }
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
        var apiKey = httpContextAccessor.HttpContext.Request.Headers["api-key"].ToString();

        var application = await memoryCache.GetOrCreateAsync(apiKey, async entry =>
        {
            entry.SetSlidingExpiration(TimeSpan.FromMinutes(5));
            var application = await dbContext.Applications.FirstOrDefaultAsync(x => x.ApiKey == apiKey);

            return application;
        });

        return application ?? throw new UnauthorizedAccessException();
    }
}
