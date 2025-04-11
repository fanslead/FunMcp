namespace FunMcp.Host.Dto;

public class ChatRequestDto
{
    public required string AgentId { get; set; }

    public required IEnumerable<ChatMessageDto> ChatMessages { get; set; }
}
