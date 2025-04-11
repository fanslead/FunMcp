﻿namespace FunMcp.Host.Factory;

public class AIClientFactory(IOptionsMonitor<AIOptions> options, ILoggerFactory loggerFactory) : IAIClientFactory
{
    private readonly Dictionary<string, IChatClient> ChatClientCache = [];
    public IChatClient CreateChatClient(string? name = null)
    {
        var aiName = name ?? options.CurrentValue.DefaultAI;

        if(ChatClientCache.TryGetValue(aiName, out var cacheClient))
        {
            return cacheClient;
        }

        if (options.CurrentValue.Configs.TryGetValue(aiName, out var clientConfig))
        {
            var type = clientConfig.Type;
            if(type.Equals("AzureOpenAI", StringComparison.OrdinalIgnoreCase))
            {
                var azureClient = new AzureOpenAIClient(new Uri(clientConfig.Endpoint!), new ApiKeyCredential(clientConfig.ApiKey!));
               
                var chatClient = azureClient.GetChatClient(clientConfig.DefaultModelId).AsIChatClient().AsBuilder().UseFunctionInvocation(loggerFactory: loggerFactory).Build();
                ChatClientCache.TryAdd(aiName, chatClient);
                return chatClient;
            }

            if(type.Equals("OpenAI", StringComparison.OrdinalIgnoreCase))
            {
                var openAIClient = new OpenAIClient(new ApiKeyCredential(clientConfig.ApiKey!), new OpenAIClientOptions
                {
                    Endpoint = new Uri(clientConfig.Endpoint!),
                });
                var chatClient = openAIClient.GetChatClient(clientConfig.DefaultModelId).AsIChatClient().AsBuilder().UseFunctionInvocation().Build();
                ChatClientCache.TryAdd(aiName, chatClient);
                return chatClient;
            }
        }
        
        throw new NotSupportedException($"{name} Not Supported.");
    }
}
