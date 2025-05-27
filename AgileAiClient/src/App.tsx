import './App.css'
import { ThemeProvider } from '@lobehub/ui';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import MainLayout from './layouts/main-layout';
import { Suspense } from 'react';
import App from './page/app/page';
import AppDetail from './page/app-detail/page';
import Chat from './page/chat/page';
import Mcp from './page/mcp/page';
import McpDetail from './page/mcp-detail/page';
import { config } from './config';
import { message } from 'antd';

const router = createBrowserRouter([{
  element: <MainLayout />,
  children: [
    {
      path: '/', element: <Suspense fallback={'加载中'}>
        <App />
      </Suspense>
    },
    {
      path: '/app', element: <Suspense fallback={'加载中'}>
        <App />
      </Suspense>
    },
    {
      path: '/app/:id', element: <Suspense fallback={'加载中'}>
        <AppDetail />
      </Suspense>
    },
    {
      path: '/chat', element: <Suspense fallback={'加载中'}>
        <Chat />
      </Suspense>
    },
    {
      path: '/mcp', element: <Suspense fallback={'加载中'}>
        <Mcp />
      </Suspense>
    },
    {
      path: '/mcp/:id', element: <Suspense fallback={'加载中'}>
        <McpDetail />
      </Suspense>
    }
  ]
}]);




// 保存原始的 fetch 函数
const originalFetch = window.fetch;
// 重写 window.fetch
window.fetch = async (url: any, options: any) => {
  const token = "123456";//localStorage.getItem('token');
  const headers = new Headers(options.headers || {});

  // 添加或更新 Authorization 头
  if (token) {
    headers.append('Authorization', `Bearer ${token}`);
  }

  // 创建新的 options 对象，避免修改原始 options 对象
  const newOptions = { ...options, headers: headers };

  try {
    const baseUrl = config.FAST_API_URL;
    url = `${baseUrl}${url}`.replace(/([^:]\/)\/+/g, '$1');
    const response = await originalFetch(url, newOptions);

    if (response.status >= 200 && response.status < 300) {
      return response;
    }
    if (response.status === 401) {
      window.location.href = '/login';
    }
    if (response.status === 400) {
      const data = await response.json();
      message.error(data.message);
      throw new Error(data);
    } else if (response.status === 404) {
      message.error('请求的资源不存在');
      const data = await response.json();
      message.error(data.message);
      throw new Error(data);
    } else if (response.status === 500) {
      message.error('服务器错误');
      const data = await response.json();
      message.error(data.message);
      throw new Error(data);
    }
    const error = new Error();
    throw error;
  } catch (error) {
    console.error('Fetch error', error);
    throw error;
  }
};


export async function* fetchStream(url: string, requestBody: any, apiKey: string) {
  const token = "123456";//localStorage.getItem('token');
  const headers = {
    Authorization: `Bearer ${token}`,
    "api-key": apiKey,
    'Content-Type': 'application/json',
  };

  // 拼接baseUrl并且处理/重复问题
  const baseUrl = config.FAST_API_URL;
  url = `${baseUrl}${url}`.replace(/([^:]\/)\/+/g, '$1');
  const response = await originalFetch(url, {
    headers,
    method: 'POST',
    body: JSON.stringify(requestBody),
  });

  if (!response.body) {
    throw new Error('Response body is null');
  }


  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let done = false;
  let buffer = ''; // 用于存储未完成的 JSON 数据

  while (!done) {
    const { value, done: readerDone } = await reader.read();
    done = readerDone;

    if (value) {
      buffer += decoder.decode(value, { stream: true }); // 拼接 chunk 到 buffer
      
      // 查找完整的 JSON 对象
      try {
        // 尝试寻找最后一个合法的 JSON 结构
        // 假设每个响应块包含 JSON 数组
        if (buffer.trim().startsWith('[') && buffer.trim().endsWith(']')) {
          // 如果是完整的数组格式
          JSON.parse(buffer); // 尝试解析，如果失败会进入 catch
          yield buffer;
          buffer = ''; // 清空缓冲区
        } else {
          // 尝试找到最后一个完整的 JSON 数组
          const result = findLastCompleteJsonArray(buffer);
          if (result) {
            yield result.completeJson;
            buffer = result.remainder; // 保存剩余部分到缓冲区
          }
        }
      } catch (error) {
        console.warn('Stream chunk is not complete JSON yet, buffering...');
        // 继续累积数据到下一次迭代
      }
    }
  }
  
  // 处理最后可能剩余的数据
  if (buffer.trim()) {
    try {
      const fixedJson = fixIncompleteJson(buffer);
      yield fixedJson;
    } catch (err) {
      console.error('Could not fix final chunk of JSON data:', err);
    }
  }
}


/**
 * 查找最后一个完整的 JSON 数组
 */
function findLastCompleteJsonArray(text: string): { completeJson: string, remainder: string } | null {
  // 寻找可能的数组结束位置
  let depth = 0;
  let inString = false;
  let escapeNext = false;
  let arrayStart = -1;
  let arrayEnd = -1;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    
    if (char === '\\' && inString) {
      escapeNext = true;
      continue;
    }
    
    if (char === '"' && !escapeNext) {
      inString = !inString;
      continue;
    }
    
    if (inString) continue;
    
    if (char === '[') {
      if (depth === 0) {
        arrayStart = i;
      }
      depth++;
    } else if (char === ']') {
      depth--;
      if (depth === 0) {
        arrayEnd = i;
      }
    }
  }
  
  if (arrayStart !== -1 && arrayEnd !== -1 && arrayStart < arrayEnd) {
    const completeJson = text.substring(arrayStart, arrayEnd + 1);
    const remainder = text.substring(arrayEnd + 1);
    
    try {
      // 验证提取的JSON是否有效
      JSON.parse(completeJson);
      return { completeJson, remainder };
    } catch (error) {
      return null;
    }
  }
  
  return null;
}

/**
 * 修复不完整的 JSON 数据
 */
function fixIncompleteJson(jsonString: string): string {
  // 如果是空字符串，返回空数组
  if (!jsonString.trim()) {
    return '[]';
  }
  
  try {
    // 尝试直接解析，如果成功则返回原始字符串
    JSON.parse(jsonString);
    return jsonString;
  } catch (error) {
    console.warn('JSON parse error, attempting to fix:', error);
    
    // 如果看起来是个数组
    if (jsonString.trim().startsWith('[')) {
      // 找到最后一个完整的对象
      let bracketCount = 0;
      let inString = false;
      let escapeNext = false;
      let lastValidPos = -1;
      
      for (let i = 0; i < jsonString.length; i++) {
        const char = jsonString[i];
        
        if (escapeNext) {
          escapeNext = false;
          continue;
        }
        
        if (char === '\\' && inString) {
          escapeNext = true;
          continue;
        }
        
        if (char === '"' && !escapeNext) {
          inString = !inString;
          continue;
        }
        
        if (inString) continue;
        
        if (char === '{') {
          bracketCount++;
        } else if (char === '}') {
          bracketCount--;
          if (bracketCount === 0) {
            lastValidPos = i;
          }
        }
      }
      
      if (lastValidPos !== -1) {
        // 找到了完整的对象，在它后面添加 "]"
        return jsonString.substring(0, lastValidPos + 1) + ']';
      }
      
      // 如果没找到完整对象，但是数组已经开始
      return jsonString + ']';
    } 
    
    // 如果不是数组格式
    return '[]'; // 返回空数组作为后备
  }
}

function AppPage() {
  return (
    <ThemeProvider defaultThemeMode='dark'>
      <RouterProvider router={router} />
    </ThemeProvider>
  )
}



export default AppPage

