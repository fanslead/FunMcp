namespace FunMcp.Host.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class McpServerController(FunMcpDbContext dbContext, McpServerState mcpServerState) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetMcpServers(int pageNumber = 1,int pageSize = 50)
    {
        var mcpServers = await dbContext.McpServers
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
        return Ok(mcpServers);
    }

    [HttpGet]
    public async Task<IActionResult> GetMcpServer(string id)
    {
        var mcpServer = await dbContext.McpServers.FirstOrDefaultAsync(x => x.Id == id);
        if (mcpServer == null)
        {
            return NotFound();
        }
        return Ok(mcpServer);
    }

    [HttpPost]
    public async Task<IActionResult> CreateMcpServer([FromBody] McpServerCreateDto dto)
    {
        var mcpServer = new McpServer
        {
            Name = dto.Name,
            Description = dto.Description,
            Id = Guid.NewGuid().ToString(),
            TransportType = dto.TransportType,
            Command = dto.Command,
            Arguments = dto.Arguments,
            EnvironmentVariables = dto.EnvironmentVariables,
            Endpoint = dto.Endpoint,
            AdditionalHeaders = dto.AdditionalHeaders,
            MaxReconnectAttempts = dto.MaxReconnectAttempts,
            ReconnectDelay = dto.ReconnectDelay,
            ConnectionTimeout = dto.ConnectionTimeout
        };
        await dbContext.McpServers.AddAsync(mcpServer);
        await dbContext.SaveChangesAsync();
        return CreatedAtAction(nameof(GetMcpServer), new { id = mcpServer.Id }, mcpServer);
    }

    [HttpPut]
    [Route("{id}")]
    public async Task<IActionResult> UpdateMcpServer(string id, [FromBody] McpServerUpdateDto dto)
    {
        var mcpServer = await dbContext.McpServers.FirstOrDefaultAsync(x => x.Id == id);
        if (mcpServer == null)
        {
            return NotFound();
        }
        mcpServer.Name = dto.Name;
        mcpServer.Description = dto.Description;
        mcpServer.TransportType = dto.TransportType;
        mcpServer.Command = dto.Command;
        mcpServer.Arguments = dto.Arguments;
        mcpServer.EnvironmentVariables = dto.EnvironmentVariables;
        mcpServer.Endpoint = dto.Endpoint;
        mcpServer.AdditionalHeaders = dto.AdditionalHeaders;
        mcpServer.MaxReconnectAttempts = dto.MaxReconnectAttempts;
        mcpServer.ReconnectDelay = dto.ReconnectDelay;
        mcpServer.ConnectionTimeout = dto.ConnectionTimeout;
        dbContext.McpServers.Update(mcpServer);
        await dbContext.SaveChangesAsync();
        return NoContent();
    }

    [HttpPut]
    [Route("Enable/{id}")]
    public async Task<IActionResult> EnableMcpServer(string id)
    {
        var mcpServer = await dbContext.McpServers.FirstOrDefaultAsync(x => x.Id == id);
        if (mcpServer == null)
        {
            return NotFound();
        }
        mcpServer.Enable = true;
        dbContext.McpServers.Update(mcpServer);
        
        await dbContext.SaveChangesAsync();

        if (mcpServer.TransportType.Equals("Stdio", StringComparison.OrdinalIgnoreCase))
        {
            await mcpServerState.CreateStdioAsync(id, new StdioClientTransport(new StdioClientTransportOptions
            {
                Name = mcpServer.Name,
                Command = mcpServer.Command!,
                Arguments = mcpServer.Arguments,
                EnvironmentVariables = mcpServer.EnvironmentVariables,
            }));
        }

        if (mcpServer.TransportType.Equals("Sse", StringComparison.OrdinalIgnoreCase))
        {
            await mcpServerState.CreateSseAsync(id, new SseClientTransport(new SseClientTransportOptions
            {
                Name = mcpServer.Name,
                Endpoint = new Uri(mcpServer.Endpoint!),
                AdditionalHeaders = mcpServer.AdditionalHeaders,
                MaxReconnectAttempts = mcpServer.MaxReconnectAttempts ?? 3,
                ReconnectDelay = mcpServer.ReconnectDelay.HasValue ? TimeSpan.FromSeconds(mcpServer.ReconnectDelay.Value) : TimeSpan.FromSeconds(5),
                ConnectionTimeout = mcpServer.ConnectionTimeout.HasValue ? TimeSpan.FromSeconds(mcpServer.ConnectionTimeout.Value) : TimeSpan.FromSeconds(30),
            }));
        }

        return NoContent();
    }

    [HttpPut]
    [Route("Disable/{id}")]
    public async Task<IActionResult> DisableMcpServer(string id)
    {
        var mcpServer = await dbContext.McpServers.FirstOrDefaultAsync(x => x.Id == id);
        if (mcpServer == null)
        {
            return NotFound();
        }
        mcpServer.Enable = false;
        dbContext.McpServers.Update(mcpServer);
        await dbContext.SaveChangesAsync();
        await mcpServerState.RemoveAsync(mcpServer.Id);
        return NoContent();
    }

    [HttpDelete]
    [Route("{id}")]
    public async Task<IActionResult> DeleteMcpServer(string id)
    {
        var mcpServer = await dbContext.McpServers.FirstOrDefaultAsync(x => x.Id == id);
        if (mcpServer == null)
        {
            return NotFound();
        }
        dbContext.McpServers.Remove(mcpServer);
        await dbContext.SaveChangesAsync();
        await mcpServerState.RemoveAsync(mcpServer.Id);
        return NoContent();
    }

    [HttpGet]
    [Route("tools/{id}")]
    public IList<McpClientToolDto> GetTools(string id)
    {
        if (mcpServerState.McpServerTools.TryGetValue(id, out var tools))
        {
            return [.. tools.Select(x => new McpClientToolDto { Name = x.Name, Description = x.Description })];
        }

        return [];
    }
}
