using System.Text;

namespace FunMcp.Host.Controllers;

[Route("api/[controller]")]
[ApiController]
public class ChatController(FunMcpDbContext dbContext, McpServerState mcpServerState, IMemoryCache memoryCache, IAIClientFactory aiClientFactory) : ControllerBase
{
    private static string MCP_PROMPT = """
        ## MCP协议调用规范
        ### **MCP协议调用**  
        **背景说明**：  
        你正在使用**Model Context Protocol (MCP)**，这是一种标准化协议，用于连接大语言模型（LLMs）与各类数据源和工具（如本地文件、数据库、API服务等），类似“AI领域的USB-C接口”。通过MCP，你可以安全、灵活地调用预构建的工具集成（MCP服务器），并支持在不同模型供应商间切换。


        ### **任务处理流程**  
        1. **需求分析**：  
           首先判断当前任务是否需要调用外部工具或数据源（如查询文件、调用API、操作数据库等）。若需要，**必须通过MCP协议**发起调用，禁止直接硬编码工具逻辑。  

        2. **MCP调用规则**：  
           - **格式要求**：使用 `<mcp_call>` 和 `</mcp_call>` 标签包裹调用指令，确保参数符合JSON格式。  
           - **服务器选择**：从预定义的MCP服务器列表中选择合适的工具（如 `local-file-server` 访问本地文件，`api-gateway` 调用远程API）。  
           - **参数传递**：明确指定工具所需参数（如文件路径、API端点、查询条件等），敏感数据需通过安全通道传递（参考MCP数据安全最佳实践）。  

        3. **多轮调用支持**：  
           - 若工具返回结果不完整或需要进一步处理，可发起多轮MCP调用。  
           - 每次调用后，需解析返回数据（如JSON、文本流等），判断是否需要继续调用或直接整理为自然语言回答。  

        4. **结果输出**：  
           - 若已获取完整结果，直接整理为用户易懂的格式（如表格、摘要、可视化链接等）。  
           - 若调用失败或参数错误，需返回清晰的错误信息（如“无法连接到MCP服务器”“缺少必填参数”），并提示可能的解决方案。


        ### **MCP调用示例**  
        **场景**：查询本地CSV文件中的销售数据并生成统计报告。  
        ```plaintext
        <mcp_call>
        {
          "server": "local-file-server",
          "action": "read_csv",
          "parameters": {
            "file_path": "/data/sales_2023.csv",
            "query": "SELECT * WHERE region='North' LIMIT 10",
            "output_format": "json"
          }
        }
        </mcp_call>
        ```  
        **处理逻辑**：  
        1. 通过 `local-file-server` 读取指定CSV文件，执行SQL查询获取北区前10条数据。  
        2. 解析返回的JSON数据，计算销售额总和、平均值等指标。  
        3. 若需要更详细分析，可再次调用 `data-analytics-server` 进行深度处理。


        ### **注意事项**  
        - **协议兼容性**：确保调用的MCP服务器已注册到当前主机（如Claude Desktop、自定义AI工具），并支持所需功能。  
        - **数据隐私**：所有本地数据访问均受MCP安全策略约束，禁止未经授权的敏感信息传输。  
        - **错误处理**：调用失败时，优先检查服务器状态、参数格式及网络连接，避免重复无效请求。


        ### **示例对话流程**  
        **用户提问**：“请分析我本地文件夹中的用户行为日志，找出登录失败率最高的时间段。”  
        1. **AI响应**：  
           ```plaintext
           <mcp_call>
           {
             "server": "local-file-server",
             "action": "read_log",
             "parameters": {
               "file_path": "/logs/user_behavior.log",
               "log_type": "login_failure",
               "time_range": "2023-10-01至2023-10-31"
             }
           }
           </mcp_call>
           ```  
        2. **工具返回**：日志数据片段（JSON格式）。  
        3. **AI二次调用**：  
           ```plaintext
           <mcp_call>
           {
             "server": "data-analytics-server",
             "action": "statistical_analysis",
             "parameters": {
               "data": "[工具返回数据]",
               "metric": "failure_rate",
               "group_by": "hour"
             }
           }
           </mcp_call>
           ```  
        4. **最终回答**：“根据分析，2023年10月每天凌晨2点至4点的登录失败率最高，达15.2%……”

        """.Trim();
    [HttpPost]
    public async Task<IAsyncEnumerable<ChatResponseUpdate>> ChatAsync([FromBody] ChatRequestDto chatRequest, CancellationToken cancellationToken = default)
    {
        var application = await CheckApiKey();

        var agent = await GetAgentAsync(chatRequest.AgentId, application!.Id);

        var dbMcpServers = await GetMcpServers(agent!.Id);

        var tools = new List<McpClientTool>();
        var systemPrompt = new StringBuilder(agent!.SystemPrompt);
        foreach (var dbMcpServer in dbMcpServers)
        {
            var mcpTools = mcpServerState.McpServerTools[dbMcpServer.McpServerId].ToList();
            if(dbMcpServer.McpServerTools.Count > 0)
            {
                mcpTools = mcpTools.Where(t => dbMcpServer.McpServerTools.Contains(t.Name)).ToList();
            }
            tools.AddRange(mcpTools);
        }

        if(tools.Count > 0)
        {
            systemPrompt.AppendLine("## Tool_Use：");
            systemPrompt.AppendLine("可用的MCP工具：");
            foreach (var tool in tools)
            {
                systemPrompt.AppendLine($"- {tool.Name}: {tool.Description}");
                if(tool.JsonSchema.TryGetProperty("properties", out var properties))
                {
                    systemPrompt.AppendLine($"  参数信息：{properties.ToString()}");
                }
            }

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
