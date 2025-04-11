namespace FunMcp.Host.Factory;

public interface IAIClientFactory
{
    IChatClient CreateChatClient(string name);
}
