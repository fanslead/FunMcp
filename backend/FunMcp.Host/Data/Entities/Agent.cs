namespace FunMcp.Host.Data.Entities;

public class Agent
{
    [Key]
    [StringLength(64)]
    public required string Id { get; set; }

    [StringLength(64)]
    public required string ApplicationId { get; set; }

    public virtual Application? Application { get; set; }

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

    public virtual ICollection<AgentMcpServer>? ApplicationMcpServers { get; set; }
}
