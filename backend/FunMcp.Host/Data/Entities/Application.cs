namespace FunMcp.Host.Data.Entities;

public class Application
{
    [Key]
    [StringLength(64)]
    public required string Id { get; set; }

    [StringLength(64)]
    public required string Name { get; set; }

    [StringLength(256)]
    public string? Description { get; set; }

    [StringLength(64)]
    public required string ApiKey { get; set; }
}
