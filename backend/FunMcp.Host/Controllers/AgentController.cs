namespace FunMcp.Host.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class AgentController(FunMcpDbContext dbContext, IMemoryCache memoryCache) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<List<Agent>>(StatusCodes.Status200OK)]
    public async Task<Ok<List<Agent>>> GetAgents(string applicationId)
    {
        var agents = await dbContext.Agents.Where(x => x.ApplicationId == applicationId).ToListAsync();
        return TypedResults.Ok(agents);
    }

    [HttpGet]
    [Route("{id}")]
    [ProducesResponseType<Agent>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<Results<Ok<Agent>, NotFound>> GetAgent(string id)
    {
        var agent = await dbContext.Agents.Include(x => x.ApplicationMcpServers!).ThenInclude(x => x.McpServer).FirstOrDefaultAsync(x => x.Id == id);
        if (agent == null)
        {
            return TypedResults.NotFound();
        }
        return TypedResults.Ok(agent);
    }

    [HttpPost]
    [ProducesResponseType<Created<Agent>>(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<Results<Created<Agent>, BadRequest>> CreateAgent([FromBody] AgentCreateDto dto)
    {
        var agent = new Agent
        {
            Name = dto.Name,
            Description = dto.Description,
            Id = Guid.NewGuid().ToString(),
            ApplicationId = dto.ApplicationId,
            AIServer = dto.AIServer,
            SystemPrompt = dto.SystemPrompt,
            ModelId = dto.ModelId
        };
        await dbContext.Agents.AddAsync(agent);
        await dbContext.SaveChangesAsync();

        if (dto.McpServers != null)
        {
            foreach (var mcpServerId in dto.McpServers)
            {
                dto.McpServerTools!.TryGetValue(mcpServerId, out var tools);
                var agentMcpServer = new AgentMcpServer
                {
                    AgentId = agent.Id,
                    McpServerId = mcpServerId,
                    McpServerTools = tools ?? []
                };
                await dbContext.AgentMcpServers.AddAsync(agentMcpServer);
            }
            await dbContext.SaveChangesAsync();
        }

        var location = Url.Action(nameof(CreateAgent), new { id = agent.Id }) ?? $"/{agent.Id}";

        return TypedResults.Created(location, agent);
    }

    [HttpPut]
    [Route("{id}")]
    [ProducesResponseType<NoContent>(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<Results<NotFound, NoContent>> UpdateAgent(string id, [FromBody] AgentUpdateDto dto)
    {
        var agent = await dbContext.Agents.FirstOrDefaultAsync(x => x.Id == id);
        if (agent == null)
        {
            return TypedResults.NotFound();
        }
        agent.Name = dto.Name;
        agent.Description = dto.Description;
        agent.SystemPrompt = dto.SystemPrompt;
        agent.ModelId = dto.ModelId;
        dbContext.Agents.Update(agent);
        await dbContext.SaveChangesAsync();

        if (dto.McpServers != null)
        {
            var existingAgentMcpServers = await dbContext.AgentMcpServers.Where(x => x.AgentId == id).ToListAsync();
            dbContext.AgentMcpServers.RemoveRange(existingAgentMcpServers);
            foreach (var mcpServerId in dto.McpServers)
            {
                dto.McpServerTools!.TryGetValue(mcpServerId, out var tools);
                var agentMcpServer = new AgentMcpServer
                {
                    AgentId = agent.Id,
                    McpServerId = mcpServerId,
                    McpServerTools = tools ?? []
                };
                await dbContext.AgentMcpServers.AddAsync(agentMcpServer);
            }
            await dbContext.SaveChangesAsync();
        }
        memoryCache.Remove($"{agent.ApplicationId}-{agent.Id}");
        return TypedResults.NoContent();
    }

    [HttpDelete]
    [Route("{id}")]
    [ProducesResponseType<NoContent>(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<Results<NotFound, NoContent>> DeleteAgent(string id)
    {
        var agent = await dbContext.Agents.FirstOrDefaultAsync(x => x.Id == id);
        if (agent == null)
        {
            return TypedResults.NotFound();
        }
        dbContext.Agents.Remove(agent);
        await dbContext.SaveChangesAsync();
        return TypedResults.NoContent();
    }
}
