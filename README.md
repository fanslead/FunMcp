# FunMcp

mcp

## 后端服务说明

- 环境：.NET 9、 EF Core

- 配置：

``` Json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning",
      "Microsoft.EntityFrameworkCore": "Warning"
    }
  },
  "AllowedHosts": "*",
  "AccessToken": "123456", // API 认证的AccessToken
  "AIConfig": {
    "DefaultAI": "Azure", //默认的AI 服务
    "Configs": {
      "Azure": { //AI 服务名称
        "Type": "AzureOpenAI", // 支持OpenAI和AzureOpenAI两种
        "Endpoint": "https://xxxxx.openai.azure.com/", // OpenAI和AzureOpenAI请求地址
        "ApiKey": "xxxxxxxxx", //OpenAI和AzureOpenAI的API Key
        "DefaultModelId": "gpt-4o-mini", //默认模型
        "Models": { //支持的模型列表
          "GPT-4o-mini": "gpt-4o-mini",
          "GPT-4o": "gpt-4o",
          "DeepSeekV3": "DeepSeek-V3"
        }
      }
    }
  }
}
```

## Chat API使用说明

### 使用前提

1. 创建 Application，获取应用api-key。

2. 创建Agent，绑定MCP Server

3. Http Request Headers添加 api-key header.

### API

- Post /api/chat 对话API

- Get /api/chat/agent/tools/{agentId} 根据agent获取绑定的MCP Server和tools

- Get /api/chat/agent/tools/{agentId}/{mcpId} 根据agent和指定mcp server获取该mcp server的tools

- Get /api/chat/agent/mcp/{agentId} 根据agent获取绑定的MCP Server信息
