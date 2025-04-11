namespace FunMcp.Host.Dto;

public class AgentCreateDto
{
    [StringLength(64)]
    public required string ApplicationId { get; set; }

    [StringLength(64)]
    public required string Name { get; set; }

    [StringLength(256)]
    public string? Description { get; set; }

    [StringLength(4128)]
    public required string SystemPrompt { get; set; }

    [StringLength(64)]
    public required string AIServer { get; set; }

    [StringLength(64)]
    public required string ModelId { get; set; }

    public float? Temperature { get; set; }

    public int? MaxOutputTokens { get; set; }

    public float? TopP { get; set; }

    public List<string>? McpServers { get; set; }
}
