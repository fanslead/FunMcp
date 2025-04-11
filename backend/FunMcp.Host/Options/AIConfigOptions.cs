namespace FunMcp.Host.Options;

public class AIOptions
{
    public required string DefaultAI { get; set; }

    public Dictionary<string, AIConfigOptions> Configs { get; set; } = new();
}

public class AIConfigOptions
{
    public required string Type { get; set; }

    public string? Endpoint { get; set; }

    public string? ApiKey { get; set; }

    public string? DefaultModelId { get; set; }

    public Dictionary<string, string> Models { get; set; } = new();
}
