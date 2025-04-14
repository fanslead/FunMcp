namespace FunMcp.Host.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class AgentController(FunMcpDbContext dbContext, IMemoryCache memoryCache) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAgents(string applicationId)
    {
        var agents = await dbContext.Agents.Where(x => x.ApplicationId == applicationId).ToListAsync();
        return Ok(agents);
    }

    [HttpGet]
    [Route("{id}")]
    public async Task<IActionResult> GetAgent(string id)
    {
        var agent = await dbContext.Agents.Include(x => x.ApplicationMcpServers!).ThenInclude(x => x.McpServer).FirstOrDefaultAsync(x => x.Id == id);
        if (agent == null)
        {
            return NotFound();
        }
        return Ok(agent);
    }

    [HttpPost]
    public async Task<IActionResult> CreateAgent([FromBody] AgentCreateDto dto)
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

        return CreatedAtAction(nameof(GetAgent), new { id = agent.Id }, agent);
    }

    [HttpPut]
    [Route("{id}")]
    public async Task<IActionResult> UpdateAgent(string id, [FromBody] AgentUpdateDto dto)
    {
        var agent = await dbContext.Agents.FirstOrDefaultAsync(x => x.Id == id);
        if (agent == null)
        {
            return NotFound();
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
        return NoContent();
    }

    [HttpDelete]
    [Route("{id}")]
    public async Task<IActionResult> DeleteAgent(string id)
    {
        var agent = await dbContext.Agents.FirstOrDefaultAsync(x => x.Id == id);
        if (agent == null)
        {
            return NotFound();
        }
        dbContext.Agents.Remove(agent);
        await dbContext.SaveChangesAsync();
        return NoContent();
    }
}
