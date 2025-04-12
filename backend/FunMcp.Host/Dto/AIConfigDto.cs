namespace FunMcp.Host.Dto;

public class AIConfigDto
{
    public required string Name { get; set; }

    public List<AIModelDto> Models { get; set; } = new ();
}

public class AIModelDto
{
    public required string Name { get; set; }

    public required string ModelId { get; set; }
}