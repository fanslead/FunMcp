﻿namespace FunMcp.Host.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class McpServerController(FunMcpDbContext dbContext, McpServerState mcpServerState) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<List<McpServer>>(StatusCodes.Status200OK)]
    public async Task<Ok<List<McpServer>>> GetMcpServers(string? filter, int pageNumber = 1,int pageSize = 50)
    {
        var query = dbContext.McpServers.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(filter))
        {
            query = query.Where(x => x.Name.Contains(filter) || x.Description.Contains(filter) || x.Tag.Contains(filter));
        }

        var mcpServers = await query
            .OrderBy(x=>x.Tag)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
        return TypedResults.Ok(mcpServers);
    }

    [HttpGet]
    [Route("{id}")]
    [ProducesResponseType<Ok<McpServer>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<Results<Ok<McpServer>, NotFound>> GetMcpServer(string id)
    {
        var mcpServer = await dbContext.McpServers.FirstOrDefaultAsync(x => x.Id == id);
        if (mcpServer == null)
        {
            return TypedResults.NotFound();
        }
        return TypedResults.Ok(mcpServer);
    }

    [HttpPost]
    [ProducesResponseType<Created<McpServer>>(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<Results<Created<McpServer>, BadRequest>> CreateMcpServer([FromBody] McpServerCreateDto dto)
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
            ConnectionTimeout = dto.ConnectionTimeout,
            UseStreamableHttp = dto.UseStreamableHttp ?? false,
        };
        await dbContext.McpServers.AddAsync(mcpServer);
        await dbContext.SaveChangesAsync();
        var location = Url.Action(nameof(CreateMcpServer), new { id = mcpServer.Id }) ?? $"/{mcpServer.Id}";
        return TypedResults.Created(location, mcpServer);
    }

    [HttpPost]
    [Route("import")]
    [ProducesResponseType<Created<McpServer>>(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<Results<Created<McpServer>, BadRequest>> CreateMcpServerFromJson([FromBody] ImportMcpServerDto dto)
    {
        var mcpServerDto = JsonSerializer.Deserialize<ImportMcpServerDeserializeDto>(dto.Json);

        if (mcpServerDto == null)
        {
            return TypedResults.BadRequest();
        }

        var mcpServer = new McpServer
        {
            Name = dto.Name,
            Id = Guid.NewGuid().ToString(),
            TransportType = string.IsNullOrWhiteSpace(mcpServerDto.Command) ? "sse" : "stdio",
            Command = mcpServerDto.Command,
            Arguments = mcpServerDto.Arguments,
            EnvironmentVariables = mcpServerDto.EnvironmentVariables,
            Endpoint = mcpServerDto.Endpoint,
            AdditionalHeaders = mcpServerDto.AdditionalHeaders,
        };

        await dbContext.McpServers.AddAsync(mcpServer);
        await dbContext.SaveChangesAsync();
        var location = Url.Action(nameof(CreateMcpServer), new { id = mcpServer.Id }) ?? $"/{mcpServer.Id}";
        return TypedResults.Created(location, mcpServer);
    }

    [HttpPost]
    [Route("Batch-Import")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<Results<Ok, BadRequest>> BatchCreateMcpServerFromJson([FromBody] BatchImportMcpServerDto dto)
    {
        var mcpServersJsonElement = JsonSerializer.Deserialize<JsonElement>(dto.Json);

        foreach (var item in mcpServersJsonElement.EnumerateObject())
        {
            if(item.Name.Equals("mcpServers", StringComparison.OrdinalIgnoreCase))
            {
                foreach (var mcpServerData in item.Value.EnumerateObject())
                {
                    var json = mcpServerData.Value.GetRawText();
                    var mcpServerDto = JsonSerializer.Deserialize<ImportMcpServerDeserializeDto>(json);

                    if (mcpServerDto == null)
                    {
                        return TypedResults.BadRequest();
                    }

                    var mcpServer = new McpServer
                    {
                        Name = mcpServerData.Name,
                        Id = Guid.NewGuid().ToString(),
                        TransportType = string.IsNullOrWhiteSpace(mcpServerDto.Command) ? "sse" : "stdio",
                        Command = mcpServerDto.Command,
                        Arguments = mcpServerDto.Arguments,
                        EnvironmentVariables = mcpServerDto.EnvironmentVariables,
                        Endpoint = mcpServerDto.Endpoint,
                        AdditionalHeaders = mcpServerDto.AdditionalHeaders,
                    };

                    await dbContext.McpServers.AddAsync(mcpServer);
                }
            }
        }

        await dbContext.SaveChangesAsync();

        return TypedResults.Ok();
    }

    [HttpPut]
    [Route("{id}")]
    [ProducesResponseType<NoContent>(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<Results<NotFound, NoContent>> UpdateMcpServer(string id, [FromBody] McpServerUpdateDto dto)
    {
        var mcpServer = await dbContext.McpServers.FirstOrDefaultAsync(x => x.Id == id);
        if (mcpServer == null)
        {
            return TypedResults.NotFound();
        }
        mcpServer.Name = dto.Name;
        mcpServer.Description = dto.Description;
        mcpServer.TransportType = dto.TransportType;
        mcpServer.Command = dto.Command;
        mcpServer.Arguments = dto.Arguments;
        mcpServer.EnvironmentVariables = dto.EnvironmentVariables;
        mcpServer.Endpoint = dto.Endpoint;
        mcpServer.AdditionalHeaders = dto.AdditionalHeaders;
        mcpServer.ConnectionTimeout = dto.ConnectionTimeout;
        mcpServer.UseStreamableHttp = dto.UseStreamableHttp ?? false;
        dbContext.McpServers.Update(mcpServer);
        await dbContext.SaveChangesAsync();
        return TypedResults.NoContent();
    }

    [HttpPut]
    [Route("Enable/{id}")]
    [ProducesResponseType<NoContent>(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<Results<NotFound, NoContent>> EnableMcpServer(string id)
    {
        var mcpServer = await dbContext.McpServers.FirstOrDefaultAsync(x => x.Id == id);
        if (mcpServer == null)
        {
            return TypedResults.NotFound();
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
                TransportMode = mcpServer.UseStreamableHttp ? HttpTransportMode.StreamableHttp : HttpTransportMode.AutoDetect,
                Endpoint = new Uri(mcpServer.Endpoint!),
                AdditionalHeaders = mcpServer.AdditionalHeaders,
                ConnectionTimeout = mcpServer.ConnectionTimeout.HasValue ? TimeSpan.FromSeconds(mcpServer.ConnectionTimeout.Value) : TimeSpan.FromSeconds(30),
            }));
        }

        return TypedResults.NoContent();
    }

    [HttpPut]
    [Route("Disable/{id}")]
    [ProducesResponseType<NoContent>(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<Results<NotFound, NoContent>> DisableMcpServer(string id)
    {
        var mcpServer = await dbContext.McpServers.FirstOrDefaultAsync(x => x.Id == id);
        if (mcpServer == null)
        {
            return TypedResults.NotFound();
        }
        mcpServer.Enable = false;
        dbContext.McpServers.Update(mcpServer);
        await dbContext.SaveChangesAsync();
        await mcpServerState.RemoveAsync(mcpServer.Id);
        return TypedResults.NoContent();
    }

    [HttpDelete]
    [Route("{id}")]
    [ProducesResponseType<NoContent>(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<Results<NotFound, NoContent>> DeleteMcpServer(string id)
    {
        var mcpServer = await dbContext.McpServers.FirstOrDefaultAsync(x => x.Id == id);
        if (mcpServer == null)
        {
            return TypedResults.NotFound();
        }
        dbContext.McpServers.Remove(mcpServer);
        await dbContext.SaveChangesAsync();
        await mcpServerState.RemoveAsync(mcpServer.Id);
        return TypedResults.NoContent();
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

    [HttpGet]
    [Route("tags")]
    public async Task<IList<string?>> GetMcpExistTag()
    {
        var tags = await dbContext.McpServers.Select(x => x.Tag).Distinct().ToListAsync();

        return tags;
    }
}
